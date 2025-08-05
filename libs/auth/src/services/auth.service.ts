import { ConflictException, Injectable, Logger, 
  UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, PasswordService } from '../../../core/src';
import { DeleteAccountDto, LoginDto } from '../dto';
import { RegisterDto } from '../dto';
import { ResetPasswordDto } from '../dto';
import { VerifyEmailDto } from '../dto';
import { Setup2FADto, Verify2FADto } from '../dto';
import { Tokens, JwtPayload, TempToken } from '../interfaces';
import { InvalidTokenException, IUser, UserNotFoundException } from '../../../common/src';
import { JwtSecretType } from '../strategies';
import { EmailService } from '../../../common/src/email/email.service';
import { TotpService } from './totp.service';
import { Role } from '@prisma/client';

/**
 * AuthService handles authentication-related operations such as registration,
 * login, email verification, and password reset.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly totpService: TotpService,
  ) {}

  /**
   * Registers a new user and sends a verification email.
   * @param dto - The registration data transfer object containing user details.
   * @returns A promise that resolves when the registration is complete.
   */
  async register(dto: RegisterDto): Promise<{user: Partial<IUser>}> {
    try {
      const userRoles = dto.roles && dto.roles.length > 0
      ? dto.roles.map(role => role.toUpperCase() as Role)
      : [Role.USER];
    
    const user = await this.userRepository.create({ ...dto, roles: userRoles });
    const verificationToken = this.generateVerificationToken(user.id!);
    const tokens = await this.generateTokens(user);

    // send verifiction email
    this.logger.log(`Sending verification email to ${user.email}`);
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user?.name ?? 'User'
    );
    this.logger.log('Verification email sent');

    delete user.password;
    return {  user, ...tokens } 
    } catch (error) {
      this.logger.error(`Registration error: ${error?.message}`);
      throw new BadRequestException('Failed to register user');
    }
  }

  /**
   * Logs in a user and returns access and refresh tokens.
   * @param dto - The login data transfer object containing email and password.
   * @returns A promise that resolves with the tokens if login is successful.
   * @throws UnauthorizedException if the credentials are invalid or email is not verified.
   */
  async login(dto: LoginDto): Promise<{ user: Partial<IUser> } | Tokens | TempToken> {
    try {
      // check if user exists
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        throw new BadRequestException('Invalid email or password');
      }

      if (!user.verified) {
        throw new UnauthorizedException('Please verify your email first');
      }

      const isPasswordValid = await this.passwordService.compare(
        dto.password,
        user.password,
      );
      if (!isPasswordValid) {
        this.logger.debug(`Password not match`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate a temporary token for 2FA verification
        const tempToken = this.generateTempToken(user.id);
        this.logger.log(`2FA required for user ${user.id}, generated temp token`);
        return {
          require2FA: true,
          tempToken,
        };
      }
	
      this.logger.log(`User ${user.id} id logged in.`);
      const tokens = await this.generateTokens(user);
      const { password, ...retUser } = user 
      return {
        ...tokens,
        user: retUser
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.debug('Unauthorized error occurred.');
        throw error;
      }
      this.logger.error(`Login error: ${error?.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Verifies 2FA code and completes login
   * @param dto - The 2FA verification data
   * @param tempToken - The temporary token from login
   * @returns Tokens if verification is successful
   */
  async verify2FA(dto: Verify2FADto, tempToken: string): Promise<{ user: Partial<IUser> } & Tokens> {
    try {
      // Verify the temp token
      const payload = this.jwtService.verify(tempToken, {
        secret: this.configService.get<string>(JwtSecretType.TEMP),
        maxAge: '5m', // Temp token expires in 5 minutes
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new UnauthorizedException('2FA not enabled for this user');
      }

      // Get encryption key from config
      const encryptionKey = this.configService.get('TOTP_ENCRYPTION_KEY');
      if (!encryptionKey) {
        throw new Error('TOTP encryption key not configured');
      }

      // Decrypt the stored secret
      const decryptedSecret = this.totpService.decryptSecret(user.twoFactorSecret, encryptionKey);

      // Verify the TOTP code
      const isValid = this.totpService.verifyToken(decryptedSecret, dto.totpCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }

      this.logger.log(`2FA verified for user ${user.id}`);
      const tokens = await this.generateTokens(user);
      const { password, ...retUser } = user;
      
      return {
        ...tokens,
        user: retUser
      };
    } catch (error) {
      this.logger.error(`2FA verification error: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid 2FA code');
    }
  }

  /**
   * Initiates 2FA setup by generating a secret and QR code
   * @param userId - The user ID
   * @returns Object containing secret, QR code URL, and otpauth URL
   */
  async initiate2FASetup(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate new TOTP secret
    const totpData = this.totpService.generateSecret(user.email);
    
    this.logger.log(`2FA setup initiated for user: ${userId}`);
    return totpData;
  }

  /**
   * Completes 2FA setup by verifying the code and storing the secret
   * @param userId - The user ID
   * @param dto - The 2FA setup data containing the TOTP code
   * @param secret - The TOTP secret to store
   * @returns Success message
   */
  async complete2FASetup(userId: string, dto: Setup2FADto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Verify the TOTP code
    const isValid = this.totpService.verifyToken(dto.secret, dto.totpCode);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Get encryption key from config
    const encryptionKey = this.configService.get('TOTP_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('TOTP encryption key not configured');
    }

    // Encrypt the secret
    const encryptedSecret = this.totpService.encryptSecret(dto.secret, encryptionKey);

    // Store the encrypted secret and enable 2FA
    await this.userRepository.toggle2FA(userId, true, encryptedSecret);
    
    // Send confirmation email
    await this.emailService.sendTwoFactorSetupEmail(
      user.email,
      user.name
    );

    this.logger.log(`2FA setup completed for user: ${userId}`);
  }

  /**
   * Sets up 2FA for a user (legacy method - now uses the new flow)
   */
  async setupTwoFactor(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Enable 2FA in the database
    await this.userRepository.toggle2FA(userId, true);
    
    // Send confirmation email
    await this.emailService.sendTwoFactorSetupEmail(
      user.email,
      user.name
    );

    this.logger.log(`2FA enabled for user: ${userId}`);
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new BadRequestException('No user found for ID:', userId);
    }

    const {password, ...sanitizedUser} = user;
    return sanitizedUser;
  }

  /**
   * Verifies a user's email using a verification token.
   * @param dto - The verification data transfer object containing the token.
   * @returns A promise that resolves when the email is verified.
   * @throws UnauthorizedException if the token is invalid.
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const payload = this.jwtService.verify(dto.token, {
      secret: this.configService.get('JWT_VERIFICATION_SECRET'),
    });

    await this.userRepository.verifyEmail(payload.sub);
  }

  /**
   * Refreshes access and refresh tokens for a user.
   * @param userId - The ID of the user for whom to refresh tokens.
   * @param refreshToken - The refresh token provided by the user.
   * @returns A promise that resolves with the new tokens.
   * @throws UnauthorizedException if the user is not found.
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    // First, get user and verify they exist
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
  
    try {
      // Verify the refresh token is valid
      const isValidToken = await this.userRepository.verifyRefreshToken(userId, refreshToken);
      if (!isValidToken) {
        this.logger.debug(`Refresh token invalid ${refreshToken}`);
        // If token is invalid, we should invalidate all refresh tokens for this user
        // This prevents attacks using stolen refresh tokens
        await this.userRepository.invalidateRefreshToken(userId);
        throw new InvalidTokenException();
      }
  
      // IMPORTANT: Invalidate the old token BEFORE generating new ones
      // This closes the security window
      await this.userRepository.invalidateRefreshToken(userId);
  
      // Only after invalidating the old token do we generate new ones
      const tokens = await this.generateTokens(user);
      
      // Store the new refresh token
      await this.userRepository.storeRefreshToken(user.id, tokens.refreshToken);
  
      return tokens;
    } catch (error) {
      this.logger.error(
        `Refresh token error for user ${userId}: ${error.message}`,
        error.stack
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // If anything goes wrong during the refresh process,
      // invalidate all tokens for this user as a safety measure
      await this.userRepository.invalidateRefreshToken(userId)
        .catch(err => console.error('Failed to invalidate tokens:', err));
        
      throw new UnauthorizedException('Access denied');
    }
  }

  /**
   * Handles password reset request and sends email
   */
  async handlePasswordResetRequest(email: string): Promise<void> {
    // check that user exists
    const user = await this.userRepository.findByEmail(email);
    
    // Send email even if user not found to prevent email enumeration
    if (user) {
      const resetToken = this.generatePasswordResetToken(user.id);
      this.logger.log(`Sending verification email to ${user.email}`);
      await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.name
      );
    }
    
    // Log for security audit
    this.logger.log(`Password reset requested for email: ${email}`);
  }

  /**
   * Resets a user's password using a reset token.
   * @param dto - The reset password data transfer object containing the token and new password.
   * @returns A promise that resolves when the password is reset.
   * @throws UnauthorizedException if the token is invalid.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
        maxAge: '1h',
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid reset token');
      }

      const hashedPassword = await this.passwordService.hash(dto.newPassword);
      await this.userRepository.updatePassword(user.id, hashedPassword);
      this.logger.debug(`Password updated successfully ${hashedPassword}`);
      
      // Send confirmation email
      await this.emailService.sendPasswordChangeNotification(
        user.email,
        user.name
      );

      this.logger.log(`Password successfully reset for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  /**
   * Disables 2FA for a user
   */
  async disableTwoFactor(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // disable 2FA in the database
    await this.userRepository.toggle2FA(userId, false);

    this.logger.log(`2FA disabled for user: ${userId}`);
  }

  /**
   * Handles secure account deletion
   */
  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify password before deletion
    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Perform deletion
    await this.userRepository.softDeleteUser(userId);
    
    // Send confirmation email
    await this.emailService.sendAccountDeletionEmail(
      user.email,
      user.name
    );

    this.logger.log(`Account deleted for user: ${userId}`);
  }

  /**
   * Handles suspicious login detection and notification
   */
  async handleSuspiciousLogin(
    userId: string,
    loginDetails: {
      ipAddress: string;
      deviceInfo: string;
      location?: string;
    }
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return; // Silent return for security
    }

    await this.emailService.sendSecurityAlert(
      user.email,
      user.name,
      {
        timestamp: new Date(),
        ...loginDetails
      }
    );

    this.logger.warn(`Suspicious login detected for user: ${userId}`, loginDetails);
  }

  /**
   * Logs out a user by invalidating their refresh token.
   * @param userId - The ID of the user to log out.
   * @throws UnauthorizedException if the user is not found.
   */
  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.userRepository.invalidateRefreshToken(userId);
  }

  /**
   * Generates a verification token for a user.
   * @param userId - The ID of the user for whom to generate the token.
   * @returns A string representing the generated verification token.
   */
  private generateVerificationToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get(JwtSecretType.VERIFICATION),
        expiresIn: '1d',
      },
    );
  }

  /**
   * Generates access and refresh tokens for a user.
   * @param user - The user object for whom to generate tokens.
   * @returns An object containing the access and refresh tokens.
   */
  private async generateTokens(user: IUser): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles as Role[],
      ...(user.name && {name: user.name}),
    };

    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>(JwtSecretType.ACCESS),
        expiresIn: '15m',
      });
  
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>(JwtSecretType.REFRESH),
        expiresIn: '7d',
      });

      
    // Store the refresh token
    await this.userRepository.storeRefreshToken(user.id, refreshToken);
  
      return {
        accessToken,
        refreshToken,
      };
    } catch(error) {
      // Log the error for debugging purposes
      console.error('Error generating tokens:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

   /**
   * Generates a time-limited token for password reset
   */
   private generatePasswordResetToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_RESET_SECRET'),
        expiresIn: '1h', // Token expires in 1 hour
      }
    );
  }

  /**
   * Generates a temporary token for 2FA verification.
   * @param userId - The ID of the user for whom to generate the token.
   * @returns A string representing the generated temporary token.
   */
  private generateTempToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>(JwtSecretType.TEMP),
        expiresIn: '5m', // Temp token expires in 5 minutes
      }
    );
  }

  /**
   * Resends verification email to an unverified user
   * @param email - The email address of the user
   * @returns A promise that resolves when the email is sent
   * @throws BadRequestException if the user is already verified or doesn't exist
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    if (user.verified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = this.generateVerificationToken(user.id);
    this.logger.log(`Resending verification email to ${user.email}`);
    
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user?.name ?? 'User'
    );
    
    this.logger.log('Verification email resent successfully');
  }
}

import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, PasswordService } from '../../../core/src';
import { DeleteAccountDto, LoginDto } from '../dto';
import { RegisterDto } from '../dto';
import { ResetPasswordDto } from '../dto';
import { VerifyEmailDto } from '../dto';
import { Tokens, JwtPayload, TempToken } from '../interfaces';
import { InvalidTokenException, IUser, UserNotFoundException } from '../../../common/src';
import { JwtSecretType } from '../strategies';
import { EmailService } from '../../../common/src/email/email.service';

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
  ) {}

  /**
   * Registers a new user and sends a verification email.
   * @param dto - The registration data transfer object containing user details.
   * @returns A promise that resolves when the registration is complete.
   */
  async register(dto: RegisterDto): Promise<{user: Partial<IUser>}> {
    const user = await this.userRepository.create(dto);
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
  }

  /**
   * Logs in a user and returns access and refresh tokens.
   * @param dto - The login data transfer object containing email and password.
   * @returns A promise that resolves with the tokens if login is successful.
   * @throws UnauthorizedException if the credentials are invalid or email is not verified.
   */
  async login(dto: LoginDto): Promise<Tokens> {
    try {
      // check if user exists
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        throw new BadExceptionRequest('Invalid email or password');
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
      }
	
      this.logger.log(`User ${user.id} id logged in.`);
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
	user
      };
    } catch (error) {
      
      if (error instanceof UnauthorizedException) {
	this.logger.debug('Unathorized error occured.');
        throw UnauthorizedException('Unauthorized');
      }
      this.logger.error(`Login error: ${error?.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
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
      await this.userRepository.storeRefreshToken(userId, tokens.refreshToken);
  
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
   * Sets up 2FA for a user
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
}

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, PasswordService } from '../../../core/src';
import { LoginDto } from '../dto';
import { RegisterDto } from '../dto';
import { ResetPasswordDto } from '../dto';
import { VerifyEmailDto } from '../dto';
import { Tokens, JwtPayload } from '../interfaces';
import { IUser } from '../../../common/src';
import { JwtSecretType } from '../strategies';

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
  ) {}

  /**
   * Registers a new user and sends a verification email.
   * @param dto - The registration data transfer object containing user details.
   * @returns A promise that resolves when the registration is complete.
   */
  async register(dto: RegisterDto): Promise<{user: Partial<IUser>}> {
    const user = await this.userRepository.create(dto);
    const verificationToken = this.generateVerificationToken(user.id!);

    // TODO: send email
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    delete user.password
    return {  user }
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
        throw new Error;
      }

      const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.password,
      );
      if (!isPasswordValid) {
        throw new Error;
      }

       // if (!user.verified) {
      //   throw new UnauthorizedException('Please verify your email first');
      // }

      return await this.generateTokens(user);
    } catch (error) {
      this.logger.error(`Error comparing password`);
      throw new UnauthorizedException('Invalid credentials');
    }
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
      throw new UnauthorizedException('Access denied');  // Don't reveal if user exists
    }
  
    try {
      // Verify the refresh token is valid
      const isValidToken = await this.userRepository.verifyRefreshToken(userId, refreshToken);
      if (!isValidToken) {
        // If token is invalid, we should invalidate all refresh tokens for this user
        // This prevents attacks using stolen refresh tokens
        await this.userRepository.invalidateRefreshToken(userId);
        throw new UnauthorizedException('Access denied');
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
      // Log the error but don't expose internal details to the client
      console.error('Token refresh failed:', error);
      
      // If anything goes wrong during the refresh process,
      // invalidate all tokens for this user as a safety measure
      await this.userRepository.invalidateRefreshToken(userId)
        .catch(err => console.error('Failed to invalidate tokens:', err));
        
      throw new UnauthorizedException('Access denied');
    }
  }

  /**
   * Resets a user's password using a reset token.
   * @param dto - The reset password data transfer object containing the token and new password.
   * @returns A promise that resolves when the password is reset.
   * @throws UnauthorizedException if the token is invalid.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const payload = this.jwtService.verify(dto.token, {
      secret: this.configService.get('JWT_RESET_SECRET'),
    });

    const hashedPassword = await this.passwordService.hash(dto.newPassword);
    await this.userRepository.updatePassword(payload.sub, hashedPassword);
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
}

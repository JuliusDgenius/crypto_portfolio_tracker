import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, PasswordService } from '../../../core/src';
import { LoginDto } from '../dto';
import { RegisterDto } from '../dto';
import { ResetPasswordDto } from '../dto';
import { VerifyEmailDto } from '../dto';
import { Tokens, JwtPayload } from '../interfaces';
import { IUser, TokenUser } from '../../../core/src/user/interfaces';

/**
 * AuthService handles authentication-related operations such as registration,
 * login, email verification, and password reset.
 */
@Injectable()
export class AuthService {
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
  async register(dto: RegisterDto): Promise<{user: Partial<IUser>, token: string}> {
    const user = await this.userRepository.create(dto);
    const token = this.generateVerificationToken(user.id!);
    delete user.password
    return { user, token }
  }

  /**
   * Logs in a user and returns access and refresh tokens.
   * @param dto - The login data transfer object containing email and password.
   * @returns A promise that resolves with the tokens if login is successful.
   * @throws UnauthorizedException if the credentials are invalid or email is not verified.
   */
  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Retrieved user:', {
      id: user.id,
      email: user.email,
      verified: user.verified,
      // Don't log sensitive data like password
    });

    try {
      const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  } catch(error) {
    console.error('Error comparing password', error);
    throw new Error('Authentication failed');
  }

    // if (!user.verified) {
    //   throw new UnauthorizedException('Please verify your email first');
    // }
    
    if (!user.id) {
      throw new Error('User ID is missing');
    }
    if (!user.email) {
      throw new Error('User email is missing');
    }

    console.log('Generating tokens for user:', {
      id: user.id,
      email: user.email,
      verified: user.verified
    });
    
    return this.generateTokens(user);
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
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
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
        secret: this.configService.get('JWT_VERIFICATION_SECRET'),
        expiresIn: '1d',
      },
    );
  }

  /**
   * Generates access and refresh tokens for a user.
   * @param user - The user object for whom to generate tokens.
   * @returns An object containing the access and refresh tokens.
   */
  private generateTokens(user: IUser): Tokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      // Only include name if it exists in the user object
      ...(user.name && {name: user.name}),
    };

    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      });
  
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });
  
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

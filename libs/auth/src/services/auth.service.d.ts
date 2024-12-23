import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@libs/common';
import { UserRepository, PasswordService } from '@libs/core';
import { LoginDto } from '@libs/auth';
import { RegisterDto } from '@libs/auth';
import { ResetPasswordDto } from '@libs/auth';
import { VerifyEmailDto } from '@libs/auth';
import { Tokens } from '@libs/auth';
export declare class AuthService {
    private readonly userRepository;
    private readonly passwordService;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    constructor(userRepository: UserRepository, passwordService: PasswordService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(dto: RegisterDto): Promise<void>;
    login(dto: LoginDto): Promise<Tokens>;
    verifyEmail(dto: VerifyEmailDto): Promise<void>;
    refreshTokens(userId: string, refreshToken: string): Promise<Tokens>;
    resetPassword(dto: ResetPasswordDto): Promise<void>;
    logout(userId: string): Promise<void>;
    private generateVerificationToken;
    private generateTokens;
}

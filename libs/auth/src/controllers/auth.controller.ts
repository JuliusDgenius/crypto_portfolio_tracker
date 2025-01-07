import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Req,
    Logger,
    UnauthorizedException,
    Query,
    Delete,
  } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtRefreshGuard  } from '../guards';
import { RegisterDto, LoginDto, ResetPasswordDto, RequestPasswordResetDto, DeleteAccountDto } from '../dto';
import { JwtAuthGuard } from '../guards';
import { TempToken, Tokens } from '../';
import { CurrentUser } from '../decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiHeader
} from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ 
        summary: 'Register a new user',
        description: 'Creates a new user account with the provided email and password.'
    })
    @ApiBody({ 
        type: RegisterDto,
        description: 'User registration credentials'
    })
    @ApiResponse({ 
      status: 201, 
      description: 'User registered successfully', 
      schema: {
        properties: {
          user: {
            type: 'object',
              properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'John Doe' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
    })
    @ApiResponse({ 
        status: 201, 
        description: 'User registered successfully', 
        schema: {
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        email: { type: 'string', example: 'user@example.com' },
                        name: { type: 'string', example: 'John Doe' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Invalid registration data or email already exists'
    })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ 
        summary: 'Login a user',
        description: 'Authenticates a user and returns access and refresh tokens'
    })
    @ApiBody({ 
        type: LoginDto,
        description: 'User login credentials'
    })
    @ApiResponse({ 
      status: 200, 
      description: 'Login successful', 
      schema: {
        properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' }
      }
    }
    })
    @ApiUnauthorizedResponse({ 
      description: 'Invalid credentials or email not verified'
    })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<Tokens> {
      return this.authService.login(loginDto);
    }

    @Post('verify-email')
    @ApiOperation({ 
        summary: 'Verify user email',
        description: 'Verifies a user\'s email address using the verification token sent to their email'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Email verified successfully',
        schema: {
            properties: {
                message: { type: 'string', example: 'Email verified successfully' }
            }
        }
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Invalid or expired verification token'
    })
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Query('token') token: string) {
        await this.authService.verifyEmail({ token });
        return { message: 'Email verified successfully' };
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @ApiOperation({ 
      summary: 'Refresh access token',
      description: 'Issues a new access token using a valid refresh token'
    })
    @ApiSecurity('JWT-auth')
    @ApiResponse({ 
      status: 200, 
      description: ' successful', 
      schema: {
        properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' }
      }
    }
    })
    @ApiUnauthorizedResponse(
      { description: 'Invalid or expired refresh token' 
    })
    async refreshToken(
      @CurrentUser() user: User & { refreshToken: string }
    ) {
      return this.authService.refreshTokens(user.id, user.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiSecurity('JWT-auth')
    @ApiOperation({ 
      summary: 'Logout a user',
      description: 'Invalidates the user\'s refresh token'
    })
    @ApiResponse({ 
      status: 200, 
      description: 'Logout successful',
      schema: {
        properties: {
        message: { type: 'string', example: 'User logged out successfully' }
      }
    }
    })
    @HttpCode(HttpStatus.OK)
    @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
    async logout(@CurrentUser('id') userId: string) {
      this.authService.logout(userId);
      return { message: 'User is logged out successfully' };
    }

    @Post('password-reset-request')
    @ApiOperation({
      summary: 'Request password reset',
      description: 'Initiates password reset process by sending an email with reset instructions'
    })
    @ApiBody({
      type: RequestPasswordResetDto,
      description: 'Email address for password reset'
    })
    @ApiResponse({
      status: 200,
      description: 'Password reset email sent if account exists'
    })
    @HttpCode(HttpStatus.OK)
    @ApiSecurity('JWT-auth')
    async requestPasswordReset(
      @Body() dto: RequestPasswordResetDto
    ): Promise<{ message: string }> {
      await this.authService.handlePasswordResetRequest(dto.email);
      return { 
        message: 'If an account exists with this email, you will receive reset instructions.' 
      };
    }

    @Post('reset-password')
    @ApiOperation({
      summary: 'Reset password',
      description: 'Resets password using token from email'
    })
    @ApiBody({
      type: ResetPasswordDto,
      description: 'Reset token and new password'
    })
    @ApiResponse({
      status: 200,
      description: 'Password successfully reset'
    })
    @ApiResponse({
      status: 401,
      description: 'Invalid or expired reset token'
    })
    @HttpCode(HttpStatus.OK)
    @ApiSecurity('JWT-auth')
    async resetPassword(
      @Body() dto: ResetPasswordDto
    ): Promise<{ message: string }> {
      await this.authService.resetPassword(dto);
      return { message: 'Password has been reset successfully' };
    }

    @Post('setup-2fa')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
      summary: 'Enable 2FA',
      description: 'Enables two-factor authentication for the user'
    })
    @ApiResponse({
      status: 200,
      description: '2FA enabled successfully'
    })
    @HttpCode(HttpStatus.OK)
    @ApiSecurity('JWT-auth')
    async setupTwoFactor(
      @CurrentUser('id') userId: string
    ): Promise<{ message: string }> {
      await this.authService.setupTwoFactor(userId);
      return { message: 'Two-factor authentication has been enabled' };
    }

    @Post('disable-2fa')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
      summary: 'Disable 2FA',
      description: 'Disables two-factor authentication for the user'
    })
    @ApiResponse({
      status: 200,
      description: '2FA disabled successfully'
    })
    @HttpCode(HttpStatus.OK)
    @ApiSecurity('JWT-auth')
    async disableTwoFactor(@CurrentUser('id') userId: string) {
      await this.authService.disableTwoFactor(userId);
      return { message: "Two-factor authentication has been disabled" };
    }

    @Delete('account/delete')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
      summary: 'Delete account',
      description: 'Permanently deletes user account'
    })
    @ApiBody({
      type: DeleteAccountDto,
      description: 'Password confirmation for account deletion'
    })
    @ApiResponse({
      status: 200,
      description: 'Account deleted successfully'
    })
    async deleteAccount(
      @CurrentUser('id') userId: string,
      @Body() dto: DeleteAccountDto
    ): Promise<{ message: string }> {
      console.log("UserId", userId)
      await this.authService.deleteAccount(userId, dto);
      return { message: 'Your account has been deleted successfully' };
    }
}
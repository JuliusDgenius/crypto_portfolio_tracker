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
  } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtRefreshGuard  } from '../guards';
import { RegisterDto, LoginDto } from '../dto';
import { JwtAuthGuard } from '../guards';
import { Tokens } from '../';
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
    async login(@Body() loginDto: LoginDto): Promise<Tokens> {
      return this.authService.login(loginDto);
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
    @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
    async logout(@CurrentUser('id') userId: string) {
      console.log("userId", userId);
      this.authService.logout(userId);
      return { message: 'User is logged out successfully' };
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @ApiOperation({ 
      summary: 'Refresh access token',
      description: 'Issues a new access token using a valid refresh token'
    })
    @ApiSecurity('JWT-auth')
    @ApiHeader({
      name: 'Authorization',
      description: 'Enter Refresh token to get a new access token in the key icon right of this page.',
    })
    @ApiUnauthorizedResponse(
      { description: 'Invalid or expired refresh token' 
    })
    async refreshToken(
      @CurrentUser() user: User & { refreshToken: string }
    ) {
      console.log('userId received: ', user.id);
      console.log('Refresh token received: ', user.refreshToken);

      return this.authService.refreshTokens(user.id, user.refreshToken);
    }
}
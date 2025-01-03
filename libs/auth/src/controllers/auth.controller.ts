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
        console.log("I am hit with:", registerDto);
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
        console.log("You hit me with", loginDto);
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
        this.authService.logout(userId);
        return { message: 'User is logged out successfully' };
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    // @ApiBearerAuth('refresh-token')
    @ApiSecurity('refresh-token')
    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @ApiSecurity('refresh-token')
    async refreshTokens(
      @CurrentUser('id') userId: string,
      @CurrentUser('refreshToken') refreshToken: string
      ) {
        try {
          this.logger.debug(`Refresh request received for user: ${userId}`);
                
          const tokens = await this.authService.refreshTokens(userId, refreshToken);
          
          this.logger.debug('Tokens refreshed successfully');
      return tokens;
    } catch(error) {
      this.logger.error('Error refreshing tokens:', error);
      throw new UnauthorizedException('Failed to refresh tokens');
    }
}
}
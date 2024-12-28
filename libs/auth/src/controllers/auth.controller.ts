import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Req,
  } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtRefreshGuard  } from '../guards';
import { RegisterDto, LoginDto } from '../dto';
import { JwtAuthGuard } from '../guards';
import { Tokens } from '../';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ 
        status: 201, 
        description: 'User registered successfully', 
        schema: { example: { id: '123', email: 'user@example.com', name: 'user123' } }
    })
    async register(@Body() registerDto: RegisterDto) {
        console.log("I am hit with:", registerDto);
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login a user' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ 
        status: 200, 
        description: 'User logged in successfully', 
        schema: { example: { accessToken: 'someAccessToken', refreshToken: 'someRefreshToken' } }
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto): Promise<Tokens> {
        console.log("You hit me with", loginDto);
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout a user' })
    @ApiResponse({ 
        status: 200, 
        description: 'User logged out successfully', 
        schema: { example: { message: 'User logged out successfully' } }
    })
    async logout(@Req() req: any) {
        const userId = req.user.sub;
        return this.authService.logout(userId);
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh user tokens' })
    @ApiResponse({ 
        status: 200, 
        description: 'Tokens refreshed successfully', 
        schema: { example: { accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' } }
    })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshTokens(@Req() req: any) {
        const userId = req.user.sub;
        const refreshToken = req.user.refreshToken;
        return this.authService.refreshTokens(userId, refreshToken);
    }
}
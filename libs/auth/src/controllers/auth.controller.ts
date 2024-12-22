// libs/auth/src/controllers/auth.controller.ts
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
  import { AuthService } from '@lib/auth';
  import { RegisterDto } from '@lib/auth';
  import { LoginDto } from '@lib/auth';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { RefreshTokenGuard } from '../guards/refresh-token.guard';
  import { Public } from '../decorators/public.decorator';
  import { Tokens } from '../shared/interfaces/tokens.interface';
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
      return this.authService.register(registerDto);
    }
  
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<Tokens> {
      return this.authService.login(loginDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: any) {
      const userId = req.user.sub;
      return this.authService.logout(userId);
    }
  
    @Public()
    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Req() req: any) {
      const userId = req.user.sub;
      const refreshToken = req.user.refreshToken;
      return this.authService.refreshTokens(userId, refreshToken);
    }
  }
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
  import { AuthService, JwtRefreshGuard } from '@libs/auth';
  import { RegisterDto } from '@libs/auth';
  import { LoginDto } from '@libs/auth';
  import { JwtAuthGuard } from '@libs/auth';
  import { Tokens } from '@libs/auth';
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
      return this.authService.register(registerDto);
    }
  
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
  
    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Req() req: any) {
      const userId = req.user.sub;
      const refreshToken = req.user.refreshToken;
      return this.authService.refreshTokens(userId, refreshToken);
    }
  }
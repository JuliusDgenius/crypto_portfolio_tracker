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
  import { AuthService } from '../services/auth.service';
  import { JwtRefreshGuard  } from '../guards';
  import { RegisterDto } from '../dto';
  import { LoginDto } from '../dto';
  import { JwtAuthGuard } from '../guards';
  import { Tokens } from '../';
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
      console.log("I am hit with:", registerDto);
      return this.authService.register(registerDto);
    }
  
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<Tokens> {
      console.log("You hit me with", loginDto);
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
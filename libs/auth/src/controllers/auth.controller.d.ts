import { AuthService } from '@libs/auth';
import { RegisterDto } from '@libs/auth';
import { LoginDto } from '@libs/auth';
import { Tokens } from '@libs/auth';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<any>;
    login(loginDto: LoginDto): Promise<Tokens>;
    logout(req: any): Promise<any>;
    refreshTokens(req: any): Promise<any>;
}

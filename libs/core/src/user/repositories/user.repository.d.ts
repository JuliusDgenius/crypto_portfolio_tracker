import { PrismaService } from '@libs/database';
import { IUser } from '../interfaces/user.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PasswordService } from '../services/password.service';
export declare class UserRepository {
    private readonly prisma;
    private readonly passwordService;
    constructor(prisma: PrismaService, passwordService: PasswordService);
    create(dto: CreateUserDto): Promise<Partial<IUser>>;
    findById(id: string): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
    findByUsername(username: string): Promise<IUser | null>;
    update(id: string, dto: UpdateUserDto): Promise<IUser>;
    updatePassword(id: string, hashedPassword: string): Promise<IUser>;
    verifyEmail(id: string): Promise<IUser>;
    toggle2FA(id: string, enabled: boolean): Promise<IUser>;
    updatePreferences(id: string, preferences: Partial<IUser['preferences']>): Promise<IUser>;
    invalidateRefreshToken(userId: string): Promise<void>;
}

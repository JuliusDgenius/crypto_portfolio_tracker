import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { IUser } from '../interfaces/user.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PasswordService } from '../services/password.service';

/**
 * UserRepository handles the data access for user-related operations.
 */
@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Creates a new user with the provided data.
   * @param dto - The data transfer object containing user details.
   * @returns The created user.
   */
  async create(dto: CreateUserDto): Promise<IUser> {
    const hashedPassword = await this.passwordService.hash(dto.password);
    
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        verified: false,
        twoFactorEnabled: false,
        password: hashedPassword,
        preferences: {
          currency: 'USD',
          theme: 'light',
          notifications: {
            email: true,
            push: false,
            priceAlerts: false,
          },
        },
      },
    });
  }

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user to find.
   * @returns The user if found, otherwise null.
   */
  async findById(id: string): Promise<IUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Finds a user by their email.
   * @param email - The email of the user to find.
   * @returns The user if found, otherwise null.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds a user by their username.
   * @param username - The username of the user to find.
   * @returns The user if found, otherwise null.
   */
  async findByUsername(username: string): Promise<IUser | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Updates a user's details.
   * @param id - The ID of the user to update.
   * @param dto - The data transfer object containing updated user details.
   * @returns The updated user.
   */
  async update(id: string, dto: UpdateUserDto): Promise<IUser> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Updates a user's password.
   * @param id - The ID of the user whose password is to be updated.
   * @param hashedPassword - The new hashed password.
   * @returns The updated user.
   */
  async updatePassword(id: string, hashedPassword: string): Promise<IUser> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Verifies a user's email.
   * @param id - The ID of the user to verify.
   * @returns The updated user with verified email.
   */
  async verifyEmail(id: string): Promise<IUser> {
    return this.prisma.user.update({
      where: { id },
      data: { verified: true },
    });
  }

  /**
   * Toggles the two-factor authentication setting for a user.
   * @param id - The ID of the user.
   * @param enabled - Whether to enable or disable 2FA.
   * @returns The updated user.
   */
  async toggle2FA(id: string, enabled: boolean): Promise<IUser> {
    return this.prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: enabled },
    });
  }

  /**
   * Updates a user's preferences.
   * @param id - The ID of the user whose preferences are to be updated.
   * @param preferences - The new preferences to apply.
   * @returns The updated user.
   */
  async updatePreferences(id: string, preferences: Partial<IUser['preferences']>): Promise<IUser> {
    const user = await this.findById(id);
    
    return this.prisma.user.update({
      where: { id },
      data: {
        preferences: {
          ...user.preferences,
          ...preferences,
        },
      },
    });
  }
}
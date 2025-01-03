import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/src';
import { IUser, JsonPreferences } from '../../../../core/src/user/interfaces';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PasswordService } from '../services/password.service';
import { Prisma, User } from '@prisma/client';
import { transformValidatePrismaUser } from '../../../../common/src';
import * as crypto from 'node:crypto';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: CreateUserDto): Promise<IUser> { // Return IUser
    if (!dto.email || !dto.password) {
      throw new Error('Email and password are required.');
    }

    // Check if user exists already
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException("Email already exist");
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create our data object with the correct shape
    const createData: Prisma.UserCreateInput = {
      email: dto.email,
      name: dto.name || null,
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
    };

    try {
      const prismaUser = await this.prisma.user.create({
        data: createData as unknown as Prisma.UserCreateInput,
      });

      const user = transformValidatePrismaUser(prismaUser);
      if (!user) {
        console.error("Failed to validate created user data.");
        return null; // Return null if validation fails
      }
      return user;

    } catch (error) {
      console.error("Error creating user:", error);
      return null; // Return null in case of database errors
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
        const prismaUser = await this.prisma.user.findUnique({ where: { id } });
        return prismaUser ? transformValidatePrismaUser(prismaUser) : null;
    } catch (error) {
        console.error("Error finding user by ID:", error);
        return null;
    }
}


  async findByEmail(email: string): Promise<IUser | null> {
      try {
          const prismaUser = await this.prisma.user.findUnique({ where: { email } });
          return prismaUser ? transformValidatePrismaUser(prismaUser) : null;
      } catch (error) {
          console.error("Error finding user by email:", error);
          return null;
      }
  }

  async findByUsername(name: string): Promise<IUser | null> {
      try {
          const prismaUser = await this.prisma.user.findFirst({
            where: { name }
          });
          return prismaUser ? transformValidatePrismaUser(prismaUser) : null;
      } catch (error) {
          console.error("Error finding user by username:", error);
          return null;
      }
  }

  async update(id: string, dto: UpdateUserDto): Promise<IUser | null> {
    try {
        const prismaUser = await this.prisma.user.update({
          where: {
            id
          },
          data: dto
        });
        return transformValidatePrismaUser(prismaUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return null;
    }
}

  async updatePassword(
    id: string, hashedPassword: string
  ): Promise<IUser | null> {
    try {
        const prismaUser = await this.prisma.user.update({
          where: {
            id
          },
          data: { password: hashedPassword }
        });
        return transformValidatePrismaUser(prismaUser);
    } catch (error) {
        console.error("Error updating user password:", error);
        return null;
    }
}

  async verifyEmail(id: string): Promise<IUser | null> {
    try {
        const prismaUser = await this.prisma.user.update({
          where: {
            id
          },
          data: { verified: true }
        });
        return transformValidatePrismaUser(prismaUser);
    } catch (error) {
        console.error("Error verifying user email:", error);
        return null;
    }
}

  async toggle2FA(id: string, enabled: boolean): Promise<IUser | null> {
    try {
        const prismaUser = await this.prisma.user.update({
          where: { id }, data: { twoFactorEnabled: enabled }
        });
        return transformValidatePrismaUser(prismaUser);
    } catch (error) {
        console.error("Error toggling 2FA:", error);
        return null;
    }
}

  async updatePreferences(
    id: string, preferences: Partial<JsonPreferences>
  ): Promise<IUser | null> {
      try {
          const user = await this.findById(id);
          if (!user) {
              return null;
          }
          const updatedPreferences: JsonPreferences = {
              ...user.preferences,
              ...preferences,
          };
          const prismaUser = await this.prisma.user.update({
              where: { id },
              data: { preferences: updatedPreferences as unknown as Prisma.JsonValue },
          });
          return transformValidatePrismaUser(prismaUser);
      } catch (error) {
          console.error("Error updating user preferences:", error);
          return null;
      }
  }

  /**
   * Verifies if a refresh token is valid for a specific user.
   * Checks if the token exists, isn't expired, and hasn't been revoked.
   * 
   * @param userId - The ID of the user
   * @param token - The plaintext refresh token to verify
   * @returns boolean indicating if the token is valid
   */
  async verifyRefreshToken(userId: string, token: string): Promise<boolean> {
    try {
      // Hash the provided token for comparison
      const tokenHash = this.hashToken(token);

      this.logger.debug(`Verifying token for user ${userId}`);

      // Find the token in the database
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId,
          tokenHash,
          isRevoked: false,
          expiresAt: {
            gt: new Date() // Token must not be expired
          }
        }
      });

      if (!storedToken) {
        this.logger.debug('No valid token found in database');
        return false;
      }

      // Check if any tokens in this family have been used for refresh
      // If so, this could indicate a token reuse attack
      const possibleReuse = await this.prisma.refreshToken.findFirst({
        where: {
          familyId: storedToken.familyId,
          createdAt: {
            gt: storedToken.createdAt 
          }
        }
      });

      if (possibleReuse) {
        this.logger.warn(
          `Token reuse detected for family ${storedToken.familyId}`
        );
        // Token reuse detected - revoke all tokens in this family
        await this.prisma.refreshToken.updateMany({
          where: { familyId: storedToken.familyId },
          data: { isRevoked: true }
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error verifying refresh token:', error);
      return false;
    }
  }

  /**
   * Stores a refresh token for a specific user.
   * The token is stored as a hash to prevent token leakage from the database.
   * Each user can have multiple active refresh tokens (one per device/session).
   * 
   * @param userId - The ID of the user
   * @param token - The plaintext refresh token
   */
  async storeRefreshToken(userId: string, token: string): Promise<void> {
    // Generate a hash of the refresh token
    const tokenHash = this.hashToken(token);
    
    // Get current timestamp for token creation time
    const createdAt = new Date();
    
    // Calculate expiration date (7 days from creation)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Generate a unique family ID for this token
    // Token families help prevent parallel refresh token attacks
    const familyId = crypto.randomBytes(16).toString('hex');

    try {
      await this.prisma.refreshToken.create({
        data: {
          userId,
          tokenHash,
          familyId,
          createdAt,
          expiresAt,
          isRevoked: false
        }
      });

      // Optional: Implement maximum tokens per user
      // Remove oldest tokens if user has too many
      const maxTokensPerUser = 5;
      const userTokenCount = await this.prisma.refreshToken.count({
        where: { userId }
      });

      if (userTokenCount > maxTokensPerUser) {
        await this.prisma.refreshToken.deleteMany({
          where: {
            userId,
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
            }
          }
        });
      }
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  async invalidateRefreshToken(userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: { 
          userId,
          isRevoked: false
        },
        data: { isRevoked: true }
      });
    } catch (error) {
      console.error("Error invalidating refresh token:", error);
      throw error
    }
  }

  /**
   * Creates a secure hash of the refresh token.
   * Uses SHA-256 with a pepper for additional security.
   * 
   * @param token - The plaintext token to hash
   * @returns The hashed token
   */
  private hashToken(token: string): string {
    // In production, this pepper should be in environment variables
    const pepper = process.env.PEPPER_SECRET || "your_pepper_secret";
    return crypto
      .createHash('sha256')
      .update(token + pepper)
      .digest('hex');
  }
}

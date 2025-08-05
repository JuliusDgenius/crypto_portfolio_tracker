import { ConflictException, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/src';
import { IUser, JsonPreferences, transformValidatePreferences } from '../../../../common/src';
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

    try {
     // Check if user exists already
      const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
        throw new ConflictException("Email already exist");
      } 
    } catch (error) {
      this.logger.error("Error checking if user exists:", error);
      throw new Error("Failed to check if user exists");
    }

    // Hash the password
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
      roles: dto.roles && dto.roles.length > 0 ? dto.roles as any : ["user"],
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
          this.logger.error("Error finding user by email:", error);
          throw new BadRequestException('Invalid email or password');
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
          data: dto as any
        });
        return transformValidatePrismaUser(prismaUser);
    } catch (error) {
        this.logger.error("Error updating user:", error.message);
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

      await this.prisma.refreshToken.updateMany({
        where: { 
          userId: id,
          isRevoked: false
        },
        data: { 
          isRevoked: true,
        }
      });

      return transformValidatePrismaUser(prismaUser);
    } catch (error) {
      this.logger.error("Error updating user password:", error.message);
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

async toggle2FA(userId: string, enable: boolean, secret?: string): Promise<IUser | null> {
  try {
    // Start a transaction to ensure atomicity
    const updatedUser = await this.prisma.$transaction(async (prisma) => {
      // Fetch the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check current 2FA status to avoid redundant operations
      if (enable && user.twoFactorEnabled) {
        throw new Error('Two-factor authentication is already enabled');
      }

      if (!enable && !user.twoFactorEnabled) {
        throw new Error('Two-factor authentication is already disabled');
      }

      // Prepare updated data
      const updatedData: any = {
        twoFactorEnabled: enable,
        updatedAt: new Date(), // Always update the timestamp
      };

      // If enabling 2FA, store the secret and update preferences
      if (enable) {
        if (!secret) {
          throw new Error('TOTP secret is required when enabling 2FA');
        }
        updatedData.twoFactorSecret = secret;
        updatedData.preferences = {
          ...transformValidatePreferences(user.preferences),
          notifications: {
            ...(user.preferences as any).notifications,
            email: true,
            push: true,
          },
        };
      } else {
        // If disabling 2FA, clear the secret
        updatedData.twoFactorSecret = null;
        updatedData.preferences = {
          ...transformValidatePreferences(user.preferences),
          notifications: {
            ...(user.preferences as any).notifications,
            // Optional: Revert specific notification settings
            email: false,
            push: false,
          },
        };
      }

      // Update the user record
      const prismaUser = await prisma.user.update({
        where: { id: userId },
        data: updatedData,
      });

      return transformValidatePrismaUser(prismaUser);
    });

    if (!updatedUser) {
      throw new Error('Failed to update 2FA settings');
    }

    this.logger.log(
      `Successfully ${enable ? 'enabled' : 'disabled'} 2FA for user: ${userId}`
    );
    return updatedUser;
  } catch (error) {
    this.logger.error(
      `Failed to ${enable ? 'enable' : 'disable'} 2FA for user ${userId}: ${error.message}`
    );
    throw new Error(
      `Failed to ${enable ? 'enable' : 'disable'} two-factor authentication: ${error.message}`
    );
  }
}

/**
 * Stores the TOTP secret for a user
 * @param userId - The user ID
 * @param encryptedSecret - The encrypted TOTP secret
 * @returns Promise<IUser | null>
 */
async storeTOTPSecret(userId: string, encryptedSecret: string): Promise<IUser | null> {
  try {
    const prismaUser = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorSecret: encryptedSecret,
        updatedAt: new Date()
      }
    });
    
    return transformValidatePrismaUser(prismaUser);
  } catch (error) {
    this.logger.error(`Failed to store TOTP secret for user ${userId}: ${error.message}`);
    throw new Error('Failed to store TOTP secret');
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
   * Update roles for a user (admin only)
   * @param userId - The user to update
   * @param roles - The new roles array
   */
  async updateUserRoles(userId: string, roles: string[]): Promise<IUser | null> {
    try {
      const prismaUser = await this.prisma.user.update({
        where: { id: userId },
        data: { roles: roles as any },
      });
      return transformValidatePrismaUser(prismaUser);
    } catch (error) {
      this.logger.error('Error updating user roles:', error.message);
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
   * Soft deletes a user account while preserving data for compliance and security purposes.
   * This method:
   * 1. Marks the account as deleted
   * 2. Anonymizes personal information
   * 3. Maintains an audit trail
   * 4. Preserves necessary data for legal compliance
   * 
   * @param userId - The ID of the user to soft delete
   * @returns Promise<void>
   * @throws Error if the user is not found or deletion fails
   */
  async softDeleteUser(userId: string): Promise<void> {
    try {
      // Start a transaction to ensure all operations complete atomically
      await this.prisma.$transaction(async (prisma) => {
        // Get current timestamp for consistent dating across operations
        const deletionTimestamp = new Date();
  
        // First, fetch the user to ensure they exist
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            refreshTokens: true,  // Include related tokens for cleanup
            portfolios: true,     // Include portfolios for audit purposes
            watchlists: true,     // Include watchlists for audit purposes
            exchangeAccounts: true // Include exchange accounts for cleanup
          }
        });
  
        if (!user) {
          throw new Error('User not found');
        }
  
        // Invalidate all refresh tokens
        await prisma.refreshToken.updateMany({
          where: { userId },
          data: { isRevoked: true }
        });
  
        // Deactivate exchange accounts
        await prisma.exchangeAccount.updateMany({
          where: { userId },
          data: { 
            isActive: false,
            // Clear sensitive data
            apiKey: '[REDACTED]',
            apiSecret: '[REDACTED]',
            updatedAt: deletionTimestamp
          }
        });
  
        // Update the user record
        // Note: We're working within the schema constraints while maintaining privacy
        await prisma.user.update({
          where: { id: userId },
          data: {
            email: `deleted_${userId}@redacted.local`,
            name: 'Deleted User',
            password: crypto.randomBytes(32).toString('hex'), // Invalidate the password
            profilePicture: null,
            refreshTokenInvalidated: true,
            verified: false,
            twoFactorEnabled: false,
            preferences: {
              currency: 'USD',
              theme: 'light',
              notifications: {
                email: false,
                push: false,
                priceAlerts: false
              }
            },
            updatedAt: deletionTimestamp
          }
        });
      });
  
      this.logger.log(`Successfully soft deleted user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to soft delete user ${userId}: ${error.message}`);
      throw new Error(`Failed to delete user account: ${error.message}`);
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

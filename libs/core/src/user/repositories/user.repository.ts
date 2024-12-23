import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { IUser, JsonPreferences } from '@libs/core';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PasswordService } from '../services/password.service';
import { Prisma, User } from '@prisma/client'; // Correct import
import { transformValidatePrismaUser } from '../../../../common/src'; // Adjust path

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: CreateUserDto): Promise<Partial<IUser> | null> { // Return IUser | null
    if (!dto.email || !dto.password) {
      throw new Error('Email and password are required.');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const defaultPreferences: Record<string, any> = { // Type the preferences
      currency: 'USD',
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        priceAlerts: false,
      },
    };

    // Define the shape of our create input data
    type CreateUserData = {
      email: string;
      name: string | null;
      verified: boolean;
      twoFactorEnabled: boolean;
      password: string;
      preferences: Prisma.JsonValue;
    };

    // Create our data object with the correct shape
    const createData: CreateUserData = {
      email: dto.email,
      name: dto.name || null,
      verified: false,
      twoFactorEnabled: false,
      password: hashedPassword,
      preferences: defaultPreferences as Prisma.JsonValue,
    };


    const userData: Omit<Prisma.UserCreateInput, 'id'> = {
      email: dto.email,
      name: dto.name || null,
      verified: false,
      twoFactorEnabled: false,
      password: hashedPassword,
      preferences: defaultPreferences as Prisma.JsonValue, // Use typed preferences
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

  async invalidateRefreshToken(userId: string): Promise<void> {
    // Implement your refresh token invalidation logic here.
    try {
      // Example: setting a flag in the database
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenInvalidated: true }, // Add this field to your schema
      });
    } catch (error) {
      console.error("Error invalidating refresh token:", error);
      // Consider re-throwing the error or handling it appropriately in your application
      throw error
    }
  }
}
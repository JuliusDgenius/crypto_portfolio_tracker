// libs/core/src/user/dto/update-user.dto.ts
import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';
import { UserPreferences } from '../interfaces/user.interface';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsObject()
  @IsOptional()
  preferences?: Partial<UserPreferences>;
}
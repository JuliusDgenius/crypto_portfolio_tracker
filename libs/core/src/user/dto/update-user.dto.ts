// libs/core/src/user/dto/update-user.dto.ts
import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';
import { JsonPreferences } from '../interfaces';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsObject()
  @IsOptional()
  preferences?: Partial<JsonPreferences>;
}
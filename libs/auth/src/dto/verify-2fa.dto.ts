import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ 
    description: 'TOTP code from authenticator app', 
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  totpCode: string;
} 
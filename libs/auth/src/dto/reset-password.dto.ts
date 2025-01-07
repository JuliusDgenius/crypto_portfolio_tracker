import { IsString, MinLength, Matches, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token', example: 'someResetToken' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password for the user', example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address for password reset'
  })
  email: string;
}

export class DeleteAccountDto {
  @IsString()
  @ApiProperty({
    description: 'Current password for verification'
  })
  password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Reason for deletion (optional)',
    required: false
  })
  reason?: string;
}
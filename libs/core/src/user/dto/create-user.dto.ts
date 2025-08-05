import { IsEmail, IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Username for the user', example: 'user123' })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  name: string;

  @ApiProperty({ description: 'User password', example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter,\
       one lowercase letter, and one number',
  })
  password: string;

  /**
   * RBAC roles assigned to the user (optional, defaults to ['user'])
   */
  @ApiProperty({
    description: 'Roles assigned to the user',
    example: [Role.USER], required: false, isArray: true, type: String
  })
  roles?: Role[];
}
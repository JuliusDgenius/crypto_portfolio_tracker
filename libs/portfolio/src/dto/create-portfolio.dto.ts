import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'Name of the portfolio',
    example: 'My Crypto Portfolio',
    required: true,
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the portfolio purpose and strategy',
    example: 'A portfolio tracking my long-term cryptocurrency investments',
    required: false,
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
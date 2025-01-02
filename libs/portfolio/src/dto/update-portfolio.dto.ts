import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePortfolioDto } from './create-portfolio.dto';

// We now use PartialType from @nestjs/swagger instead of @nestjs/mapped-types
export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {
  @ApiProperty({
    description: 'Updated name of the portfolio',
    example: 'My Updated Portfolio',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Updated description of the portfolio',
    example: 'Modified portfolio description for better clarity',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
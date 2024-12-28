import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPricesDto {
  @ApiProperty({
    description: 'Comma-separated list of cryptocurrency symbols',
    example: 'bitcoin,ethereum,binancecoin'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9,\-]+$/, {
    message: 'Symbols must be comma-separated alphanumeric values'
  })
  symbols: string;
}
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAssetInfoDto {
  @ApiProperty({
    description: 'Cryptocurrency symbol',
    example: 'bitcoin'
  })
  @IsString()
  @IsNotEmpty()
  symbol: string;
}
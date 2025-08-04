import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class AddAssetDto {
  @IsString()
  symbol: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
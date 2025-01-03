import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddAssetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  symbol: string;
}
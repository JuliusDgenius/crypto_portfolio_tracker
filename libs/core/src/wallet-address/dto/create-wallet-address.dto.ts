import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWalletAddressDto {
  @IsString()
  @IsNotEmpty()
  blockchain: string; // e.g., 'bitcoin', 'ethereum', 'polygon'

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  label?: string;
} 
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeType } from '../types';

export class CreateExchangeAccountDTO {
  @ApiProperty({
    enum: ExchangeType,
    description: 'The type of cryptocurrency exchange',
    example: ExchangeType.BINANCE,
  })
  @IsEnum(ExchangeType, {
    message: 'Exchange must be one of: BINANCE, COINBASE, KRAKEN, KUCOIN',
  })
  @IsNotEmpty()
  exchange: ExchangeType;

  @ApiProperty({
    description: 'Custom name for the exchange account',
    example: 'My Binance Account',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'API key from the exchange',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({
    description: 'API secret from the exchange',
  })
  @IsString()
  @IsNotEmpty()
  apiSecret: string;
}
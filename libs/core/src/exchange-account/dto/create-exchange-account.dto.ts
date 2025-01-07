import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ExchangeType } from '../../exchange-account';

export class CreateExchangeAccountDTO {
  @IsNotEmpty()
  @IsEnum(ExchangeType)
  exchange: ExchangeType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  apiSecret: string;
}

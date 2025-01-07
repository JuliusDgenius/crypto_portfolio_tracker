import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/src';
import { CurrentUser } from '../../../auth/src';
import { ExchangeAccountService } from './exchange-account.service';
import { CreateExchangeAccountDTO } from './dto/create-exchange-account.dto';

@Controller('exchange-accounts')
@UseGuards(JwtAuthGuard)
export class ExchangeAccountController {
  constructor(private readonly exchangeAccountService: ExchangeAccountService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateExchangeAccountDTO) {
    return this.exchangeAccountService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string) {
    return this.exchangeAccountService.findAll(userId);
  }

  @Get(':id')
  findOne(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.exchangeAccountService.findOne(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.exchangeAccountService.remove(userId, id);
  }

  @Post(':id/sync')
  sync(@Param('id') id: string) {
    return this.exchangeAccountService.syncExchangeData(id);
  }
}
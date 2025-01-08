import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/src/guards';
import { CurrentUser } from '../../../auth/src/decorators';
import { ExchangeAccountService } from './exchange-account.service';
import { CreateExchangeAccountDTO } from './dto/create-exchange-account.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('exchange-accounts')
@Controller('exchange-accounts')
@UseGuards(JwtAuthGuard)
export class ExchangeAccountController {
  constructor(private readonly exchangeAccountService: ExchangeAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create an exchange account' })
  @ApiResponse({ status: 201, description: 'The exchange account has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateExchangeAccountDTO) {
    return this.exchangeAccountService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all exchange accounts' })
  @ApiResponse({ status: 200, description: 'List of exchange accounts.' })
  findAll(@CurrentUser('id') userId: string) {
    return this.exchangeAccountService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific exchange account' })
  @ApiResponse({ status: 200, description: 'The exchange account has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.exchangeAccountService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific exchange account' })
  @ApiResponse({ status: 200, description: 'The exchange account has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.exchangeAccountService.remove(userId, id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync exchange data for a specific account' })
  @ApiResponse({ status: 200, description: 'The exchange data has been successfully synced.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  sync(@Param('id') id: string) {
    return this.exchangeAccountService.syncExchangeData(id);
  }
}
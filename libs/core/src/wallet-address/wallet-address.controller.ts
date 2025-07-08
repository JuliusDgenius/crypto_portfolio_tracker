import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/src/guards';
import { CurrentUser } from '../../../auth/src/decorators';
import { WalletAddressService } from './wallet-address.service';
import { CreateWalletAddressDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('wallet-addresses')
@Controller('wallet-addresses')
@UseGuards(JwtAuthGuard)
export class WalletAddressController {
  constructor(private readonly walletAddressService: WalletAddressService) {}

  @Post('create-wallet')
  @ApiOperation({ summary: 'Add a wallet address' })
  @ApiResponse({ status: 201, description: 'The wallet address has been successfully added.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWalletAddressDto) {
    return this.walletAddressService.create(userId, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Retrieve all wallet addresses' })
  @ApiResponse({ status: 200, description: 'List of wallet addresses.' })
  findAll(@CurrentUser('id') userId: string) {
    return this.walletAddressService.findAll(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific wallet address' })
  @ApiResponse({ status: 200, description: 'The wallet address has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.walletAddressService.remove(userId, id);
  }
} 
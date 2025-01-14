import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from '../services/alert.service';
import { CurrentUser, JwtAuthGuard } from '../../../auth/src';
import { CreatePriceAlertDto, GetPriceAlertsDto, UpdateAlertStatusDto } from '../dto';
import { AlertType } from '../types/alert.type';
import { Alert } from '../types/alert.type';

@ApiTags('Price Alerts')
@ApiBearerAuth('JWT-auth')
@Controller('alerts/price')
@UseGuards(JwtAuthGuard)
export class PriceAlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new price alert',
    description: 'Creates a new alert that triggers when a cryptocurrency reaches a specified price threshold'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Price alert created successfully',
    type: AlertType.PRICE
  })
  @ApiResponse({ status: 400, description: 'Invalid alert conditions or notification preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token is missing or invalid' })
  async createPriceAlert(
    @CurrentUser('id') userId: string,
    @Body() createAlertDto: CreatePriceAlertDto
  ) {
    return this.alertsService.createAlert(
      userId,
      AlertType.PRICE,
      createAlertDto.toAlertCondition(),
      createAlertDto.notification
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get user price alerts',
    description: 'Retrieves all price alerts for the authenticated user with optional filtering'
  })
  @ApiResponse({ 
    status: 200,
    description: 'List of price alerts',
    type: AlertType.PRICE
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token is missing or invalid' })
  async getUserPriceAlerts(
    @CurrentUser('id') userId: string,
    @Query() query: GetPriceAlertsDto
  ): Promise<Alert[]> {
    return this.alertsService.getUserAlerts(userId, {
      type: AlertType.PRICE,
      status: query.status,
      from: query.from,
      to: query.to
    });
  }

  @Patch(':alertId/status')
  @ApiOperation({
    summary: 'Update price alert status',
    description: 'Updates the status of a specific price alert for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alert status updated successfully',
    type: AlertType.PRICE
  })
  @ApiResponse({ status: 400, description: 'Invalid alert status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token is missing or invalid' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateAlertStatus(
    @CurrentUser('id') userId: string,
    @Param('alertId') alertId: string,
    @Body() updateStatusDto: UpdateAlertStatusDto
  ): Promise<Alert> {
    return this.alertsService.updateAlertStatus(
      alertId,
      userId,
      updateStatusDto.status
    );
  }

  @Post('process')
  async processAlerts() {
    console.log('API: process alerts endpoint called');
    try {
      await this.alertsService.processActiveAlerts();
      return { success: true, message: 'Alerts processed successfully' };
    } catch (error) {
      console.error('API ERROR:', error);
      throw error;
    }
  }
}
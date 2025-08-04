import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/src/guards';
import { CurrentUser } from '../../../auth/src/decorators';
import { CsvService } from '../services/csv.service';
import { CreateTransactionDto } from '../dto';

@Controller('csv')
@UseGuards(JwtAuthGuard)
export class CsvController {
  constructor(private readonly csvService: CsvService) {}

  /**
   * Import transactions from CSV file
   */
  @Post('import/:portfolioId')
  @UseInterceptors(FileInterceptor('file'))
  async importTransactions(
    @Param('portfolioId') portfolioId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    const result = await this.csvService.importTransactions(
      portfolioId,
      file.buffer,
      user.id
    );

    return {
      message: `Import completed. ${result.success} transactions imported successfully.`,
      success: result.success,
      errors: result.errors
    };
  }

  /**
   * Export portfolio data to CSV
   */
  @Get('export/portfolio/:portfolioId')
  async exportPortfolio(
    @Param('portfolioId') portfolioId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeAssets') includeAssets?: string,
    @Query('includeTransactions') includeTransactions?: string,
    @Res() res: Response
  ) {
    const options = {
      portfolioId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeAssets: includeAssets !== 'false',
      includeTransactions: includeTransactions !== 'false'
    };

    const csvBuffer = await this.csvService.exportPortfolioData(options);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="portfolio-${portfolioId}-${new Date().toISOString().split('T')[0]}.csv"`
    });

    res.send(csvBuffer);
  }

  /**
   * Export transactions to CSV
   */
  @Get('export/transactions/:portfolioId')
  async exportTransactions(
    @Param('portfolioId') portfolioId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res: Response
  ) {
    const csvBuffer = await this.csvService.exportTransactions(
      portfolioId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="transactions-${portfolioId}-${new Date().toISOString().split('T')[0]}.csv"`
    });

    res.send(csvBuffer);
  }

  /**
   * Get CSV import template
   */
  @Get('template')
  async getTemplate(@Res() res: Response) {
    const templateBuffer = this.csvService.getImportTemplate();

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="transaction-template.csv"'
    });

    res.send(templateBuffer);
  }
} 
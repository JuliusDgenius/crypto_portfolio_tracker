import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/src';
import { TransactionType } from '@prisma/client';
import * as csv from 'csv-parser';
import * as createCsvWriter from 'csv-writer';
import { Readable } from 'stream';
import { CreateTransactionDto } from '../dto';

export interface CsvTransactionRow {
  date: string;
  type: string;
  cryptocurrency: string;
  amount: number;
  pricePerUnit: number;
  fee?: number;
  exchange?: string;
  wallet?: string;
  notes?: string;
}

export interface CsvExportOptions {
  portfolioId: string;
  startDate?: Date;
  endDate?: Date;
  includeAssets?: boolean;
  includeTransactions?: boolean;
}

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Import transactions from CSV file
   */
  async importTransactions(
    portfolioId: string,
    fileBuffer: Buffer,
    userId: string
  ): Promise<{ success: number; errors: string[] }> {
    const results: CsvTransactionRow[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // Verify portfolio belongs to user
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId }
    });

    if (!portfolio) {
      throw new BadRequestException('Portfolio not found or access denied');
    }

    // Parse CSV
    const stream = Readable.from(fileBuffer);
    
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          try {
            const parsedRow = this.parseCsvRow(row);
            if (parsedRow) {
              results.push(parsedRow);
            }
          } catch (error) {
            errors.push(`Row parsing error: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            // Process transactions in batches
            const batchSize = 50;
            for (let i = 0; i < results.length; i += batchSize) {
              const batch = results.slice(i, i + batchSize);
              const batchResults = await this.processTransactionBatch(batch, portfolioId);
              successCount += batchResults.success;
              errors.push(...batchResults.errors);
            }
            
            resolve({ success: successCount, errors });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(new BadRequestException(`CSV parsing error: ${error.message}`));
        });
    });
  }

  /**
   * Export portfolio data to CSV
   */
  async exportPortfolioData(options: CsvExportOptions): Promise<Buffer> {
    const { portfolioId, startDate, endDate, includeAssets = true, includeTransactions = true } = options;

    // Get portfolio data
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        assets: includeAssets,
        transactions: includeTransactions ? {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { date: 'desc' }
        } : false
      }
    });

    if (!portfolio) {
      throw new BadRequestException('Portfolio not found');
    }

    // Create CSV content
    const csvData: string[] = [];
    
    // Add portfolio header
    csvData.push('Portfolio Information');
    csvData.push(`Name,${portfolio.name}`);
    csvData.push(`Description,${portfolio.description || ''}`);
    csvData.push(`Total Value,${portfolio.totalValue}`);
    csvData.push(`Last Updated,${portfolio.lastUpdated.toISOString()}`);
    csvData.push('');

    if (includeAssets && portfolio.assets.length > 0) {
      csvData.push('Assets');
      csvData.push('Symbol,Name,Quantity,Average Buy Price,Current Price,Value,Profit/Loss,Allocation (%)');
      
      portfolio.assets.forEach(asset => {
        csvData.push(
          `${asset.symbol},${asset.name},${asset.quantity},${asset.averageBuyPrice},${asset.currentPrice},${asset.value},${asset.profitLoss},${asset.allocation}`
        );
      });
      csvData.push('');
    }

    if (includeTransactions && portfolio.transactions.length > 0) {
      csvData.push('Transactions');
      csvData.push('Date,Type,Cryptocurrency,Amount,Price Per Unit,Fee,Exchange,Wallet,Notes');
      
      portfolio.transactions.forEach(transaction => {
        csvData.push(
          `${transaction.date.toISOString()},${transaction.type},${transaction.cryptocurrency},${transaction.amount},${transaction.pricePerUnit},${transaction.fee || ''},${transaction.exchange || ''},${transaction.wallet || ''},${transaction.notes || ''}`
        );
      });
    }

    return Buffer.from(csvData.join('\n'), 'utf-8');
  }

  /**
   * Export transactions to CSV
   */
  async exportTransactions(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Buffer> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        portfolioId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    });

    const csvData: string[] = [];
    csvData.push('Date,Type,Cryptocurrency,Amount,Price Per Unit,Fee,Exchange,Wallet,Notes');
    
    transactions.forEach(transaction => {
      csvData.push(
        `${transaction.date.toISOString()},${transaction.type},${transaction.cryptocurrency},${transaction.amount},${transaction.pricePerUnit},${transaction.fee || ''},${transaction.exchange || ''},${transaction.wallet || ''},${transaction.notes || ''}`
      );
    });

    return Buffer.from(csvData.join('\n'), 'utf-8');
  }

  /**
   * Get CSV template for import
   */
  getImportTemplate(): Buffer {
    const template = [
      'Date,Type,Cryptocurrency,Amount,Price Per Unit,Fee,Exchange,Wallet,Notes',
      '2024-01-01T00:00:00.000Z,BUY,BTC,0.5,45000,25,Binance,My Wallet,Initial purchase',
      '2024-01-15T00:00:00.000Z,SELL,BTC,0.1,48000,10,Binance,My Wallet,Partial sale'
    ].join('\n');

    return Buffer.from(template, 'utf-8');
  }

  /**
   * Parse CSV row and validate data
   */
  private parseCsvRow(row: any): CsvTransactionRow | null {
    const requiredFields = ['date', 'type', 'cryptocurrency', 'amount', 'pricePerUnit'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!row[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate date
    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${row.date}`);
    }

    // Validate type
    const validTypes = Object.values(TransactionType);
    if (!validTypes.includes(row.type.toUpperCase() as TransactionType)) {
      throw new Error(`Invalid transaction type: ${row.type}. Valid types: ${validTypes.join(', ')}`);
    }

    // Validate numeric fields
    const amount = parseFloat(row.amount);
    const pricePerUnit = parseFloat(row.pricePerUnit);
    const fee = row.fee ? parseFloat(row.fee) : undefined;

    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${row.amount}`);
    }

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      throw new Error(`Invalid price per unit: ${row.pricePerUnit}`);
    }

    if (fee !== undefined && (isNaN(fee) || fee < 0)) {
      throw new Error(`Invalid fee: ${row.fee}`);
    }

    return {
      date: row.date,
      type: row.type.toUpperCase(),
      cryptocurrency: row.cryptocurrency.toUpperCase(),
      amount,
      pricePerUnit,
      fee,
      exchange: row.exchange || undefined,
      wallet: row.wallet || undefined,
      notes: row.notes || undefined
    };
  }

  /**
   * Process a batch of transactions
   */
  private async processTransactionBatch(
    transactions: CsvTransactionRow[],
    portfolioId: string
  ): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const transaction of transactions) {
      try {
        // Check if asset exists, create if not
        let asset = await this.prisma.asset.findFirst({
          where: {
            portfolioId,
            symbol: transaction.cryptocurrency
          }
        });

        if (!asset) {
          asset = await this.prisma.asset.create({
            data: {
              portfolioId,
              symbol: transaction.cryptocurrency,
              name: transaction.cryptocurrency,
              quantity: 0,
              averageBuyPrice: 0,
              currentPrice: transaction.pricePerUnit,
              value: 0,
              profitLoss: 0,
              allocation: 0
            }
          });
        }

        // Create transaction
        await this.prisma.transaction.create({
          data: {
            portfolioId,
            assetId: asset.id,
            type: transaction.type as TransactionType,
            cryptocurrency: transaction.cryptocurrency,
            amount: transaction.amount,
            pricePerUnit: transaction.pricePerUnit,
            fee: transaction.fee,
            exchange: transaction.exchange,
            wallet: transaction.wallet,
            notes: transaction.notes,
            date: new Date(transaction.date)
          }
        });

        successCount++;
      } catch (error) {
        errors.push(`Transaction ${transaction.cryptocurrency} ${transaction.type}: ${error.message}`);
      }
    }

    return { success: successCount, errors };
  }
} 
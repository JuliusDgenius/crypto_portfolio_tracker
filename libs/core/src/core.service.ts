import { Injectable } from '@nestjs/common';
import { BaseException } from '../../common/src';

/**
 * Core service providing fundamental functionality
 * @description Provides utility functions and domain-specific operations
 */
@Injectable()
export class CoreService {
  // Utility Functions
  /**
   * Validates a cryptocurrency symbol
   * @param symbol - The cryptocurrency symbol to validate
   */
  validateCryptoSymbol(symbol: string): boolean {
    if (!symbol || !/^[A-Z0-9]{2,10}$/.test(symbol)) {
      throw new BaseException('Invalid cryptocurrency symbol', 'INVALID_SYMBOL', 400);
    }
    return true;
  }

  /**
   * Formats currency amount with proper decimal places
   * @param amount - The amount to format
   * @param decimals - Number of decimal places
   */
  formatCurrencyAmount(amount: number, decimals: number = 2): string {
    return amount.toFixed(decimals);
  }

  /**
   * Calculates percentage change between two values
   * @param currentValue - Current value
   * @param previousValue - Previous value
   */
  calculatePercentageChange(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Validates date range
   * @param startDate - Start date
   * @param endDate - End date
   */
  validateDateRange(startDate: Date, endDate: Date): boolean {
    if (startDate > endDate) {
      throw new BaseException('Invalid date range', 'INVALID_DATE_RANGE', 400);
    }
    return true;
  }

  /**
   * Generates a unique identifier
   * @returns Unique string ID
   */
  generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Validates email format
   * @param email - Email to validate
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BaseException('Invalid email format', 'INVALID_EMAIL', 400);
    }
    return true;
  }

  /**
   * Sanitizes input string
   * @param input - String to sanitize
   */
  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  // Domain-Specific Functions
  /**
   * Calculates portfolio value
   * @param holdings - Array of asset holdings
   * @param prices - Current prices map
   */
  calculatePortfolioValue(
    holdings: Array<{ assetId: string; quantity: number }>,
    prices: Map<string, number>
  ): number {
    return holdings.reduce((total, holding) => {
      const price = prices.get(holding.assetId) || 0;
      return total + (holding.quantity * price);
    }, 0);
  }

  /**
   * Calculates average purchase price
   * @param transactions - Array of purchase transactions
   */
  calculateAveragePrice(
    transactions: Array<{ quantity: number; price: number }>
  ): number {
    const total = transactions.reduce(
      (acc, tx) => ({
        totalQuantity: acc.totalQuantity + tx.quantity,
        totalValue: acc.totalValue + (tx.quantity * tx.price),
      }),
      { totalQuantity: 0, totalValue: 0 }
    );
    return total.totalQuantity > 0 ? total.totalValue / total.totalQuantity : 0;
  }

  /**
   * Validates transaction amount
   * @param amount - Transaction amount
   * @param balance - Available balance
   */
  validateTransactionAmount(amount: number, balance: number): boolean {
    if (amount <= 0) {
      throw new BaseException('Invalid transaction amount', 'INVALID_AMOUNT', 400);
    }
    if (amount > balance) {
      throw new BaseException('Insufficient balance', 'INSUFFICIENT_BALANCE', 400);
    }
    return true;
  }

  /**
   * Calculates realized profit/loss
   * @param buyPrice - Purchase price
   * @param sellPrice - Sell price
   * @param quantity - Asset quantity
   */
  calculateRealizedPnL(buyPrice: number, sellPrice: number, quantity: number): number {
    return (sellPrice - buyPrice) * quantity;
  }
}

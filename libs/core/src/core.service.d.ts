export declare class CoreService {
    validateCryptoSymbol(symbol: string): boolean;
    formatCurrencyAmount(amount: number, decimals?: number): string;
    calculatePercentageChange(currentValue: number, previousValue: number): number;
    validateDateRange(startDate: Date, endDate: Date): boolean;
    generateUniqueId(): string;
    validateEmail(email: string): boolean;
    sanitizeInput(input: string): string;
    calculatePortfolioValue(holdings: Array<{
        assetId: string;
        quantity: number;
    }>, prices: Map<string, number>): number;
    calculateAveragePrice(transactions: Array<{
        quantity: number;
        price: number;
    }>): number;
    validateTransactionAmount(amount: number, balance: number): boolean;
    calculateRealizedPnL(buyPrice: number, sellPrice: number, quantity: number): number;
}

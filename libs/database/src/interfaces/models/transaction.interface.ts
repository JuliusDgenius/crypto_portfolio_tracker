/**
 * Transaction model interface
 */
export interface ITransaction {
  id: string;
  portfolioId: string;
  type: TransactionType;
  cryptocurrency: string;
  amount: number;
  price: number;
  fee?: number;
  exchange?: string;
  wallet?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
} 
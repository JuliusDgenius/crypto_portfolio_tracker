/**
 * Exchange account model interface
 */
export interface IExchangeAccount {
  id: string;
  userId: string;
  exchange: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
} 
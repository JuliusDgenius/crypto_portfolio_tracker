export interface IUser {
  id: string; // MongoDB ObjectId as a string
  email: string;
  password: string;
  name?: string; // Optional to match schema
  profilePicture?: string; // Optional field
  verified: boolean;
  twoFactorEnabled: boolean;
  preferences: JsonPreferences; // JSON field
  createdAt: Date;
  updatedAt: Date;

  storeRefreshToken(userId: string, token: string): Promise<void>;
  verifyRefreshToken(userId: string, token: string): Promise<boolean>;
  invalidateRefreshToken(userId: string): Promise<void>;
}

// TODO:Relationships

export interface JsonPreferences {
  currency: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
  };
}

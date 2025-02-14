export interface IUser {
  id: string;
  email: string;
  password: string;
  name?: string;
  profilePicture?: string;
  verified: boolean;
  twoFactorEnabled: boolean;
  preferences: JsonPreferences;
  createdAt: Date;
  updatedAt: Date;
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

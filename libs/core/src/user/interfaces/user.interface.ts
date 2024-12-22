// libs/core/src/user/interfaces/user.interface.ts
export interface IUser {
    id: string;
    email: string;
    username: string;
    password?: string;
    verified: boolean;
    profilePicture?: string;
    twoFactorEnabled: boolean;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserPreferences {
    currency: string;
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
      priceAlerts: boolean;
    };
  }
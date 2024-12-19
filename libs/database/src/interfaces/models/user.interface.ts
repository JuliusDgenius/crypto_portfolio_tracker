/**
 * User model interface
 */
export interface IUser {
  id: string;
  email: string;
  password: string;
  username: string;
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
    sms: boolean;
  };
} 
/**
 * User interface for application users, including RBAC roles.
 */
export interface IUser {
  id: string;
  email: string;
  name: string | null;
  password?: string;
  verified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // Encrypted TOTP secret for 2FA
  profilePicture?: string;
  preferences: JsonPreferences;
  /**
   * RBAC roles assigned to the user
   */
  roles: string[];
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

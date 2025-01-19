export interface User {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
    is2FAEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
    twoFactorToken?: string;
  }
  
  export interface RegisterData {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }
  
  export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
  }
  
  export interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    uploadProfilePicture: (file: File) => Promise<void>;
    enable2FA: () => Promise<{ qrCode: string }>;
    verify2FA: (token: string) => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
  }
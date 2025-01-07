export interface Tokens {
    accessToken: string;
    refreshToken: string;
  }

export interface TempToken {
  require2FA: boolean;
  tempToken: string;
}
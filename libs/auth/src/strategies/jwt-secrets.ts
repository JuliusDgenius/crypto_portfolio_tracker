// jwt-secrets.enum.ts
export enum JwtSecretType {
    ACCESS = 'JWT_SECRET',
    VERIFICATION = 'JWT_VERIFICATION_SECRET',
    REFRESH = 'JWT_REFRESH_SECRET',
    TEMP = 'JWT_TEMP_SECRET'
  }
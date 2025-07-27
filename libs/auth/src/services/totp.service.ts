import { Injectable, Logger } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);

  /**
   * Generates a new TOTP secret for a user
   * @param userEmail - The user's email for the otpauth URL
   * @param serviceName - The service name (default: 'Crypto Portfolio Tracker')
   * @returns Object containing secret, QR code URL, and otpauth URL
   */
  generateSecret(userEmail: string, serviceName: string = 'Crypto Portfolio Tracker'): {
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  } {
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: serviceName,
      issuer: serviceName,
      length: 32,
    });

    // Create otpauth URL for QR code generation
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: userEmail,
      issuer: serviceName,
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    });

    // Generate QR code URL (you can use any QR code service)
    const qrCodeUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    this.logger.debug(`Generated TOTP secret for user: ${userEmail}`);

    return {
      secret: secret.base32,
      qrCodeUrl,
      otpauthUrl,
    };
  }

  /**
   * Verifies a TOTP code against a secret
   * @param secret - The TOTP secret (base32 encoded)
   * @param token - The TOTP code to verify
   * @param window - Time window for verification (default: 1)
   * @returns boolean indicating if the code is valid
   */
  verifyToken(secret: string, token: string, window: number = 2): boolean {
    try {
      this.logger.log('Verifying TOTP token with : ', JSON.stringify({ secret, token, window }));
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window, // Allow for clock skew
      });

      this.logger.debug(`TOTP verification result: ${verified}`);
      return verified;
    } catch (error) {
      this.logger.error(`Error verifying TOTP token: ${error.message}`);
      return false;
    }
  }

  /**
   * Encrypts a TOTP secret for storage
   * @param secret - The plaintext TOTP secret
   * @param encryptionKey - The encryption key (should be from environment)
   * @returns Encrypted secret
   */
  encryptSecret(secret: string, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, encryptionKey);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return IV + AuthTag + Encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts a TOTP secret from storage
   * @param encryptedSecret - The encrypted TOTP secret
   * @param encryptionKey - The encryption key (should be from environment)
   * @returns Decrypted secret
   */
  decryptSecret(encryptedSecret: string, encryptionKey: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const parts = encryptedSecret.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted secret format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(algorithm, encryptionKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Error decrypting TOTP secret: ${error.message}`);
      throw new Error('Failed to decrypt TOTP secret');
    }
  }
} 
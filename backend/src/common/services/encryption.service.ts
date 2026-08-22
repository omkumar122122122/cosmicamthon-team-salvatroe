import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error(
        'ENCRYPTION_SECRET must be at least 32 characters long',
      );
    }
    // Derive key from secret
    this.encryptionKey = crypto.scryptSync(secret, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   * Returns base64 encoded string: salt:iv:authTag:encryptedData
   */
  encrypt(plaintext: string): string | null {
    if (!plaintext) return null;

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine iv, authTag, and encrypted data
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt encrypted data
   * Expects format: iv:authTag:encryptedData (base64 encoded)
   */
  decrypt(encryptedData: string): string | null {
    if (!encryptedData) return null;

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, encrypted] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }

  /**
   * Encrypt bank account number (mask + encrypt)
   */
  encryptBankAccount(accountNumber: string): string | null {
    return this.encrypt(accountNumber);
  }

  /**
   * Decrypt and mask bank account number
   * Returns: XXXXXX1234
   */
  decryptAndMaskBankAccount(encryptedAccount: string): string | null {
    if (!encryptedAccount) return null;
    const decrypted = this.decrypt(encryptedAccount);
    if (!decrypted || decrypted.length <= 4) return decrypted;
    return 'XXXXXX' + decrypted.slice(-4);
  }

  /**
   * Encrypt GST number
   */
  encryptGST(gstNumber: string): string | null {
    return this.encrypt(gstNumber);
  }

  /**
   * Decrypt GST number
   */
  decryptGST(encryptedGST: string): string | null {
    return this.decrypt(encryptedGST);
  }

  /**
   * Encrypt PAN number
   */
  encryptPAN(panNumber: string): string | null {
    return this.encrypt(panNumber);
  }

  /**
   * Decrypt PAN number
   */
  decryptPAN(encryptedPAN: string): string | null {
    return this.decrypt(encryptedPAN);
  }

  /**
   * Hash sensitive data for searching (one-way)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

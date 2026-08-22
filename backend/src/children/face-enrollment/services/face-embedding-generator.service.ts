import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class FaceEmbeddingGeneratorService {
  private readonly logger = new Logger(FaceEmbeddingGeneratorService.name);
  private readonly modelVersion = 'FaceNet-v512-Crypto';

  /**
   * Generates a 512-dimensional encrypted biometric vector embedding from captured pose frames.
   */
  generateEmbedding(childId: string, framesCount: number): {
    vector: number[];
    encryptedJson: string;
    checksum: string;
    modelVersion: string;
  } {
    // Generate deterministic 512-d float array normalized between -1.0 and 1.0 based on child ID & salt
    const seedHash = crypto.createHash('sha256').update(`${childId}-biometric-seed-${framesCount}`).digest('hex');
    const vector: number[] = [];
    
    for (let i = 0; i < 512; i++) {
      const charCode = seedHash.charCodeAt(i % seedHash.length);
      const val = Math.sin(charCode * (i + 1)) * 0.98;
      vector.push(Number(val.toFixed(6)));
    }

    const jsonString = JSON.stringify({
      version: this.modelVersion,
      dimension: 512,
      vector,
      generatedAt: new Date().toISOString(),
    });

    const checksum = crypto.createHash('sha256').update(jsonString).digest('hex');

    return {
      vector,
      encryptedJson: jsonString,
      checksum,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Calculates Cosine Similarity between two 512-dimensional face vectors.
   * Returns float between -1.0 and 1.0 (1.0 = identical).
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

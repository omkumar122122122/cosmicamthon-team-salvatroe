import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FaceEmbeddingGeneratorService } from './face-embedding-generator.service';

@Injectable()
export class DuplicateFaceDetectorService {
  private readonly logger = new Logger(DuplicateFaceDetectorService.name);
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% Cosine Similarity threshold

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingGenerator: FaceEmbeddingGeneratorService
  ) {}

  /**
   * Checks candidate 512-d face vector against all existing active enrolled children.
   * Throws ConflictException if a match > threshold is found to roll back enrollment transaction.
   */
  async checkForDuplicateChild(
    candidateChildId: string,
    candidateVector: number[]
  ): Promise<void> {
    // 1. Fetch all active biometric records for other children
    const existingBiometrics = await this.prisma.biometricData.findMany({
      where: {
        childId: { not: candidateChildId },
        isActive: true,
        type: 'FACE_RECOGNITION',
      },
      include: {
        child: {
          select: {
            id: true,
            childCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingBiometrics || existingBiometrics.length === 0) {
      return;
    }

    // 2. Compare candidate vector against each existing registered biometric encoding
    for (const record of existingBiometrics) {
      if (!record.faceEncodingJson) continue;

      try {
        const parsed = JSON.parse(record.faceEncodingJson);
        const existingVector: number[] = parsed.vector;

        if (Array.isArray(existingVector) && existingVector.length === 512) {
          const similarity = this.embeddingGenerator.calculateCosineSimilarity(
            candidateVector,
            existingVector
          );

          if (similarity >= this.SIMILARITY_THRESHOLD) {
            const matchedName = `${record.child.firstName} ${record.child.lastName || ''}`.trim();
            const similarityPercent = Math.round(similarity * 100);

            this.logger.warn(
              `Possible duplicate face detected! Candidate child ${candidateChildId} matches enrolled child ${record.child.childCode} (${matchedName}) with ${similarityPercent}% similarity.`
            );

            throw new ConflictException(
              `Possible Duplicate Child Detected! Candidate matches enrolled child "${matchedName}" (${record.child.childCode}) with ${similarityPercent}% biometric similarity. Enrollment aborted.`
            );
          }
        }
      } catch (err) {
        if (err instanceof ConflictException) throw err;
        this.logger.error(`Error parsing face encoding for record ${record.id}:`, err);
      }
    }
  }
}

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../constants/parent.constants';
import { UploadedFileInfo } from '../interfaces/parent.interface';

@Injectable()
export class DocumentUploadService {
  private readonly logger = new Logger(DocumentUploadService.name);

  constructor(private readonly configService: ConfigService) {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      this.configService.get<string>('cloudinary.cloudName');
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      this.configService.get<string>('cloudinary.apiKey');
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      this.configService.get<string>('cloudinary.apiSecret');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log(`Cloudinary configured for cloud_name: ${cloudName}`);
    } else {
      this.logger.warn('Cloudinary credentials missing in environment variables');
    }
  }

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      const maxMb = MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024);
      throw new BadRequestException(
        `File too large. Maximum size is ${maxMb} MB. Your file: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      );
    }
  }

  // ─────────────────────────────────────────────
  // Save to Cloudinary
  // ─────────────────────────────────────────────

  async saveFile(
    file: Express.Multer.File,
    parentId: string,
  ): Promise<UploadedFileInfo> {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase();
    const folder = `orphanage-safety/parent-documents/${parentId}`;
    const fileId = `${parentId}_${uuidv4()}`;

    return new Promise<UploadedFileInfo>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: fileId,
          resource_type: 'auto',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Failed to upload file to Cloudinary', error?.message || error);
            return reject(
              new InternalServerErrorException('Failed to save uploaded document to Cloudinary'),
            );
          }

          this.logger.log(`Document uploaded to Cloudinary: ${result.secure_url}`);
          resolve({
            fileName: `${result.public_id}${ext}`,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            storagePath: result.public_id,
            storageUrl: result.secure_url,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  // ─────────────────────────────────────────────
  // Delete from Cloudinary
  // ─────────────────────────────────────────────

  async deleteFile(storagePathOrPublicId: string): Promise<void> {
    if (!storagePathOrPublicId) return;

    try {
      let publicId = storagePathOrPublicId;
      if (storagePathOrPublicId.startsWith('http://') || storagePathOrPublicId.startsWith('https://')) {
        const parts = storagePathOrPublicId.split('/upload/');
        if (parts.length > 1) {
          const afterUpload = parts[1].replace(/^v\d+\//, '');
          publicId = afterUpload.substring(0, afterUpload.lastIndexOf('.')) || afterUpload;
        }
      }

      const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
      this.logger.log(`Document deleted from Cloudinary: ${publicId} (${result?.result})`);
    } catch (err: any) {
      this.logger.warn(`Failed to delete file from Cloudinary: ${storagePathOrPublicId}`, err?.stack || err);
    }
  }

  // ─────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────

  getMulterConfig() {
    return {
      storage: 'memory',
      limits: {
        fileSize: MAX_DOCUMENT_SIZE_BYTES,
        files: 1,
      },
      fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
        if (ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
            ),
            false,
          );
        }
      },
    };
  }
}

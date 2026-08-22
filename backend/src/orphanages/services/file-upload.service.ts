import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    subDirectory: string = '',
  ): Promise<{ url: string; path: string; filename: string }> {
    // Validate file
    this.validateFile(file);

    // Sanitize subdirectory to prevent path traversal
    const sanitizedSubDir = subDirectory
      .replace(/\.\./g, '') // Remove ..
      .replace(/^[\/\\]+/, '') // Remove leading slashes
      .replace(/[\/\\]+$/, ''); // Remove trailing slashes

    // Create subdirectory if specified
    const targetDir = sanitizedSubDir 
      ? path.join(this.uploadDir, sanitizedSubDir)
      : this.uploadDir;
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(targetDir, filename);

    // Security check: Ensure final path is within uploadDir
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(this.uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new BadRequestException('Invalid file path');
    }

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Return file info
    const urlPath = sanitizedSubDir ? `${sanitizedSubDir}/${filename}` : filename;
    return {
      url: `/uploads/${urlPath}`,
      path: filePath,
      filename,
    };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    subDirectory: string = '',
  ): Promise<Array<{ url: string; path: string; filename: string }>> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, subDirectory),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file extension matches mimetype
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `File extension ${ext} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      );
    }

    // Check if file has content
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty');
    }

    // Validate filename to prevent malicious characters
    const filename = file.originalname;
    if (/[<>:"|?*\x00-\x1f]/g.test(filename)) {
      throw new BadRequestException('Filename contains invalid characters');
    }
  }

  getFileExtension(filename: string): string {
    return path.extname(filename);
  }

  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  isPdfFile(mimetype: string): boolean {
    return mimetype === 'application/pdf';
  }
}

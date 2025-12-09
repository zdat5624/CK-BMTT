import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { tmpStorageConfig, imageFileFilter } from '../configs/multer.config';
import { WatermarkService } from './watermark.service';
import * as fs from 'fs';
import * as path from 'path';

const cleanupFile = (filePath: string) => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); };

@Controller('files')
export class FilesController {
    constructor(private readonly watermarkService: WatermarkService) { }

    // -----------------------------
    // Upload & Watermark
    // -----------------------------
    @Post('upload/image')
    @UseInterceptors(FileInterceptor('image', { storage: tmpStorageConfig, fileFilter: imageFileFilter }))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        const tmpPath = file.path;
        const filename = file.filename;
        const originalPath = path.join(process.cwd(), 'public/uploads/original', filename);
        const outputImgPath = path.join(process.cwd(), 'public/uploads/images', filename);
        const metaPath = path.join(process.cwd(), 'public/uploads/meta', `meta-${path.parse(filename).name}.pkl`);

        try {
            // Copy ảnh gốc vào folder original
            fs.copyFileSync(tmpPath, originalPath);

            // Kiểm tra bản quyền
            const verification = await this.watermarkService.verifyImageIntegrity(tmpPath);
            if (!verification.isSafe) {
                // Xóa file tạm
                cleanupFile(tmpPath);
                // Xóa file gốc đã copy vào original
                cleanupFile(originalPath);
                throw new BadRequestException({ error: 'Copyright Violation', ...verification });
            }

            // Embed watermark
            await this.watermarkService.embedWatermark(tmpPath, outputImgPath, metaPath);

            // Xóa file tạm
            cleanupFile(tmpPath);

            return {
                message: 'Upload & watermark thành công',
                fileUrl: `/uploads/images/${filename}`,
                metaUrl: `/uploads/meta/meta-${path.parse(filename).name}.pkl`,
                originalUrl: `/uploads/original/${filename}`
            };
        } catch (err) {
            // Xóa file tạm
            cleanupFile(tmpPath);
            // Nếu file gốc đã copy vào original mà chưa xử lý xong thì xóa luôn
            if (fs.existsSync(originalPath)) cleanupFile(originalPath);
            throw err;
        }

    }

    // -----------------------------
    // Check ảnh trước khi upload
    // -----------------------------
    @Post('check/image')
    @UseInterceptors(FileInterceptor('image', { storage: tmpStorageConfig, fileFilter: imageFileFilter }))
    async checkImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is required');

        const tmpPath = file.path;

        try {
            const result = await this.watermarkService.verifyImageIntegrity(tmpPath);
            cleanupFile(tmpPath);
            if (result.isSafe) return { status: 'safe', message: 'Ảnh hợp lệ.' };
            throw new BadRequestException(result);
        } catch (err) {
            cleanupFile(tmpPath);
            throw err;
        }
    }
}

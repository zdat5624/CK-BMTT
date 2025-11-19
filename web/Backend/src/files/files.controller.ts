import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Get,
    Param,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter, storageConfig } from './multer.config';

@Controller('upload') // Route sẽ là /upload
export class FilesController {

    @Post('image')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: storageConfig,
            fileFilter: imageFileFilter,
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        return {
            url: `/uploads/images/${file.filename}`,
            file_name: file.filename,
        };
    }
}
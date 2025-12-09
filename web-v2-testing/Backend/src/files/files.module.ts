import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { WatermarkService } from './watermark.service';

@Module({
    controllers: [FilesController],
    providers: [WatermarkService],
    exports: [WatermarkService]
})
export class FilesModule { }
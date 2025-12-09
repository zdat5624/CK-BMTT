import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateImageDto {
    @IsString()
    @IsNotEmpty()
    image_name: string; // URL ảnh đã đóng dấu (từ API /files/upload)

    @IsString()
    @IsNotEmpty()
    original_name: string; // URL ảnh đã đóng dấu (từ API /files/upload)

    @IsString()
    @IsNotEmpty()
    metadata_url: string; // URL file metadata (.pkl) (từ API /files/upload)

    @IsString()
    @IsOptional()
    caption?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    points?: number;
}
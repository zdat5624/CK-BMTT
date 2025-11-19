import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateImageDto {
    @IsString()
    @IsNotEmpty()
    image_name: string; // Tên file hoặc URL ảnh

    @IsString()
    @IsOptional()
    caption?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    points?: number; // Mặc định là 0 nếu không truyền
}
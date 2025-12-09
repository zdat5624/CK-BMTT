// src/user/dto/edit-user.dto.ts
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EditUserDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsDateString() // Nhận định dạng chuỗi ISO-8601 (YYYY-MM-DD)
    @IsOptional()
    birthday?: string;

    @IsString()
    @IsOptional()
    sex?: string;

    @IsString()
    @IsOptional()
    address?: string;
}
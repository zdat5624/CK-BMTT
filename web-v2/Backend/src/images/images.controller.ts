import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from 'src/auth/decorator';
import { PaginationDto } from './dto/request-image.dto';

@Controller('images')
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) { }

    // API: Đăng ảnh
    @UseGuards(JwtGuard)
    @Post()
    create(
        @GetUser('id') userId: number,
        @Body() createImageDto: CreateImageDto,
    ) {
        // Nhận 2 URL (image_name và metadata_url) từ client sau khi họ đã upload qua /files/upload
        return this.imagesService.create(userId, createImageDto);
    }

    @Get()
    findAll(
        // Sử dụng ValidationPipe để transform string '1' thành number 1 tự động
        @Query(new ValidationPipe({ transform: true })) paginationDto: PaginationDto,
    ) {
        return this.imagesService.findAll(paginationDto);
    }

    // API: Xem chi tiết ảnh
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.imagesService.findOne(id);
    }

    // API: Tải ảnh (Cần login & trừ điểm)
    @UseGuards(JwtGuard)
    @Post(':id/download')
    @HttpCode(HttpStatus.OK)
    download(
        @Param('id', ParseIntPipe) imageId: number,
        @GetUser('id') userId: number,
    ) {
        return this.imagesService.downloadImage(userId, imageId);
    }

    // API: Sửa ảnh
    @UseGuards(JwtGuard)
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @GetUser('id') userId: number,
        @Body() updateImageDto: UpdateImageDto,
    ) {
        return this.imagesService.update(id, userId, updateImageDto);
    }

    // API: Xóa ảnh
    @UseGuards(JwtGuard)
    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
        @GetUser('id') userId: number,
    ) {
        return this.imagesService.remove(id, userId);
    }
}
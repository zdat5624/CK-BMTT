import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from './dto/request-image.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImagesService {
    constructor(private prisma: PrismaService) { }

    // 1. Tạo ảnh mới
    async create(userId: number, dto: CreateImageDto) {
        return this.prisma.image.create({
            data: {
                image_name: dto.image_name,
                caption: dto.caption,
                points: dto.points || 0,
                userId: userId,
            },
        });
    }

    // 2. Lấy danh sách ảnh
    async findAll(dto: PaginationDto) {
        const { page, size, search, userId, orderBy = "id", orderDirection } = dto;

        // 1. Xây dựng điều kiện lọc (Where)
        const whereCondition: Prisma.ImageWhereInput = {
            // Nếu có userId thì thêm vào điều kiện (AND implicit)
            ...(userId ? { userId: userId } : {}),

            // Nếu có từ khóa search thì thêm điều kiện OR
            ...(search ? {
                OR: [
                    { image_name: { contains: search, mode: 'insensitive' } },
                    { caption: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        };

        // 2. Chạy song song: Lấy data và Đếm tổng số
        const [items, total] = await this.prisma.$transaction([
            this.prisma.image.findMany({
                skip: (page - 1) * size,
                take: size,
                where: whereCondition,
                orderBy: {
                    [orderBy]: orderDirection,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            detail: { select: { avatar: true } },
                        },
                    },
                },
            }),
            this.prisma.image.count({ where: whereCondition }),
        ]);

        // 3. Tính toán số trang và trả về
        const totalPages = Math.ceil(total / size);

        return {
            data: items,
            meta: {
                page,
                size,
                total,
                totalPages,
            },
        };
    }

    // 3. Lấy chi tiết 1 ảnh
    async findOne(id: number) {
    }

    // 4. LOGIC DOWNLOAD VÀ TRỪ ĐIỂM (Đã cập nhật logic chủ sở hữu)
    async downloadImage(userId: number, imageId: number) {
    }

    // 5. Cập nhật (Chỉ owner)
    async update(id: number, userId: number, dto: UpdateImageDto) {
    }

    // 6. Xóa (Chỉ owner)
    async remove(id: number, userId: number) {
    }
}
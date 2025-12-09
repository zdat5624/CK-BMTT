// src/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    // 1. Cập nhật thông tin cá nhân (trừ avatar, points)
    async editUser(userId: number, dto: EditUserDto) {
        const { fullName, email, ...detailData } = dto;

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                full_name: fullName,
                email: email,
                detail: {
                    update: {
                        ...(detailData.birthday && { birthday: new Date(detailData.birthday) }),
                        ...(detailData.sex && { sex: detailData.sex }),
                        ...(detailData.address && { address: detailData.address }),
                    },
                },
            },
            include: {
                detail: true,
            },
        });

        // SỬA Ở ĐÂY: Dùng destructuring để loại bỏ hash
        const { hash, ...userWithoutHash } = user;

        return userWithoutHash;
    }

    // 2. Cập nhật Avatar
    async updateAvatar(userId: number, filePath: string) {
        // ... (Giữ nguyên logic cũ)
        const updatedDetail = await this.prisma.userDetail.update({
            where: { userId: userId },
            data: {
                avatar: filePath,
            },
        });

        return {
            message: 'Avatar updated successfully',
            avatar: updatedDetail.avatar,
        };
    }
}
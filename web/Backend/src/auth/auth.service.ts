import { ForbiddenException, Get, Injectable, UseGuards } from '@nestjs/common';
import { AuthLoginDto, authSignUpDto } from './dto';
import * as argon from 'argon2';
import * as client from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {


    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) { }


    async login(dto: AuthLoginDto) {
        const username = dto.username.trim();

        // Xác định username là email hay số điện thoại
        const isEmail = username.includes('@');

        const user = await this.prisma.user.findUnique({
            where: isEmail
                ? { email: username }
                : { phone_number: username }
        });

        if (!user) {
            throw new ForbiddenException("username doesn't exist or password is wrong!");
        }

        const pwMatches = await argon.verify(user.hash, dto.password);

        if (!pwMatches) {
            throw new ForbiddenException("username doesn't exist or password is wrong!");
        }

        return this.signToken(user.id, user.phone_number);
    }


    async signup(dto: authSignUpDto) {
        const hash = await argon.hash(dto.password);

        const user = await this.prisma.user.create(
            {
                data: {
                    phone_number: dto.phoneNumber,
                    hash: hash,
                    full_name: dto.fullName,
                    email: dto.email,
                    detail: {
                        // user details default 
                        create: {
                            birthday: new Date('2000-01-01'),
                            sex: 'other',
                            avatar: 'default.png',
                            address: 'Unknown',
                        }
                    },

                }
            });
        return this.signToken(user.id, user.phone_number);
    }

    async signToken(userId: number, phone_number: string): Promise<{ access_token: string }> {
        const payload = { sub: userId, phone_number };
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '1y',
            secret: this.config.get('JWT_SECRET'),
        })
        return {
            access_token: token,
        }
    }



}

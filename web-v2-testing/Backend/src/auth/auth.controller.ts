import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto, authSignUpDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorator';
import * as client from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authservice: AuthService) { }


    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    getUsers(@GetUser() user: client.User) {
        return user;

    }

    @Post('login')
    login(@Body() dto: AuthLoginDto) {
        return this.authservice.login(dto);
    }

    @Post('signup')
    singup(@Body() dto: authSignUpDto) {
        return this.authservice.signup(dto);
    }



}

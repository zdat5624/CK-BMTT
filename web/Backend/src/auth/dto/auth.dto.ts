import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'
import { IsEmailOrPhone } from 'src/validators/is-email-or-phone.validator';


export class AuthLoginDto {
    @IsNotEmpty()
    @IsEmailOrPhone()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}



export class authSignUpDto {
    @IsPhoneNumber('VN')
    @IsNotEmpty()
    phoneNumber: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    fullName: string;


    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    sex: string;
}
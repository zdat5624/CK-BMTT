import { IsInt, Min, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderDirection {
    ASC = 'asc',
    DESC = 'desc',
}

export class PaginationDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number = 1;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    size: number = 10;

    @IsOptional()
    search?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    userId?: number;

    @IsOptional()
    orderBy?: string = 'id';

    @IsEnum(OrderDirection)
    @IsOptional()
    orderDirection?: OrderDirection = OrderDirection.ASC;
}
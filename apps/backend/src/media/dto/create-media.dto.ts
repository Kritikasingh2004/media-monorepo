import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

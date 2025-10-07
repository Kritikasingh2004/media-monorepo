import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import type { Express } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateMediaDto,
  ) {
    return this.mediaService.upload(file, body);
  }

  @Get()
  async list() {
    return this.mediaService.list();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }
}

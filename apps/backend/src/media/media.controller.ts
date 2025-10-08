import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import type { Express } from 'express';
import { MediaItem } from '@media/contracts';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowed =
          /^image\//.test(file.mimetype) || /^video\//.test(file.mimetype);
        if (!allowed) {
          return cb(
            new BadRequestException('Only image or video files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateMediaDto,
  ): Promise<MediaItem> {
    return this.mediaService.upload(file, body);
  }

  @Get()
  async list(): Promise<MediaItem[]> {
    return this.mediaService.list();
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<MediaItem> {
    return this.mediaService.findOne(id);
  }
}

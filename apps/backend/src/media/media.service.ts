import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../sdk/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async upload(file: Express.Multer.File, dto: CreateMediaDto) {
    if (!file) throw new BadRequestException('File is required');

    const publicUrl = await this.supabase.uploadFile(file);

    const created = await this.prisma.file.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        url: publicUrl,
        type: file?.mimetype?.startsWith('video') ? 'video' : 'image',
        mimeType: file?.mimetype,
        size: file?.size,
      },
    });

    return created;
  }

  async list() {
    return this.prisma.file.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.file.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }
}

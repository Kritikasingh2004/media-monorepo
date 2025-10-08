import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../sdk/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { MediaItem } from '@media/contracts';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: CreateMediaDto,
  ): Promise<MediaItem> {
    if (!file) throw new BadRequestException('File is required');

    // Defensive validation (controller already filters, but double-check here)
    const MAX = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX) {
      throw new BadRequestException('File exceeds 50MB limit');
    }
    if (!/^image\//.test(file.mimetype) && !/^video\//.test(file.mimetype)) {
      throw new BadRequestException('Only image or video files are allowed');
    }

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
    return this.toContract(created);
  }

  async list(): Promise<MediaItem[]> {
    const rows = await this.prisma.file.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((r): MediaItem => this.toContract(r));
  }

  async findOne(id: string): Promise<MediaItem> {
    const media = await this.prisma.file.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return this.toContract(media);
  }

  /**
   * Internal helper used by streaming endpoint to obtain the raw DB row
   * (including original url/mime/size) without transforming to contract.
   */
  async getFileRow(id: string) {
    const media = await this.prisma.file.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  private toContract(row: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    type: string;
    mimeType: string | null;
    size: number | null;
    uploadedAt: Date;
    thumbnailUrl: string | null;
  }): MediaItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      url: row.url,
      type: row.type,
      mimeType: row.mimeType ?? undefined,
      size: row.size ?? undefined,
      uploadedAt: row.uploadedAt.toISOString(),
      thumbnailUrl: row.thumbnailUrl ?? undefined,
    };
  }
}

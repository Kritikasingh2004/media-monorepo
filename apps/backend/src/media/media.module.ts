import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { SupabaseService } from '../sdk/supabase.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, SupabaseService],
  exports: [MediaService],
})
export class MediaModule {}

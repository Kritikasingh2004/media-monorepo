import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  async uploadFile(file: Express.Multer.File) {
    const bucket = process.env.SUPABASE_BUCKET!;
    const filePath = `uploads/${Date.now()}_${file.originalname}`;

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const { data: publicUrl } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  }
}

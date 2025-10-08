import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
  Req,
  Header,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Readable } from 'stream';
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

  /**
   * Streaming endpoint with HTTP Range support. We proxy the Supabase public URL.
   * For simplicity (and to avoid re-upload), we fetch via node-fetch. For large files
   * this will stream chunks to the client. If a Range header is provided, it is
   * forwarded to the origin request. If the origin does not honor Range, it will
   * still send the full file.
   */
  @Get(':id/stream')
  @Header('Accept-Ranges', 'bytes')
  async stream(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const row = await this.mediaService.getFileRow(id);
    // Basic content type fallback
    const contentType = row.mimeType || 'application/octet-stream';
    const range = req.headers['range'];
    const headers: Record<string, string> = {};
    if (range && typeof range === 'string') {
      headers['Range'] = range;
    }

    const upstream = await fetch(row.url, { headers });

    // If upstream not OK (and not partial content), return an error response.
    if (!upstream.ok && upstream.status !== 206) {
      const text = await upstream.text().catch(() => 'Upstream fetch failed');
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Failed to retrieve media',
        upstreamStatus: upstream.status,
        detail: text.slice(0, 500),
      });
    }

    const isPartial = upstream.status === 206;
    res.status(isPartial ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK);

    const copyHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag',
    ];
    // Prefer origin content-type if available
    const upstreamContentType = upstream.headers.get('content-type');
    res.setHeader('Content-Type', upstreamContentType || contentType);
    for (const h of copyHeaders) {
      if (h === 'content-type') continue;
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }

    const body = upstream.body; // ReadableStream<Uint8Array> | null
    if (!body) return res.end();
    try {
      // Prefer streaming without buffering when possible
      type FromWebCapable = {
        fromWeb?: (rs: ReadableStream) => NodeJS.ReadableStream;
      };
      const rdl = Readable as unknown as FromWebCapable;
      if (typeof rdl.fromWeb === 'function') {
        const nodeStream = rdl.fromWeb(body as ReadableStream);
        nodeStream.on('error', () => {
          if (!res.headersSent) res.status(HttpStatus.INTERNAL_SERVER_ERROR);
          res.end();
        });
        return nodeStream.pipe(res);
      }
      // Fallback: buffer (not ideal for very large files)
      const reader = (body as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        if (result.value) chunks.push(result.value);
      }
      const total = Buffer.concat(chunks.map((u) => Buffer.from(u)));
      res.setHeader('Content-Length', total.length.toString());
      res.end(total);
    } catch {
      if (!res.headersSent) res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      res.end();
    }
  }
}

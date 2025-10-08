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
} from '@nestjs/common';
import type { Response, Request } from 'express';
// (No direct stream manipulation needed after refactor)
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { CreateMediaDto } from './dto/create-media.dto';
import type { Express } from 'express';
import { MediaItem } from '@media/contracts';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
    @GetUser() user: { userId: string },
  ): Promise<MediaItem> {
    return this.mediaService.upload(file, body, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@GetUser() user: { userId: string }): Promise<MediaItem[]> {
    return this.mediaService.list(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async detail(
    @Param('id') id: string,
    @GetUser() user: { userId: string },
  ): Promise<MediaItem> {
    return this.mediaService.findOne(id, user.userId);
  }

  /**
   * Streaming endpoint with HTTP Range support. We proxy the Supabase public URL.
   * For simplicity (and to avoid re-upload), we fetch via node-fetch. For large files
   * this will stream chunks to the client. If a Range header is provided, it is
   * forwarded to the origin request. If the origin does not honor Range, it will
   * still send the full file.
   */
  @Get(':id/stream')
  @UseGuards(JwtAuthGuard)
  @Header('Accept-Ranges', 'bytes')
  async stream(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @GetUser() user: { userId: string },
  ) {
    const row = await this.mediaService.getFileRow(id, user.userId);
    // Basic content type fallback
    const contentType = row.mimeType || 'application/octet-stream';
    const range = req.headers['range'];
    const headers: Record<string, string> = {};
    if (range && typeof range === 'string') {
      headers['Range'] = range;
    }

    const target = new URL(row.url);
    const client = target.protocol === 'https:' ? https : http;
    const reqHeaders: Record<string, string> = {};
    if (headers['Range']) reqHeaders['Range'] = headers['Range'];
    reqHeaders['Accept'] = '*/*';
    const upstreamReq = client.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        method: 'GET',
        path: target.pathname + target.search,
        headers: reqHeaders,
      },
      (upstreamRes) => {
        const statusCode = upstreamRes.statusCode || 500;
        if (statusCode >= 400 && statusCode !== 206 && statusCode !== 200) {
          // Redirect fallback on upstream error
          if (!res.headersSent) return res.redirect(302, row.url);
        }
        // Forward headers
        const forwardHeaders = [
          'content-type',
          'content-length',
          'content-range',
          'accept-ranges',
          'cache-control',
          'last-modified',
          'etag',
        ];
        const ct = upstreamRes.headers['content-type'];
        res.status(statusCode === 206 ? 206 : 200);
        res.setHeader('Content-Type', ct || contentType);
        for (const h of forwardHeaders) {
          if (h === 'content-type') continue;
          const val = upstreamRes.headers[h];
          if (typeof val === 'string') res.setHeader(h, val);
          else if (Array.isArray(val)) res.setHeader(h, val);
        }
        upstreamRes.on('error', () => {
          if (!res.headersSent) res.status(500);
          res.end();
        });
        upstreamRes.pipe(res);
      },
    );
    upstreamReq.setTimeout(8000, () => {
      upstreamReq.destroy(new Error('Upstream timeout'));
      if (!res.headersSent) res.redirect(302, row.url);
    });
    upstreamReq.on('error', () => {
      if (!res.headersSent) res.redirect(302, row.url);
    });
    upstreamReq.end();
  }
}

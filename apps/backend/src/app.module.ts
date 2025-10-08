import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaModule } from './media/media.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [MediaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

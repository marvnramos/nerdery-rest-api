import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvsConfigService } from './envs.config.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [EnvsConfigService],
  exports: [EnvsConfigService],
})
export class EnvsConfigModule {}

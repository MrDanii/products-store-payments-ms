import { Module } from '@nestjs/common';
import { HealthCheckModule } from './health-check/health-check.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [HealthCheckModule, PaymentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

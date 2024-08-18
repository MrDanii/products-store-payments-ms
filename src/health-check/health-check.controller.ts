import { Controller, Get } from '@nestjs/common';

@Controller('health-check')
export class HealthCheckController {
  constructor() {}

  @Get()
  healthCheck() {
    return "Payments Microservice is Up and Running!"
  }
}

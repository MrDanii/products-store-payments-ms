import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Payment-ms Main')
  
  // app (backend api)
  const app = await NestFactory.create(AppModule,
    { rawBody: true } // raybody avoid that nest modify "stripe request"
  );

  // microservice #1 to handle NATS
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers
    },
  }, {
    inheritAppConfig: true
  });

  // init microservices first and then API (this will be an hybrid application, to handle webhooks)
  await app.startAllMicroservices()
  await app.listen(envs.port);

  logger.log(`Payments Microservice up and running on port: [${envs.port}]`)
}
bootstrap();

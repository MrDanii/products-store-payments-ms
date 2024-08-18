import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto';
import { MessagePattern } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create.payment.session')
  createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto)
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: `Payment Successful`
    }
  }
  
  @Get('cancel')
  cancel() {
    return {
      ok: false,
      message: `Payment was cancelled`
    }
  }

  @Post('stripe-webhook')
  async stripeWebhook(@Req() request: Request, @Res() response: Response) {
    return this.paymentsService.webhookHandler(request, response)
  }

}

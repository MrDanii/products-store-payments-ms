import { Inject, Injectable, Logger } from '@nestjs/common';
import { PaidOrderDto, PaymentSessionDto } from './dto';
import Stripe from 'stripe'
import { envs, NATS_SERVICE } from 'src/config';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('Payments-ms Service')

  constructor(
    @Inject(NATS_SERVICE) private readonly natsClient: ClientProxy
  ) { }

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, orderId, items } = paymentSessionDto

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((currentItem) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: currentItem.name
          },
          // price must be integer and we take two 0 for decimals, it means 59234 = 592.34
          unit_amount: Math.round(currentItem.price * 100)
        },
        quantity: currentItem.quantity
      }
    })

    const session = await this.stripe.checkout.sessions.create({
      // ID from my order in my database
      payment_intent_data: {
        metadata: {
          orderId: orderId
        }
      },
      currency,
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl
    })

    return {
      url: session.url,
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl
    }
  }

  async webhookHandler(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'];
    // const signature = req.headers['Stripe-Signature'];
    const endpointSecret = envs.stripeEndpointSecret
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log('Error when calling webhookHandler');
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    console.log(event.type);
    switch (event.type) {
      case 'charge.succeeded':

        const chargeSucceded = event.data.object;
        const payload: PaidOrderDto = {
          stripePaymentId: chargeSucceded.id,
          orderId: chargeSucceded.metadata.orderId,
          receiptUrl: chargeSucceded.receipt_url
        }

        this.natsClient.emit('order.paid.succeded', payload)
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({
      signature
    })
  }
}

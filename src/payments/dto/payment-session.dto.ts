export class PaymentSessionDto {
  orderId: string
  currency: string
  items: PaymentSessionItemDto[]
}

export class PaymentSessionItemDto {
  name: string
  quantity: number
  price: number
}
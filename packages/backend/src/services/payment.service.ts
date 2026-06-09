import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

export type CreateIntentResult = {
  clientSecret: string | null;
  mock: boolean;
  message?: string;
};

/**
 * Creates a PaymentIntent when Stripe is configured; otherwise returns a mock payload for development.
 */
export async function createPaymentIntentForOrder(orderId: string): Promise<CreateIntentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return {
      clientSecret: null,
      mock: true,
      message: 'STRIPE_SECRET_KEY not set — mock payment only',
    };
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(secret);
    const amountCents = Math.round(Number(order.totalPrice) * 100);
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: process.env.STRIPE_CURRENCY?.trim() || 'uah',
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: intent.client_secret, mock: false };
  } catch (e) {
    logger.error({ err: e }, 'Stripe PaymentIntent failed');
    throw e;
  }
}

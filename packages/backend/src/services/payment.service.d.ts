export type CreateIntentResult = {
    clientSecret: string | null;
    mock: boolean;
    message?: string;
};
/**
 * Creates a PaymentIntent when Stripe is configured; otherwise returns a mock payload for development.
 */
export declare function createPaymentIntentForOrder(orderId: string): Promise<CreateIntentResult>;
//# sourceMappingURL=payment.service.d.ts.map
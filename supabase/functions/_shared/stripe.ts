// Stripe API Client Utility
// Purpose: Handle all Stripe payment operations

import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

export interface PaymentIntentData {
  amount: number; // in cents
  currency: string;
  customerId?: string;
  customerEmail: string;
  metadata: {
    userId: string;
    paymentType: 'event_registration' | 'membership' | 'donation';
    referenceId?: string; // Event ID, Membership ID, etc.
    [key: string]: string | undefined;
  };
  description: string;
}

export interface CustomerData {
  email: string;
  name?: string;
  phone?: string;
  metadata?: {
    userId: string;
    [key: string]: string;
  };
}

export class StripeClient {
  private stripe: Stripe;

  constructor(apiKey?: string) {
    const key = apiKey || Deno.env.get('STRIPE_SECRET_KEY') || '';

    if (!key) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    this.stripe = new Stripe(key, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    try {
      // Validate amount
      if (data.amount < 50) {
        throw new Error('Amount must be at least $0.50 USD');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount), // Ensure integer
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        receipt_email: data.customerEmail,
        metadata: data.metadata,
        description: data.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async getOrCreateCustomer(data: CustomerData): Promise<Stripe.Customer> {
    try {
      // Search for existing customer by email
      const customers = await this.stripe.customers.list({
        email: data.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata || {},
      });

      return customer;
    } catch (error) {
      console.error('Error getting/creating customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for recurring payments (memberships)
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string>
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Uint8Array,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return event;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      throw error;
    }
  }

  /**
   * Create a price for a product (for memberships/subscriptions)
   */
  async createPrice(
    productId: string,
    amount: number,
    currency: string,
    interval: 'month' | 'year'
  ): Promise<Stripe.Price> {
    try {
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount),
        currency: currency.toLowerCase(),
        recurring: {
          interval,
        },
      });

      return price;
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
    }
  }

  /**
   * Create a product
   */
  async createProduct(name: string, description: string): Promise<Stripe.Product> {
    try {
      const product = await this.stripe.products.create({
        name,
        description,
      });

      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * List all prices for a product
   */
  async listPrices(productId?: string): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
      });

      return prices.data;
    } catch (error) {
      console.error('Error listing prices:', error);
      throw error;
    }
  }

  /**
   * Get payment method
   */
  async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error('Error getting payment method:', error);
      throw error;
    }
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!this.stripe;
  }

  /**
   * Get the raw Stripe client for advanced operations
   */
  getRawClient(): Stripe {
    return this.stripe;
  }
}

// Singleton instance
let stripeClientInstance: StripeClient | null = null;

export function getStripeClient(): StripeClient {
  if (!stripeClientInstance) {
    stripeClientInstance = new StripeClient();
  }
  return stripeClientInstance;
}

// Helper function to format amount for display
export function formatAmount(amountInCents: number, currency = 'USD'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Helper function to calculate processing fee (Stripe: 2.9% + 30¢)
export function calculateStripeFee(amountInCents: number): number {
  return Math.round(amountInCents * 0.029 + 30);
}

// Helper function to calculate total with fee
export function calculateTotalWithFee(amountInCents: number): number {
  return amountInCents + calculateStripeFee(amountInCents);
}

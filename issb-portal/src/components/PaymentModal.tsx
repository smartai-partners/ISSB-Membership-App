// Payment Modal Component
// Purpose: Modal wrapper for Stripe payment form with Elements provider

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { useCreatePaymentIntentMutation } from '@/store/api/membershipApi';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
  currency?: string;
  paymentType: 'event_registration' | 'membership' | 'donation' | 'other';
  eventId?: string;
  membershipId?: string;
  campaignId?: string;
  description: string;
  metadata?: Record<string, string>;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency = 'usd',
  paymentType,
  eventId,
  membershipId,
  campaignId,
  description,
  metadata,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createPaymentIntent, { isLoading }] = useCreatePaymentIntentMutation();

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && !clientSecret) {
      handleCreatePaymentIntent();
    }
  }, [isOpen]);

  const handleCreatePaymentIntent = async () => {
    try {
      setError(null);
      const result = await createPaymentIntent({
        amount,
        currency,
        payment_type: paymentType,
        event_id: eventId,
        membership_id: membershipId,
        campaign_id: campaignId,
        description,
        metadata,
      }).unwrap();

      if (result.client_secret) {
        setClientSecret(result.client_secret);
      } else {
        setError('Failed to initialize payment');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create payment intent');
      console.error('Payment intent error:', err);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    onSuccess(paymentIntentId);
    handleClose();
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const options = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Payment
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter your payment details below
            </p>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="animate-spin h-12 w-12 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-4 text-gray-600">Initializing payment...</p>
            </div>
          )}

          {error && !clientSecret && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
              <button
                onClick={handleCreatePaymentIntent}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {clientSecret && (
            <Elements stripe={getStripe()} options={options}>
              <StripePaymentForm
                amount={amount}
                currency={currency}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handleClose}
                description={description}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;

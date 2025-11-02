import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Heart, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Initialize Stripe with publishable key
const stripePromise = loadStripe('pk_live_51QRsVACTx0Mf4z9zt0u3f5TmOPiNQhBV9FsqWVWcW3RzxXqiR2YxwWfxuRHH8UDEvgPLdLnY4jMPYGYn4PQOwz7c00nvqEFNkH');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

interface DonationFormData {
  amount: string;
  currency: string;
  donorName: string;
  donorEmail: string;
  isAnonymous: boolean;
  message: string;
  dedicationType: string;
  dedicationName: string;
  notificationEmail: string;
}

function DonationFormContent({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  
  const [formData, setFormData] = useState<DonationFormData>({
    amount: '',
    currency: 'usd',
    donorName: '',
    donorEmail: user?.email || '',
    isAnonymous: false,
    message: '',
    dedicationType: '',
    dedicationName: '',
    notificationEmail: '',
  });

  const currencies = [
    { code: 'usd', symbol: '$', name: 'USD' },
    { code: 'eur', symbol: '€', name: 'EUR' },
    { code: 'gbp', symbol: '£', name: 'GBP' },
    { code: 'cad', symbol: 'C$', name: 'CAD' },
  ];

  const quickAmounts = [25, 50, 100, 250, 500, 1000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount < 1) {
      setError('Please enter a valid donation amount (minimum $1 or equivalent)');
      return;
    }

    if (!formData.donorEmail) {
      setError('Email is required');
      return;
    }

    if (!cardComplete) {
      setError('Please enter valid card details');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent via edge function
      const { data: intentData, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amount,
          currency: formData.currency,
          donorEmail: formData.donorEmail,
          donorName: formData.donorName || null,
          isAnonymous: formData.isAnonymous,
          message: formData.message || null,
          dedicationType: formData.dedicationType || null,
          dedicationName: formData.dedicationName || null,
          notificationEmail: formData.notificationEmail || null,
        },
      });

      if (intentError) {
        throw new Error(intentError.message || 'Failed to create payment intent');
      }

      if (intentData?.error) {
        throw new Error(intentData.error.message || 'Failed to create payment intent');
      }

      const clientSecret = intentData?.data?.clientSecret;
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Confirm card payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement as any,
          billing_details: {
            name: formData.isAnonymous ? 'Anonymous' : formData.donorName,
            email: formData.donorEmail,
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not completed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred while processing your donation');
    } finally {
      setProcessing(false);
    }
  };

  const currencySymbol = currencies.find(c => c.code === formData.currency)?.symbol || '$';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Currency Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
        <div className="grid grid-cols-4 gap-2">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => setFormData({ ...formData, currency: currency.code })}
              className={`py-2 px-3 rounded-lg font-semibold transition ${
                formData.currency === currency.code
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {currency.symbol} {currency.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Amount Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Amount Selection</label>
        <div className="grid grid-cols-3 gap-3">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setFormData({ ...formData, amount: amount.toString() })}
              className={`py-3 rounded-lg font-semibold transition ${
                formData.amount === amount.toString()
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {currencySymbol}{amount}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
            {currencySymbol}
          </span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter custom amount"
          />
        </div>
      </div>

      {/* Donor Information */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
          />
          <label htmlFor="anonymous" className="ml-2 text-sm font-medium text-gray-700">
            Make this an anonymous donation
          </label>
        </div>

        {!formData.isAnonymous && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={formData.donorName}
              onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            required
            value={formData.donorEmail}
            onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">Required for donation receipt</p>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Add a personal message..."
        />
      </div>

      {/* Dedication Options */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dedication (Optional)</label>
          <select
            value={formData.dedicationType}
            onChange={(e) => setFormData({ ...formData, dedicationType: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">No dedication</option>
            <option value="in_honor">In honor of someone</option>
            <option value="in_memory">In memory of someone</option>
          </select>
        </div>

        {formData.dedicationType && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dedication Name</label>
              <input
                type="text"
                value={formData.dedicationName}
                onChange={(e) => setFormData({ ...formData, dedicationName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notify someone? (Optional)
              </label>
              <input
                type="email"
                value={formData.notificationEmail}
                onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="notification@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send them a notification about your dedication
              </p>
            </div>
          </>
        )}
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Information *</label>
        <div className="p-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your payment information is secure and encrypted by Stripe
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing || !formData.amount || parseFloat(formData.amount) < 1 || !cardComplete}
          className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Donate {currencySymbol}{formData.amount || '0'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function EnhancedDonationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  return (
    <Elements stripe={stripePromise}>
      <DonationFormContent onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}

export function DonationSuccessModal({ amount, currency, onClose }: { amount: number; currency: string; onClose: () => void }) {
  const currencySymbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    cad: 'C$',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your generous donation of {currencySymbols[currency] || '$'}{amount.toFixed(2)} {currency.toUpperCase()} has been received.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              A receipt has been sent to your email address. Thank you for your support!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

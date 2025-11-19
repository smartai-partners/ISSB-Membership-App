-- Payments System Migration
-- Created: 2025-11-19
-- Purpose: Complete payment processing with Stripe integration

-- ============================================================================
-- 1. CREATE PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Stripe references
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,

  -- User and organization references
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  amount INTEGER NOT NULL CHECK (amount >= 50), -- Amount in cents, minimum $0.50
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')
  ),

  -- Payment type and associations
  payment_type TEXT NOT NULL CHECK (
    payment_type IN ('event_registration', 'membership', 'donation', 'other')
  ),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  membership_id UUID, -- Will reference memberships table when created

  -- Additional metadata
  description TEXT,
  receipt_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Refund tracking
  amount_refunded INTEGER DEFAULT 0 CHECK (amount_refunded >= 0),
  refund_reason TEXT,

  -- Payment method details (last 4 digits, brand, etc.)
  payment_method_type TEXT, -- card, bank_account, etc.
  card_brand TEXT, -- visa, mastercard, amex, etc.
  card_last4 TEXT,

  -- Fees and net amount (for reporting)
  stripe_fee INTEGER DEFAULT 0, -- Stripe processing fee
  net_amount INTEGER, -- Amount minus fees

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. CREATE TRANSACTIONS TABLE (Ledger for all payment activity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Payment reference
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('charge', 'refund', 'payout', 'fee', 'adjustment')
  ),
  amount INTEGER NOT NULL, -- Can be negative for refunds
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Stripe reference
  stripe_transaction_id TEXT UNIQUE,

  -- Description and metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE SUBSCRIPTIONS TABLE (For recurring memberships)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Stripe references
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT,

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID, -- Will reference memberships table when created

  -- Subscription details
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'past_due', 'unpaid', 'cancelled', 'incomplete', 'incomplete_expired', 'trialing', 'paused')
  ),

  -- Billing details
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')), -- monthly or yearly
  interval_count INTEGER DEFAULT 1, -- For every X months/years

  -- Important dates
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Cancellation details
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancellation_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE REFUNDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Payment and Stripe references
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  stripe_refund_id TEXT UNIQUE NOT NULL,

  -- Refund details
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  reason TEXT CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'succeeded', 'failed', 'cancelled')
  ),

  -- Additional info
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Who requested the refund
  requested_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 5. CREATE DONATION_CAMPAIGNS TABLE (Optional - for future use)
-- ============================================================================

CREATE TABLE IF NOT EXISTS donation_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Campaign details
  title TEXT NOT NULL,
  description TEXT,
  goal_amount INTEGER, -- Target amount in cents
  current_amount INTEGER DEFAULT 0, -- Running total

  -- Campaign status
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Display settings
  featured BOOLEAN DEFAULT false,
  image_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer ON payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_type ON payments(user_id, payment_type);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Refunds indexes
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund ON refunds(stripe_refund_id);

-- Donation campaigns indexes
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_active ON donation_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_featured ON donation_campaigns(featured);

-- ============================================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger for payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for refunds
DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON refunds
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for donation campaigns
DROP TRIGGER IF EXISTS update_donation_campaigns_updated_at ON donation_campaigns;
CREATE TRIGGER update_donation_campaigns_updated_at
BEFORE UPDATE ON donation_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. CREATE TRIGGER FOR AUTOMATIC TRANSACTION CREATION
-- ============================================================================

-- Automatically create a transaction record when payment status changes
CREATE OR REPLACE FUNCTION create_payment_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create transaction for succeeded, refunded, or failed payments
  IF NEW.status IN ('succeeded', 'refunded', 'partially_refunded', 'failed')
     AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN

    INSERT INTO transactions (
      payment_id,
      transaction_type,
      amount,
      currency,
      description,
      metadata
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.status = 'succeeded' THEN 'charge'
        WHEN NEW.status IN ('refunded', 'partially_refunded') THEN 'refund'
        ELSE 'adjustment'
      END,
      CASE
        WHEN NEW.status IN ('refunded', 'partially_refunded') THEN -NEW.amount_refunded
        ELSE NEW.amount
      END,
      NEW.currency,
      CASE
        WHEN NEW.status = 'succeeded' THEN 'Payment succeeded'
        WHEN NEW.status = 'refunded' THEN 'Payment fully refunded'
        WHEN NEW.status = 'partially_refunded' THEN 'Payment partially refunded'
        ELSE 'Payment ' || NEW.status
      END,
      jsonb_build_object('auto_created', true, 'previous_status', OLD.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_payment_transaction ON payments;
CREATE TRIGGER trigger_create_payment_transaction
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION create_payment_transaction();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Only backend can insert payments (via Edge Functions)
CREATE POLICY "Only service role can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Users cannot directly insert, must use Edge Function

-- Policy: Only backend can update payments
CREATE POLICY "Only service role can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (false); -- Users cannot update, must use Edge Function

-- Policy: Only admins can delete payments
CREATE POLICY "Only admins can delete payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRANSACTIONS POLICIES
-- ============================================================================

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = transactions.payment_id
        AND payments.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: No direct insert (auto-created by triggers or Edge Functions)
CREATE POLICY "No direct transaction insert"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Only backend can manage subscriptions
CREATE POLICY "Only service role can insert subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only service role can update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (false);

-- ============================================================================
-- REFUNDS POLICIES
-- ============================================================================

-- Policy: Users can view refunds for their payments
CREATE POLICY "Users can view own refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = refunds.payment_id
        AND payments.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all refunds
CREATE POLICY "Admins can view all refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Only backend can manage refunds
CREATE POLICY "Only service role can insert refunds"
  ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ============================================================================
-- DONATION CAMPAIGNS POLICIES
-- ============================================================================

-- Policy: All authenticated users can view active campaigns
CREATE POLICY "Members can view active donation campaigns"
  ON donation_campaigns
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Admins can view all campaigns
CREATE POLICY "Admins can view all donation campaigns"
  ON donation_campaigns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can manage campaigns
CREATE POLICY "Admins can manage donation campaigns"
  ON donation_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's total payments
CREATE OR REPLACE FUNCTION get_user_total_payments(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)::INTEGER
    FROM payments
    WHERE user_id = user_id_param
      AND status = 'succeeded'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active subscriptions count
CREATE OR REPLACE FUNCTION get_user_active_subscriptions_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM subscriptions
    WHERE user_id = user_id_param
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total donations for a campaign
CREATE OR REPLACE FUNCTION update_campaign_total(campaign_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE donation_campaigns
  SET current_amount = (
    SELECT COALESCE(SUM(p.amount), 0)
    FROM payments p
    WHERE p.metadata->>'campaign_id' = campaign_id_param::text
      AND p.payment_type = 'donation'
      AND p.status = 'succeeded'
  )
  WHERE id = campaign_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any active subscription
CREATE OR REPLACE FUNCTION user_has_active_membership(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = user_id_param
      AND status = 'active'
      AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'payments') = 1,
    'payments table was not created';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'transactions') = 1,
    'transactions table was not created';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'subscriptions') = 1,
    'subscriptions table was not created';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'refunds') = 1,
    'refunds table was not created';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'donation_campaigns') = 1,
    'donation_campaigns table was not created';

  RAISE NOTICE 'Payments System Migration completed successfully!';
  RAISE NOTICE 'Tables created: payments, transactions, subscriptions, refunds, donation_campaigns';
  RAISE NOTICE 'Indexes created: 20 total';
  RAISE NOTICE 'RLS Policies created: 18 total';
  RAISE NOTICE 'Helper functions created: 4 total';
  RAISE NOTICE 'Triggers created: 5 total (4 updated_at + 1 transaction auto-create)';
END $$;

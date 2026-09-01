-- ============================================================
-- Uangku - Full Database Schema for Supabase
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  business_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  currency TEXT DEFAULT 'IDR',
  date_format TEXT DEFAULT 'dd/MM/yyyy',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. FINANCIAL ACCOUNTS
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('kas','bank','ewallet','utang','piutang')),
  initial_balance NUMERIC(15,2) DEFAULT 0 CHECK (initial_balance >= 0),
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#2563EB',
  icon TEXT DEFAULT '💰',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own accounts" ON financial_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_accounts_user ON financial_accounts(user_id);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pemasukan','pengeluaran')),
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own categories" ON categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_categories_user ON categories(user_id);

-- 4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pemasukan','pengeluaran','transfer')),
  account_id UUID NOT NULL REFERENCES financial_accounts(id),
  destination_account_id UUID REFERENCES financial_accounts(id),
  category_id UUID REFERENCES categories(id),
  counterparty TEXT DEFAULT '',
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  attachment_url TEXT,
  status TEXT DEFAULT 'selesai' CHECK (status IN ('pending','selesai','dibatalkan')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- 5. RECEIVABLES / PAYABLES (UTANG & PIUTANG)
CREATE TABLE IF NOT EXISTS receivables_payables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('utang','piutang')),
  counterparty TEXT NOT NULL,
  reference_number TEXT DEFAULT '',
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  initial_amount NUMERIC(15,2) NOT NULL CHECK (initial_amount > 0),
  notes TEXT DEFAULT '',
  account_id UUID NOT NULL REFERENCES financial_accounts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE receivables_payables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own receivables_payables" ON receivables_payables
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rp_user ON receivables_payables(user_id);
CREATE INDEX idx_rp_type ON receivables_payables(type);
CREATE INDEX idx_rp_due ON receivables_payables(due_date);

-- 6. DEBT PAYMENTS
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receivable_payable_id UUID NOT NULL REFERENCES receivables_payables(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  account_id UUID NOT NULL REFERENCES financial_accounts(id),
  transaction_id UUID REFERENCES transactions(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own debt_payments" ON debt_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_dp_user ON debt_payments(user_id);
CREATE INDEX idx_dp_rp ON debt_payments(receivable_payable_id);

-- 7. BUDGETS
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  month TEXT NOT NULL, -- YYYY-MM format
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- ============================================================
-- RPC: Generate Transaction Number (per month, per user)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_transaction_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_seq BIGINT;
  v_number TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  v_month := to_char(now(), 'MM');

  SELECT COUNT(*) + 1 INTO v_seq
  FROM transactions
  WHERE user_id = p_user_id
    AND transaction_number LIKE 'TRX-' || v_year || v_month || '-%';

  v_number := 'TRX-' || v_year || v_month || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: Record Debt Payment with Linked Transaction
-- ============================================================
CREATE OR REPLACE FUNCTION record_debt_payment(
  p_debt_id UUID,
  p_payment_date DATE,
  p_amount NUMERIC,
  p_account_id UUID,
  p_notes TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
  v_debt RECORD;
  v_txn_type TEXT;
  v_txn_id UUID;
  v_payment_id UUID;
BEGIN
  -- Get the debt/receivable
  SELECT * INTO v_debt FROM receivables_payables WHERE id = p_debt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Data utang/piutang tidak ditemukan'; END IF;

  -- Create linked transaction
  IF v_debt.type = 'piutang' THEN
    v_txn_type := 'pemasukan';
  ELSE
    v_txn_type := 'pengeluaran';
  END IF;

  INSERT INTO transactions (user_id, transaction_number, date, type, account_id, counterparty, amount, description, status)
  VALUES (
    v_debt.user_id,
    generate_transaction_number(v_debt.user_id),
    p_payment_date,
    v_txn_type,
    p_account_id,
    v_debt.counterparty,
    p_amount,
    'Pembayaran ' || CASE WHEN v_debt.type = 'piutang' THEN 'Piutang' ELSE 'Utang' END || ' - ' || v_debt.counterparty,
    'selesai'
  ) RETURNING id INTO v_txn_id;

  -- Create payment record
  INSERT INTO debt_payments (user_id, receivable_payable_id, payment_date, amount, account_id, transaction_id, notes)
  VALUES (v_debt.user_id, p_debt_id, p_payment_date, p_amount, p_account_id, v_txn_id, p_notes)
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

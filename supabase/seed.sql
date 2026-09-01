-- ============================================================
-- Uangku - Seed Data for Demo
-- Jalankan setelah schema.sql
-- ============================================================

-- NOTE: Seed ini harus dijalankan SETELAH user pertama register.
-- Untuk testing, gunakan user ID dari auth.users yang sudah register.

-- Contoh: Ganti 'YOUR_USER_ID' dengan UUID user yang sudah register
-- Anda bisa mendapatkan user ID dari Supabase Dashboard → Authentication → Users

-- ============================================================
-- SEED CATEGORIES
-- ============================================================
-- Pemasukan
INSERT INTO categories (user_id, name, type, icon, color) VALUES
  ('YOUR_USER_ID', 'Penjualan', 'pemasukan', '💰', '#059669'),
  ('YOUR_USER_ID', 'Pendapatan Jasa', 'pemasukan', '📈', '#2563EB'),
  ('YOUR_USER_ID', 'Pendapatan Lain', 'pemasukan', '🎯', '#D97706');

-- Pengeluaran
INSERT INTO categories (user_id, name, type, icon, color) VALUES
  ('YOUR_USER_ID', 'Pembelian Bahan', 'pengeluaran', '🛒', '#DC2626'),
  ('YOUR_USER_ID', 'Gaji', 'pengeluaran', '💼', '#7C3AED'),
  ('YOUR_USER_ID', 'Transportasi', 'pengeluaran', '🚗', '#D97706'),
  ('YOUR_USER_ID', 'Listrik', 'pengeluaran', '⚡', '#2563EB'),
  ('YOUR_USER_ID', 'Kemasan', 'pengeluaran', '📦', '#0891B2'),
  ('YOUR_USER_ID', 'Operasional', 'pengeluaran', '🏠', '#059669'),
  ('YOUR_USER_ID', 'Pajak', 'pengeluaran', '📋', '#C026D3'),
  ('YOUR_USER_ID', 'Pengeluaran Lain', 'pengeluaran', '💡', '#6B7280');

-- ============================================================
-- SEED ACCOUNTS
-- ============================================================
INSERT INTO financial_accounts (user_id, name, account_type, initial_balance, color, icon) VALUES
  ('YOUR_USER_ID', 'Kas Tunai', 'kas', 2500000, '#059669', '💵'),
  ('YOUR_USER_ID', 'Bank BCA', 'bank', 10000000, '#2563EB', '🏦'),
  ('YOUR_USER_ID', 'Bank Mandiri', 'bank', 5000000, '#7C3AED', '🏦'),
  ('YOUR_USER_ID', 'E-Wallet', 'ewallet', 750000, '#D97706', '📱');

-- ============================================================
-- SEED TRANSACTIONS (contoh untuk bulan ini)
-- Ambil account IDs yang baru dibuat
-- ============================================================
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID';
  v_kas_id UUID;
  v_bca_id UUID;
  v_mandiri_id UUID;
  v_ewallet_id UUID;
  v_penjualan_id UUID;
  v_jasa_id UUID;
  v_bahan_id UUID;
  v_gaji_id UUID;
  v_listrik_id UUID;
BEGIN
  -- Get account IDs
  SELECT id INTO v_kas_id FROM financial_accounts WHERE user_id = v_user_id AND name = 'Kas Tunai' LIMIT 1;
  SELECT id INTO v_bca_id FROM financial_accounts WHERE user_id = v_user_id AND name = 'Bank BCA' LIMIT 1;
  SELECT id INTO v_mandiri_id FROM financial_accounts WHERE user_id = v_user_id AND name = 'Bank Mandiri' LIMIT 1;
  SELECT id INTO v_ewallet_id FROM financial_accounts WHERE user_id = v_user_id AND name = 'E-Wallet' LIMIT 1;

  -- Get category IDs
  SELECT id INTO v_penjualan_id FROM categories WHERE user_id = v_user_id AND name = 'Penjualan' LIMIT 1;
  SELECT id INTO v_jasa_id FROM categories WHERE user_id = v_user_id AND name = 'Pendapatan Jasa' LIMIT 1;
  SELECT id INTO v_bahan_id FROM categories WHERE user_id = v_user_id AND name = 'Pembelian Bahan' LIMIT 1;
  SELECT id INTO v_gaji_id FROM categories WHERE user_id = v_user_id AND name = 'Gaji' LIMIT 1;
  SELECT id INTO v_listrik_id FROM categories WHERE user_id = v_user_id AND name = 'Listrik' LIMIT 1;

  -- Sample transactions
  INSERT INTO transactions (user_id, transaction_number, date, type, account_id, category_id, counterparty, amount, description, status) VALUES
    -- Pemasukan
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE, 'pemasukan', v_bca_id, v_penjualan_id, 'Toko ABC', 15000000, 'Penjualan bulan ini', 'selesai'),
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 2, 'pemasukan', v_mandiri_id, v_jasa_id, 'Klien XYZ', 5000000, 'Jasa konsultasi', 'selesai'),
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 5, 'pemasukan', v_ewallet_id, NULL, 'Cashback', 250000, 'Cashback promosi', 'selesai'),
    -- Pengeluaran
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 1, 'pengeluaran', v_bca_id, v_bahan_id, 'Supplier PQR', 5500000, 'Restock bahan', 'selesai'),
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 3, 'pengeluaran', v_bca_id, v_gaji_id, 'Karyawan', 5000000, 'Gaji bulan ini', 'selesai'),
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 4, 'pengeluaran', v_kas_id, NULL, 'Grab', 150000, 'Transport klien', 'selesai'),
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 6, 'pengeluaran', v_ewallet_id, v_listrik_id, 'PLN', 800000, 'Listrik bulan ini', 'selesai'),
    -- Transfer
    (v_user_id, generate_transaction_number(v_user_id), CURRENT_DATE - 7, 'transfer', v_bca_id, v_kas_id, NULL, 1000000, 'Ambil kas dari bank', 'selesai');

  -- ============================================================
  -- SEED DEBTS / RECEIVABLES
  -- ============================================================
  -- Piutang (uang yang harus diterima)
  INSERT INTO receivables_payables (user_id, type, counterparty, reference_number, date, due_date, initial_amount, notes, account_id) VALUES
    (v_user_id, 'piutang', 'Toko ABC', 'PIU-2025-001', CURRENT_DATE - 30, CURRENT_DATE + 15, 7500000, 'Piutang penjualan paket', v_bca_id),
    (v_user_id, 'piutang', 'Klien STU', 'PIU-2025-002', CURRENT_DATE - 60, CURRENT_DATE - 10, 3000000, 'Jasa konsultasi', v_mandiri_id);

  -- Utang (uang yang harus dibayar)
  INSERT INTO receivables_payables (user_id, type, counterparty, reference_number, date, due_date, initial_amount, notes, account_id) VALUES
    (v_user_id, 'utang', 'Supplier XYZ', 'UTG-2025-001', CURRENT_DATE - 30, CURRENT_DATE + 30, 10000000, 'Utang bahan baku', v_bca_id),
    (v_user_id, 'utang', 'Supplier PQR', 'UTG-2025-002', CURRENT_DATE - 60, CURRENT_DATE - 5, 4000000, 'Utang packaging', v_mandiri_id);

  -- ============================================================
  -- SEED DEBT PAYMENTS
  -- ============================================================
  -- Pembayaran piutang dari Klien STU (sebagian)
  INSERT INTO debt_payments (user_id, receivable_payable_id, payment_date, amount, account_id, notes)
  SELECT v_user_id, id, CURRENT_DATE - 15, 1500000, v_mandiri_id, 'Pembayaran pertama'
  FROM receivables_payables WHERE user_id = v_user_id AND counterparty = 'Klien STU' LIMIT 1;

  -- Pembayaran utang ke Supplier PQR (sebagian)
  INSERT INTO debt_payments (user_id, receivable_payable_id, payment_date, amount, account_id, notes)
  SELECT v_user_id, id, CURRENT_DATE - 20, 2000000, v_bca_id, 'Pelunasan sebagian'
  FROM receivables_payables WHERE user_id = v_user_id AND counterparty = 'Supplier PQR' LIMIT 1;

  -- ============================================================
  -- SEED BUDGETS
  -- ============================================================
  INSERT INTO budgets (user_id, category_id, month, amount)
  SELECT v_user_id, id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    CASE
      WHEN name = 'Gaji' THEN 6000000
      WHEN name = 'Pembelian Bahan' THEN 8000000
      WHEN name = 'Transportasi' THEN 1500000
    END
  FROM categories
  WHERE user_id = v_user_id AND name IN ('Gaji', 'Pembelian Bahan', 'Transportasi');

END $$;

-- ============================================================
-- SEED USER PROFILE
-- ============================================================
INSERT INTO profiles (user_id, full_name, business_name, currency)
VALUES ('YOUR_USER_ID', 'Pengguna Uangku', 'Uangku Business', 'IDR')
ON CONFLICT (user_id) DO NOTHING;

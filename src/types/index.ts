export type AccountType = "kas" | "bank" | "ewallet" | "utang" | "piutang";
export type TransactionType = "pemasukan" | "pengeluaran" | "transfer";
export type TransactionStatus = "pending" | "selesai" | "dibatalkan";
export type DebtType = "utang" | "piutang";
export type DebtStatus = "belum_bayar" | "sebagian" | "lunas" | "jatuh_tempo";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  address: string;
  phone: string;
  currency: string;
  date_format: string;
  created_at: string;
}

export interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  initial_balance: number;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  // computed
  current_balance?: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "pemasukan" | "pengeluaran";
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_number: string;
  date: string;
  type: TransactionType;
  account_id: string;
  destination_account_id?: string;
  category_id?: string;
  counterparty: string;
  amount: number;
  description: string;
  attachment_url?: string;
  status: TransactionStatus;
  created_at: string;
  // joined
  account_name?: string;
  destination_account_name?: string;
  category_name?: string;
}

export interface ReceivablePayable {
  id: string;
  user_id: string;
  type: DebtType;
  counterparty: string;
  reference_number: string;
  date: string;
  due_date: string;
  initial_amount: number;
  notes: string;
  account_id: string;
  created_at: string;
  // computed
  total_paid?: number;
  remaining?: number;
  status?: DebtStatus;
  // joined
  account_name?: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  receivable_payable_id: string;
  payment_date: string;
  amount: number;
  account_id: string;
  transaction_id?: string;
  notes: string;
  created_at: string;
  // joined
  account_name?: string;
  transaction_number?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // YYYY-MM
  amount: number;
  created_at: string;
  // computed
  spent?: number;
  remaining?: number;
  percentage?: number;
  // joined
  category_name?: string;
  category_icon?: string;
}

export interface UserSettings {
  theme: "light" | "dark";
  currency: string;
  date_format: string;
}

export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  profitLoss: number;
  totalReceivable: number;
  totalPayable: number;
  recentTransactions: Transaction[];
  monthlyChart: { month: string; pemasukan: number; pengeluaran: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  dueAlerts: { id: string; counterparty: string; type: DebtType; due_date: string; remaining: number; daysUntilDue: number }[];
}

export interface FilterParams {
  start_date?: string;
  end_date?: string;
  type?: TransactionType | "all";
  account_id?: string;
  category_id?: string;
  status?: string;
  search?: string;
}

import type {
  FinancialAccount,
  Category,
  Transaction,
  ReceivablePayable,
  DebtPayment,
  Budget,
  Profile,
  TransactionType,
  FilterParams,
} from "@/types";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/constants";
import { getMonthRange, generateTransactionNumber, toISODate } from "@/lib/utils";

// ── LocalStorage wrapper ───────────────────────────────────────────
function db<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(`uangku_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function dbSet<T>(key: string, data: T[]) {
  localStorage.setItem(`uangku_${key}`, JSON.stringify(data));
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function now(): string {
  return new Date().toISOString();
}

// ── Profile ────────────────────────────────────────────────────────
export function getProfile(): Profile | null {
  const profiles = db<Profile>("profiles");
  return profiles[0] || null;
}

export function saveProfile(data: Partial<Profile>): Profile {
  const profiles = db<Profile>("profiles");
  if (profiles.length > 0) {
    const updated = { ...profiles[0], ...data };
    profiles[0] = updated;
    dbSet("profiles", profiles);
    return updated;
  }
  const profile: Profile = {
    id: generateId(),
    user_id: "local-user",
    full_name: data.full_name || "Pengguna",
    business_name: data.business_name || "",
    address: data.address || "",
    phone: data.phone || "",
    currency: data.currency || "IDR",
    date_format: data.date_format || "dd/MM/yyyy",
    created_at: now(),
  };
  dbSet("profiles", [profile]);
  return profile;
}

// ── Accounts ───────────────────────────────────────────────────────
export function getAccounts(): FinancialAccount[] {
  return db<FinancialAccount>("accounts");
}

export function getActiveAccounts(): FinancialAccount[] {
  return getAccounts().filter((a) => a.is_active);
}

export function getAccountById(id: string): FinancialAccount | undefined {
  return getAccounts().find((a) => a.id === id);
}

export function getCurrentBalance(accountId: string): number {
  const account = getAccountById(accountId);
  if (!account) return 0;
  const txns = getTransactions().filter(
    (t) => t.status === "selesai" && (t.account_id === accountId || t.destination_account_id === accountId)
  );
  let balance = account.initial_balance;
  for (const t of txns) {
    if (t.account_id === accountId) {
      if (t.type === "pemasukan") balance += t.amount;
      else if (t.type === "pengeluaran") balance -= t.amount;
      else if (t.type === "transfer") balance -= t.amount;
    }
    if (t.destination_account_id === accountId && t.type === "transfer") {
      balance += t.amount;
    }
  }
  return balance;
}

export function saveAccount(data: Partial<FinancialAccount>): FinancialAccount {
  const accounts = db<FinancialAccount>("accounts");
  if (data.id) {
    const idx = accounts.findIndex((a) => a.id === data.id);
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...data };
      dbSet("accounts", accounts);
      return accounts[idx];
    }
  }
  const account: FinancialAccount = {
    id: generateId(),
    user_id: "local-user",
    name: data.name || "",
    account_type: data.account_type || "kas",
    initial_balance: data.initial_balance || 0,
    is_active: data.is_active !== false,
    color: data.color || "#2563EB",
    icon: data.icon || "💰",
    created_at: now(),
  };
  accounts.push(account);
  dbSet("accounts", accounts);
  return account;
}

export function deleteAccount(id: string) {
  const accounts = db<FinancialAccount>("accounts");
  dbSet("accounts", accounts.filter((a) => a.id !== id));
}

// ── Categories ─────────────────────────────────────────────────────
export function getCategories(): Category[] {
  return db<Category>("categories");
}

export function getActiveCategories(type?: "pemasukan" | "pengeluaran"): Category[] {
  let cats = getCategories().filter((c) => c.is_active);
  if (type) cats = cats.filter((c) => c.type === type);
  return cats;
}

export function saveCategory(data: Partial<Category>): Category {
  const categories = db<Category>("categories");
  if (data.id) {
    const idx = categories.findIndex((c) => c.id === data.id);
    if (idx >= 0) {
      categories[idx] = { ...categories[idx], ...data };
      dbSet("categories", categories);
      return categories[idx];
    }
  }
  const cat: Category = {
    id: generateId(),
    user_id: "local-user",
    name: data.name || "",
    type: data.type || "pengeluaran",
    icon: data.icon || "📋",
    color: data.color || "#6B7280",
    is_active: data.is_active !== false,
    created_at: now(),
  };
  categories.push(cat);
  dbSet("categories", categories);
  return cat;
}

export function deleteCategory(id: string) {
  const categories = db<Category>("categories");
  dbSet("categories", categories.filter((c) => c.id !== id));
}

// ── Transactions ───────────────────────────────────────────────────
export function getTransactions(): Transaction[] {
  return db<Transaction>("transactions").sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getNextTransactionNumber(): string {
  const now = new Date();
  const { start, end } = getMonthRange(now);
  const txns = getTransactions().filter(
    (t) => t.date >= start && t.date <= end
  );
  return generateTransactionNumber(txns.length + 1, now);
}

export function filterTransactions(params: FilterParams): Transaction[] {
  let txns = getTransactions();
  if (params.start_date) txns = txns.filter((t) => t.date >= params.start_date!);
  if (params.end_date) txns = txns.filter((t) => t.date <= params.end_date!);
  if (params.type && params.type !== "all") txns = txns.filter((t) => t.type === params.type);
  if (params.account_id) txns = txns.filter((t) => t.account_id === params.account_id || t.destination_account_id === params.account_id);
  if (params.category_id) txns = txns.filter((t) => t.category_id === params.category_id);
  if (params.status) txns = txns.filter((t) => t.status === params.status);
  if (params.search) {
    const s = params.search.toLowerCase();
    txns = txns.filter(
      (t) =>
        t.transaction_number.toLowerCase().includes(s) ||
        t.counterparty.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s)
    );
  }
  return txns;
}

export function saveTransaction(data: Partial<Transaction>): Transaction {
  const transactions = db<Transaction>("transactions");
  if (data.id) {
    const idx = transactions.findIndex((t) => t.id === data.id);
    if (idx >= 0) {
      transactions[idx] = { ...transactions[idx], ...data };
      dbSet("transactions", transactions);
      return transactions[idx];
    }
  }
  const txn: Transaction = {
    id: generateId(),
    user_id: "local-user",
    transaction_number: data.transaction_number || getNextTransactionNumber(),
    date: data.date || toISODate(new Date()),
    type: data.type || "pengeluaran",
    account_id: data.account_id || "",
    destination_account_id: data.destination_account_id,
    category_id: data.category_id,
    counterparty: data.counterparty || "",
    amount: data.amount || 0,
    description: data.description || "",
    attachment_url: data.attachment_url,
    status: data.status || "selesai",
    created_at: now(),
  };
  transactions.push(txn);
  dbSet("transactions", transactions);
  return txn;
}

export function updateTransaction(id: string, data: Partial<Transaction>): Transaction | null {
  const transactions = db<Transaction>("transactions");
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  transactions[idx] = { ...transactions[idx], ...data };
  dbSet("transactions", transactions);
  return transactions[idx];
}

export function deleteTransaction(id: string) {
  const transactions = db<Transaction>("transactions");
  dbSet("transactions", transactions.filter((t) => t.id !== id));
}

export function duplicateTransaction(id: string): Transaction | null {
  const txn = getTransactions().find((t) => t.id === id);
  if (!txn) return null;
  return saveTransaction({
    ...txn,
    id: undefined,
    transaction_number: getNextTransactionNumber(),
    date: toISODate(new Date()),
    created_at: undefined,
  });
}

// ── Debts / Receivables ────────────────────────────────────────────
export function getDebts(type?: "utang" | "piutang"): ReceivablePayable[] {
  let items = db<ReceivablePayable>("debts");
  if (type) items = items.filter((d) => d.type === type);
  return items.map((d) => enrichDebt(d)).sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );
}

export function getDebtById(id: string): ReceivablePayable | undefined {
  const item = db<ReceivablePayable>("debts").find((d) => d.id === id);
  return item ? enrichDebt(item) : undefined;
}

function enrichDebt(d: ReceivablePayable): ReceivablePayable {
  const payments = getDebtPayments(d.id);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = d.initial_amount - totalPaid;
  const today = toISODate(new Date());
  let status: ReceivablePayable["status"] = "belum_bayar";
  if (remaining <= 0) status = "lunas";
  else if (totalPaid > 0) status = "sebagian";
  else if (d.due_date < today) status = "jatuh_tempo";

  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === d.account_id);

  return { ...d, total_paid: totalPaid, remaining, status, account_name: account?.name };
}

export function saveDebt(data: Partial<ReceivablePayable>): ReceivablePayable {
  const debts = db<ReceivablePayable>("debts");
  if (data.id) {
    const idx = debts.findIndex((d) => d.id === data.id);
    if (idx >= 0) {
      debts[idx] = { ...debts[idx], ...data };
      dbSet("debts", debts);
      return enrichDebt(debts[idx]);
    }
  }
  const debt: ReceivablePayable = {
    id: generateId(),
    user_id: "local-user",
    type: data.type || "utang",
    counterparty: data.counterparty || "",
    reference_number: data.reference_number || "",
    date: data.date || toISODate(new Date()),
    due_date: data.due_date || toISODate(new Date()),
    initial_amount: data.initial_amount || 0,
    notes: data.notes || "",
    account_id: data.account_id || "",
    created_at: now(),
  };
  debts.push(debt);
  dbSet("debts", debts);
  return enrichDebt(debt);
}

export function updateDebt(id: string, data: Partial<ReceivablePayable>): ReceivablePayable | null {
  const debts = db<ReceivablePayable>("debts");
  const idx = debts.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  debts[idx] = { ...debts[idx], ...data };
  dbSet("debts", debts);
  return enrichDebt(debts[idx]);
}

export function deleteDebt(id: string) {
  const debts = db<ReceivablePayable>("debts");
  const payments = db<DebtPayment>("debt_payments");
  dbSet("debts", debts.filter((d) => d.id !== id));
  dbSet("debt_payments", payments.filter((p) => p.receivable_payable_id !== id));
}

// ── Debt Payments ──────────────────────────────────────────────────
export function getDebtPayments(debtId: string): DebtPayment[] {
  return db<DebtPayment>("debt_payments").filter((p) => p.receivable_payable_id === debtId);
}

export function getAllDebtPayments(): DebtPayment[] {
  return db<DebtPayment>("debt_payments");
}

export function saveDebtPayment(data: Partial<DebtPayment>): DebtPayment {
  const payments = db<DebtPayment>("debt_payments");
  const debt = getDebtById(data.receivable_payable_id || "");

  // Create linked transaction
  let txnId: string | undefined;
  if (debt && data.amount && data.account_id) {
    const txnType: TransactionType = debt.type === "piutang" ? "pemasukan" : "pengeluaran";
    const txn = saveTransaction({
      date: data.payment_date,
      type: txnType,
      account_id: data.account_id,
      category_id: undefined,
      counterparty: debt.counterparty,
      amount: data.amount,
      description: `Pembayaran ${debt.type === "piutang" ? "Piutang" : "Utang"} - ${debt.counterparty}`,
      status: "selesai",
    });
    txnId = txn.id;
  }

  const payment: DebtPayment = {
    id: generateId(),
    user_id: "local-user",
    receivable_payable_id: data.receivable_payable_id || "",
    payment_date: data.payment_date || toISODate(new Date()),
    amount: data.amount || 0,
    account_id: data.account_id || "",
    transaction_id: txnId,
    notes: data.notes || "",
    created_at: now(),
  };
  payments.push(payment);
  dbSet("debt_payments", payments);
  return payment;
}

export function updateDebtPayment(id: string, data: Partial<DebtPayment>): DebtPayment | null {
  const payments = db<DebtPayment>("debt_payments");
  const idx = payments.findIndex((p) => p.id === id);
  if (idx < 0) return null;

  const oldPayment = payments[idx];
  // Update linked transaction if amount changed
  if (data.amount && oldPayment.transaction_id) {
    updateTransaction(oldPayment.transaction_id, { amount: data.amount });
  }

  payments[idx] = { ...payments[idx], ...data };
  dbSet("debt_payments", payments);
  return payments[idx];
}

export function deleteDebtPayment(id: string) {
  const payments = db<DebtPayment>("debt_payments");
  const payment = payments.find((p) => p.id === id);
  // Delete linked transaction
  if (payment?.transaction_id) {
    deleteTransaction(payment.transaction_id);
  }
  dbSet("debt_payments", payments.filter((p) => p.id !== id));
}

// ── Budgets ────────────────────────────────────────────────────────
export function getBudgets(month: string): Budget[] {
  const budgets = db<Budget>("budgets").filter((b) => b.month === month);
  const categories = getCategories();
  return budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    const { start, end } = getMonthRange(new Date(month + "-01"));
    const txns = getTransactions().filter(
      (t) =>
        t.type === "pengeluaran" &&
        t.category_id === b.category_id &&
        t.status === "selesai" &&
        t.date >= start &&
        t.date <= end
    );
    const spent = txns.reduce((sum, t) => sum + t.amount, 0);
    return {
      ...b,
      spent,
      remaining: b.amount - spent,
      percentage: b.amount > 0 ? (spent / b.amount) * 100 : 0,
      category_name: cat?.name,
      category_icon: cat?.icon,
    };
  });
}

export function saveBudget(data: Partial<Budget>): Budget {
  const budgets = db<Budget>("budgets");
  if (data.id) {
    const idx = budgets.findIndex((b) => b.id === data.id);
    if (idx >= 0) {
      budgets[idx] = { ...budgets[idx], ...data };
      dbSet("budgets", budgets);
      return budgets[idx];
    }
  }
  const budget: Budget = {
    id: generateId(),
    user_id: "local-user",
    category_id: data.category_id || "",
    month: data.month || "",
    amount: data.amount || 0,
    created_at: now(),
  };
  budgets.push(budget);
  dbSet("budgets", budgets);
  return budget;
}

export function deleteBudget(id: string) {
  const budgets = db<Budget>("budgets");
  dbSet("budgets", budgets.filter((b) => b.id !== id));
}

// ── Dashboard ──────────────────────────────────────────────────────
export function getDashboardData() {
  const accounts = getActiveAccounts();
  const { start, end } = getMonthRange();
  const txns = getTransactions().filter((t) => t.status === "selesai");
  const monthTxns = txns.filter((t) => t.date >= start && t.date <= end);

  const totalBalance = accounts.reduce((sum, a) => sum + getCurrentBalance(a.id), 0);
  const monthlyIncome = monthTxns.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = monthTxns.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0);
  const profitLoss = monthlyIncome - monthlyExpense;

  const allDebts = getDebts();
  const totalReceivable = allDebts.filter((d) => d.type === "piutang" && d.status !== "lunas").reduce((s, d) => s + (d.remaining || 0), 0);
  const totalPayable = allDebts.filter((d) => d.type === "utang" && d.status !== "lunas").reduce((s, d) => s + (d.remaining || 0), 0);

  // Monthly chart - last 12 months
  const monthlyChart: { month: string; pemasukan: number; pengeluaran: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const { start: ms, end: me } = getMonthRange(d);
    const mtx = txns.filter((t) => t.date >= ms && t.date <= me);
    monthlyChart.push({
      month: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      pemasukan: mtx.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0),
      pengeluaran: mtx.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0),
    });
  }

  // Category breakdown
  const categories = getCategories();
  const catTotals = new Map<string, number>();
  monthTxns
    .filter((t) => t.type === "pengeluaran" && t.category_id)
    .forEach((t) => {
      catTotals.set(t.category_id!, (catTotals.get(t.category_id!) || 0) + t.amount);
    });
  const categoryBreakdown = Array.from(catTotals.entries())
    .map(([catId, value]) => {
      const cat = categories.find((c) => c.id === catId);
      return { name: cat?.name || "Lainnya", value, color: cat?.color || "#6B7280" };
    })
    .sort((a, b) => b.value - a.value);

  // Due alerts
  const today = toISODate(new Date());
  const dueAlerts = allDebts
    .filter((d) => d.status !== "lunas")
    .map((d) => {
      const daysUntil = Math.ceil((new Date(d.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: d.id,
        counterparty: d.counterparty,
        type: d.type,
        due_date: d.due_date,
        remaining: d.remaining || 0,
        daysUntilDue: daysUntil,
      };
    })
    .filter((a) => a.daysUntilDue <= 30)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    profitLoss,
    totalReceivable,
    totalPayable,
    recentTransactions: txns.slice(0, 10),
    monthlyChart,
    categoryBreakdown,
    dueAlerts,
  };
}

// ── Seed Data ──────────────────────────────────────────────────────
export function seedDemoData() {
  if (db<FinancialAccount>("accounts").length > 0) return; // already seeded

  // Accounts
  const accounts = DEFAULT_ACCOUNTS.map((a) => ({
    id: generateId(),
    user_id: "local-user",
    ...a,
    is_active: true,
    created_at: now(),
  }));
  dbSet("accounts", accounts);

  // Categories
  const categories: Category[] = [
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
      id: generateId(),
      user_id: "local-user",
      ...c,
      type: "pemasukan" as const,
      is_active: true,
      created_at: now(),
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      id: generateId(),
      user_id: "local-user",
      ...c,
      type: "pengeluaran" as const,
      is_active: true,
      created_at: now(),
    })),
  ];
  dbSet("categories", categories);

  // Sample transactions for current and previous months
  const today = new Date();
  const thisMonth = toISODate(today);
  const lastMonth = toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 10));
  const lastMonth2 = toISODate(new Date(today.getFullYear(), today.getMonth() - 2, 15));

  const incomeCats = categories.filter((c) => c.type === "pemasukan");
  const expenseCats = categories.filter((c) => c.type === "pengeluaran");
  const [kas, bca, mandiri, ewallet] = accounts;

  const sampleTxns: Partial<Transaction>[] = [
    // Last month 2
    { date: lastMonth2, type: "pemasukan", account_id: bca.id, category_id: incomeCats[0]?.id, counterparty: "Toko ABC", amount: 8500000, description: "Penjualan bulan lalu", status: "selesai" },
    { date: lastMonth2, type: "pengeluaran", account_id: bca.id, category_id: expenseCats[0]?.id, counterparty: "Supplier XYZ", amount: 3200000, description: "Pembelian bahan baku", status: "selesai" },
    { date: lastMonth2, type: "pengeluaran", account_id: kas.id, category_id: expenseCats[2]?.id, counterparty: "Driver", amount: 250000, description: "Ongkos kirim", status: "selesai" },
    // Last month
    { date: lastMonth, type: "pemasukan", account_id: bca.id, category_id: incomeCats[0]?.id, counterparty: "Toko DEF", amount: 12000000, description: "Penjualan paket", status: "selesai" },
    { date: lastMonth, type: "pemasukan", account_id: mandiri.id, category_id: incomeCats[1]?.id, counterparty: "Klien GHI", amount: 3500000, description: "Jasa konsultasi", status: "selesai" },
    { date: lastMonth, type: "pengeluaran", account_id: bca.id, category_id: expenseCats[1]?.id, counterparty: "Karyawan", amount: 4500000, description: "Gaji bulan lalu", status: "selesai" },
    { date: lastMonth, type: "pengeluaran", account_id: ewallet.id, category_id: expenseCats[3]?.id, counterparty: "PLN", amount: 750000, description: "Listrik bulan lalu", status: "selesai" },
    { date: lastMonth, type: "transfer", account_id: bca.id, destination_account_id: kas.id, amount: 1000000, description: "Ambil kas dari bank", status: "selesai" },
    // This month
    { date: thisMonth, type: "pemasukan", account_id: bca.id, category_id: incomeCats[0]?.id, counterparty: "Toko JKL", amount: 15000000, description: "Penjualan bulan ini", status: "selesai" },
    { date: thisMonth, type: "pemasukan", account_id: mandiri.id, category_id: incomeCats[1]?.id, counterparty: "Klien MNO", amount: 5000000, description: "Jasa desain", status: "selesai" },
    { date: thisMonth, type: "pemasukan", account_id: ewallet.id, category_id: incomeCats[2]?.id, counterparty: "Cashback", amount: 250000, description: "Cashback promosi", status: "selesai" },
    { date: thisMonth, type: "pengeluaran", account_id: bca.id, category_id: expenseCats[0]?.id, counterparty: "Supplier PQR", amount: 5500000, description: "Restock bahan", status: "selesai" },
    { date: thisMonth, type: "pengeluaran", account_id: bca.id, category_id: expenseCats[1]?.id, counterparty: "Karyawan", amount: 5000000, description: "Gaji bulan ini", status: "selesai" },
    { date: thisMonth, type: "pengeluaran", account_id: kas.id, category_id: expenseCats[2]?.id, counterparty: "Grab", amount: 150000, description: "Transport klien", status: "selesai" },
    { date: thisMonth, type: "pengeluaran", account_id: ewallet.id, category_id: expenseCats[3]?.id, counterparty: "PLN", amount: 800000, description: "Listrik bulan ini", status: "selesai" },
    { date: thisMonth, type: "pengeluaran", account_id: mandiri.id, category_id: expenseCats[5]?.id, counterparty: "IndiHome", amount: 350000, description: "Internet bulanan", status: "selesai" },
    { date: thisMonth, type: "pengeluaran", account_id: kas.id, category_id: expenseCats[4]?.id, counterparty: "Supplier Box", amount: 400000, description: "Kemasan produk", status: "selesai" },
  ];

  const txns: Transaction[] = sampleTxns.map((t, i) => ({
    id: generateId(),
    user_id: "local-user",
    transaction_number: generateTransactionNumber(i + 1, new Date(t.date!)),
    date: t.date!,
    type: t.type || "pengeluaran",
    account_id: t.account_id || "",
    destination_account_id: t.destination_account_id,
    category_id: t.category_id,
    counterparty: t.counterparty || "",
    amount: t.amount || 0,
    description: t.description || "",
    status: (t.status as Transaction["status"]) || "selesai",
    created_at: now(),
  }));
  dbSet("transactions", txns);

  // Sample debts
  const debts: ReceivablePayable[] = [
    {
      id: generateId(), user_id: "local-user", type: "piutang", counterparty: "Toko ABC",
      reference_number: "PIU-2025-001", date: lastMonth,
      due_date: toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 15)),
      initial_amount: 7500000, notes: "Piutang penjualan paket", account_id: bca.id, created_at: now(),
    },
    {
      id: generateId(), user_id: "local-user", type: "piutang", counterparty: "Klien STU",
      reference_number: "PIU-2025-002", date: lastMonth2,
      due_date: toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 10)),
      initial_amount: 3000000, notes: "Jasa konsultasi", account_id: mandiri.id, created_at: now(),
    },
    {
      id: generateId(), user_id: "local-user", type: "utang", counterparty: "Supplier XYZ",
      reference_number: "UTG-2025-001", date: lastMonth,
      due_date: toISODate(new Date(today.getFullYear(), today.getMonth() + 2, 1)),
      initial_amount: 10000000, notes: "Utang bahan baku", account_id: bca.id, created_at: now(),
    },
    {
      id: generateId(), user_id: "local-user", type: "utang", counterparty: "Supplier PQR",
      reference_number: "UTG-2025-002", date: lastMonth2,
      due_date: toISODate(new Date(today.getFullYear(), today.getMonth(), 20)),
      initial_amount: 4000000, notes: "Utang packaging", account_id: mandiri.id, created_at: now(),
    },
  ];
  dbSet("debts", debts);

  // Sample debt payments
  const dpPayments: DebtPayment[] = [
    {
      id: generateId(), user_id: "local-user",
      receivable_payable_id: debts[1].id, // Klien STU partially paid
      payment_date: lastMonth, amount: 1500000,
      account_id: mandiri.id, notes: "Pembayaran pertama",
      created_at: now(),
    },
    {
      id: generateId(), user_id: "local-user",
      receivable_payable_id: debts[3].id, // Supplier PQR partially paid
      payment_date: lastMonth, amount: 2000000,
      account_id: bca.id, notes: "Pelunasan sebagian",
      created_at: now(),
    },
  ];
  dbSet("debt_payments", dpPayments);

  // Sample budgets
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const budgets: Budget[] = expenseCats.slice(0, 3).map((c) => ({
    id: generateId(),
    user_id: "local-user",
    category_id: c.id,
    month: currentMonth,
    amount: c.name === "Gaji" ? 6000000 : c.name === "Pembelian Bahan" ? 8000000 : 1500000,
    created_at: now(),
  }));
  dbSet("budgets", budgets);
}

export function clearAllData() {
  const keys = ["accounts", "categories", "transactions", "debts", "debt_payments", "budgets", "profiles"];
  keys.forEach((k) => localStorage.removeItem(`uangku_${k}`));
}

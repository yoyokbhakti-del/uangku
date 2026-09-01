import { supabase } from "@/lib/supabase";
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

// ============================================================
// PROFILES
// ============================================================
export async function getProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) console.error("Error fetching profile:", error);
  return data;
}

export async function saveProfile(profile: Partial<Profile>): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ ...profile, user_id: user.id })
    .select()
    .single();

  if (error) console.error("Error saving profile:", error);
  return data;
}

// ============================================================
// ACCOUNTS
// ============================================================
export async function getAccounts(): Promise<FinancialAccount[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("financial_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) console.error("Error fetching accounts:", error);
  return data || [];
}

export async function getActiveAccounts(): Promise<FinancialAccount[]> {
  const accounts = await getAccounts();
  return accounts.filter((a) => a.is_active);
}

export async function getCurrentBalance(accountId: string): Promise<number> {
  if (!supabase) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get account initial balance
  const { data: account } = await supabase
    .from("financial_accounts")
    .select("initial_balance")
    .eq("id", accountId)
    .single();

  if (!account) return 0;
  let balance = account.initial_balance;

  // Get all completed transactions for this account
  const { data: txns } = await supabase
    .from("transactions")
    .select("type, amount, destination_account_id")
    .eq("user_id", user.id)
    .eq("status", "selesai")
    .or(`account_id.eq.${accountId},destination_account_id.eq.${accountId}`);

  if (txns) {
    for (const t of txns) {
      if (t.type === "transfer") {
        // For transfers, check if this account is source or destination
        if (t.destination_account_id === accountId) {
          balance += t.amount; // Money coming in
        } else {
          balance -= t.amount; // Money going out (this is the source)
        }
      } else if (t.type === "pemasukan") {
        balance += t.amount;
      } else if (t.type === "pengeluaran") {
        balance -= t.amount;
      }
    }
  }

  return balance;
}

export async function saveAccount(account: Partial<FinancialAccount>): Promise<FinancialAccount | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("financial_accounts")
    .upsert({ ...account, user_id: user.id })
    .select()
    .single();

  if (error) console.error("Error saving account:", error);
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("financial_accounts")
    .delete()
    .eq("id", id);

  if (error) console.error("Error deleting account:", error);
}

// ============================================================
// CATEGORIES
// ============================================================
export async function getCategories(): Promise<Category[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) console.error("Error fetching categories:", error);
  return data || [];
}

export async function getActiveCategories(type?: "pemasukan" | "pengeluaran"): Promise<Category[]> {
  const categories = await getCategories();
  let active = categories.filter((c) => c.is_active);
  if (type) active = active.filter((c) => c.type === type);
  return active;
}

export async function saveCategory(category: Partial<Category>): Promise<Category | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("categories")
    .upsert({ ...category, user_id: user.id })
    .select()
    .single();

  if (error) console.error("Error saving category:", error);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) console.error("Error deleting category:", error);
}

// ============================================================
// TRANSACTIONS
// ============================================================
export async function getTransactions(): Promise<Transaction[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      account:financial_accounts!transactions_account_id_fkey(name),
      destination_account:financial_accounts!transactions_destination_account_id_fkey(name),
      category:categories(name)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) console.error("Error fetching transactions:", error);

  // Map joined data
  return (data || []).map((t: any) => ({
    ...t,
    account_name: t.account?.name,
    destination_account_name: t.destination_account?.name,
    category_name: t.category?.name,
  }));
}

export async function getNextTransactionNumber(): Promise<string> {
  if (!supabase) return "TRX-000000-0001";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "TRX-000000-0001";

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `TRX-${year}${month}-`;

  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .like("transaction_number", `${prefix}%`);

  const seq = (count || 0) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function filterTransactions(params: FilterParams): Promise<Transaction[]> {
  let txns = await getTransactions();

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

export async function saveTransaction(txn: Partial<Transaction>): Promise<Transaction | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const transactionNumber = txn.transaction_number || await getNextTransactionNumber();

  const { data, error } = await supabase
    .from("transactions")
    .upsert({
      ...txn,
      transaction_number: transactionNumber,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) console.error("Error saving transaction:", error);
  return data;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) console.error("Error updating transaction:", error);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) console.error("Error deleting transaction:", error);
}

// ============================================================
// DEBTS / RECEIVABLES
// ============================================================
export async function getDebts(type?: "utang" | "piutang"): Promise<ReceivablePayable[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("receivables_payables")
    .select("*")
    .eq("user_id", user.id);

  if (type) query = query.eq("type", type);

  const { data, error } = await query.order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching debts:", error);
    return [];
  }

  // Enrich with payment data
  const enriched = await Promise.all(
    (data || []).map(async (d) => {
      if (!supabase) return { ...d, total_paid: 0, remaining: d.initial_amount, status: "belum_bayar" as const };
      const { data: payments } = await supabase
        .from("debt_payments")
        .select("amount")
        .eq("receivable_payable_id", d.id);

      const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0);
      const remaining = d.initial_amount - totalPaid;

      let status: ReceivablePayable["status"] = "belum_bayar";
      const today = new Date().toISOString().split("T")[0];
      if (remaining <= 0) status = "lunas";
      else if (totalPaid > 0) status = "sebagian";
      else if (d.due_date < today) status = "jatuh_tempo";

      return { ...d, total_paid: totalPaid, remaining, status };
    })
  );

  return enriched;
}

export async function saveDebt(debt: Partial<ReceivablePayable>): Promise<ReceivablePayable | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("receivables_payables")
    .upsert({ ...debt, user_id: user.id })
    .select()
    .single();

  if (error) console.error("Error saving debt:", error);
  return data;
}

export async function updateDebt(id: string, updates: Partial<ReceivablePayable>): Promise<ReceivablePayable | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("receivables_payables")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) console.error("Error updating debt:", error);
  return data;
}

export async function deleteDebt(id: string): Promise<void> {
  if (!supabase) return;
  // Delete payments first
  await supabase.from("debt_payments").delete().eq("receivable_payable_id", id);
  // Then delete debt
  await supabase.from("receivables_payables").delete().eq("id", id);
}

// ============================================================
// DEBT PAYMENTS
// ============================================================
export async function getDebtPayments(debtId: string): Promise<DebtPayment[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("receivable_payable_id", debtId)
    .order("payment_date", { ascending: false });

  if (error) console.error("Error fetching payments:", error);
  return data || [];
}

export async function saveDebtPayment(payment: Partial<DebtPayment>): Promise<DebtPayment | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use RPC to create payment with linked transaction
  const { data, error } = await supabase.rpc("record_debt_payment", {
    p_debt_id: payment.receivable_payable_id,
    p_payment_date: payment.payment_date,
    p_amount: payment.amount,
    p_account_id: payment.account_id,
    p_notes: payment.notes || "",
  });

  if (error) {
    console.error("Error saving payment:", error);
    // Fallback: insert directly
    const { data: directData, error: directError } = await supabase
      .from("debt_payments")
      .upsert({ ...payment, user_id: user.id })
      .select()
      .single();

    if (directError) console.error("Error saving payment (direct):", directError);
    return directData;
  }

  return { id: data, ...payment } as DebtPayment;
}

export async function deleteDebtPayment(id: string): Promise<void> {
  if (!supabase) return;

  // Get payment to find linked transaction
  const { data: payment } = await supabase
    .from("debt_payments")
    .select("transaction_id")
    .eq("id", id)
    .single();

  // Delete linked transaction
  if (payment?.transaction_id) {
    await supabase.from("transactions").delete().eq("id", payment.transaction_id);
  }

  // Delete payment
  await supabase.from("debt_payments").delete().eq("id", id);
}

// ============================================================
// BUDGETS
// ============================================================
export async function getBudgets(month: string): Promise<Budget[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("budgets")
    .select(`
      *,
      category:categories(name, icon)
    `)
    .eq("user_id", user.id)
    .eq("month", month);

  if (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }

  // Enrich with spending data
  const enriched = await Promise.all(
    (data || []).map(async (b: any) => {
      // Get category transactions for this month
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      if (!supabase) return { ...b, spent: 0, remaining: b.amount, percentage: 0, category_name: b.category?.name, category_icon: b.category?.icon };
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("category_id", b.category_id)
        .eq("type", "pengeluaran")
        .eq("status", "selesai")
        .gte("date", startDate)
        .lte("date", endDate);

      const spent = (txns || []).reduce((sum, t) => sum + t.amount, 0);
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        percentage,
        category_name: b.category?.name,
        category_icon: b.category?.icon,
      };
    })
  );

  return enriched;
}

export async function saveBudget(budget: Partial<Budget>): Promise<Budget | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("budgets")
    .upsert({ ...budget, user_id: user.id })
    .select()
    .single();

  if (error) console.error("Error saving budget:", error);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id);

  if (error) console.error("Error deleting budget:", error);
}

// ============================================================
// DASHBOARD
// ============================================================
export async function getDashboardData() {
  const accounts = await getActiveAccounts();
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

  const allTxns = await getTransactions();
  const txns = allTxns.filter((t) => t.status === "selesai");
  const monthTxns = txns.filter((t) => t.date >= startOfMonth && t.date <= endOfMonth);

  // Calculate balances
  let totalBalance = 0;
  for (const acc of accounts) {
    totalBalance += await getCurrentBalance(acc.id);
  }

  const monthlyIncome = monthTxns
    .filter((t) => t.type === "pemasukan")
    .reduce((s, t) => s + t.amount, 0);

  const monthlyExpense = monthTxns
    .filter((t) => t.type === "pengeluaran")
    .reduce((s, t) => s + t.amount, 0);

  const profitLoss = monthlyIncome - monthlyExpense;

  // Get debts
  const debts = await getDebts();
  const totalReceivable = debts
    .filter((d) => d.type === "piutang" && d.status !== "lunas")
    .reduce((s, d) => s + (d.remaining || 0), 0);
  const totalPayable = debts
    .filter((d) => d.type === "utang" && d.status !== "lunas")
    .reduce((s, d) => s + (d.remaining || 0), 0);

  // Monthly chart - last 12 months
  const monthlyChart: { month: string; pemasukan: number; pengeluaran: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const me = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-31`;
    const mtx = txns.filter((t) => t.date >= ms && t.date <= me);
    monthlyChart.push({
      month: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      pemasukan: mtx.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0),
      pengeluaran: mtx.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0),
    });
  }

  // Category breakdown
  const categories = await getCategories();
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
  const today = new Date().toISOString().split("T")[0];
  const dueAlerts = debts
    .filter((d) => d.status !== "lunas")
    .map((d) => {
      const daysUntil = Math.ceil(
        (new Date(d.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );
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

// ============================================================
// SEED DATA (for new users)
// ============================================================
export async function seedDemoDataForUser(): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if user already has accounts
  const { data: existingAccounts } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existingAccounts && existingAccounts.length > 0) return; // Already seeded

  // Seed accounts
  const accounts = [
    { user_id: user.id, name: "Kas Tunai", account_type: "kas", initial_balance: 2500000, color: "#059669", icon: "💵" },
    { user_id: user.id, name: "Bank BCA", account_type: "bank", initial_balance: 10000000, color: "#2563EB", icon: "🏦" },
    { user_id: user.id, name: "Bank Mandiri", account_type: "bank", initial_balance: 5000000, color: "#7C3AED", icon: "🏦" },
    { user_id: user.id, name: "E-Wallet", account_type: "ewallet", initial_balance: 750000, color: "#D97706", icon: "📱" },
  ];

  const { data: createdAccounts } = await supabase
    .from("financial_accounts")
    .insert(accounts)
    .select();

  if (!createdAccounts) return;

  // Seed categories
  const categories = [
    { user_id: user.id, name: "Penjualan", type: "pemasukan", icon: "💰", color: "#059669" },
    { user_id: user.id, name: "Pendapatan Jasa", type: "pemasukan", icon: "📈", color: "#2563EB" },
    { user_id: user.id, name: "Pendapatan Lain", type: "pemasukan", icon: "🎯", color: "#D97706" },
    { user_id: user.id, name: "Pembelian Bahan", type: "pengeluaran", icon: "🛒", color: "#DC2626" },
    { user_id: user.id, name: "Gaji", type: "pengeluaran", icon: "💼", color: "#7C3AED" },
    { user_id: user.id, name: "Transportasi", type: "pengeluaran", icon: "🚗", color: "#D97706" },
    { user_id: user.id, name: "Listrik", type: "pengeluaran", icon: "⚡", color: "#2563EB" },
    { user_id: user.id, name: "Kemasan", type: "pengeluaran", icon: "📦", color: "#0891B2" },
    { user_id: user.id, name: "Operasional", type: "pengeluaran", icon: "🏠", color: "#059669" },
    { user_id: user.id, name: "Pajak", type: "pengeluaran", icon: "📋", color: "#C026D3" },
    { user_id: user.id, name: "Pengeluaran Lain", type: "pengeluaran", icon: "💡", color: "#6B7280" },
  ];

  const { data: createdCategories } = await supabase
    .from("categories")
    .insert(categories)
    .select();

  if (!createdCategories) return;

  // Get IDs
  const kasId = createdAccounts.find((a) => a.name === "Kas Tunai")?.id;
  const bcaId = createdAccounts.find((a) => a.name === "Bank BCA")?.id;
  const mandiriId = createdAccounts.find((a) => a.name === "Bank Mandiri")?.id;
  const ewalletId = createdAccounts.find((a) => a.name === "E-Wallet")?.id;
  const penjualanId = createdCategories.find((c) => c.name === "Penjualan")?.id;
  const jasaId = createdCategories.find((c) => c.name === "Pendapatan Jasa")?.id;
  const bahanId = createdCategories.find((c) => c.name === "Pembelian Bahan")?.id;
  const gajiId = createdCategories.find((c) => c.name === "Gaji")?.id;
  const listrikId = createdCategories.find((c) => c.name === "Listrik")?.id;

  // Seed transactions
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const txns = [
    { user_id: user.id, transaction_number: "TRX-" + String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + "-0001", date: today, type: "pemasukan", account_id: bcaId, category_id: penjualanId, counterparty: "Toko JKL", amount: 15000000, description: "Penjualan bulan ini", status: "selesai" },
    { user_id: user.id, transaction_number: "TRX-" + String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + "-0002", date: today, type: "pemasukan", account_id: mandiriId, category_id: jasaId, counterparty: "Klien MNO", amount: 5000000, description: "Jasa desain", status: "selesai" },
    { user_id: user.id, transaction_number: "TRX-" + String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + "-0003", date: today, type: "pengeluaran", account_id: bcaId, category_id: bahanId, counterparty: "Supplier PQR", amount: 5500000, description: "Restock bahan", status: "selesai" },
    { user_id: user.id, transaction_number: "TRX-" + String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + "-0004", date: today, type: "pengeluaran", account_id: bcaId, category_id: gajiId, counterparty: "Karyawan", amount: 5000000, description: "Gaji bulan ini", status: "selesai" },
    { user_id: user.id, transaction_number: "TRX-" + String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + "-0005", date: lastWeek, type: "pengeluaran", account_id: ewalletId, category_id: listrikId, counterparty: "PLN", amount: 800000, description: "Listrik bulan ini", status: "selesai" },
  ];

  await supabase.from("transactions").insert(txns);

  // Seed profile
  await supabase
    .from("profiles")
    .upsert({ user_id: user.id, full_name: "Pengguna Uangku", currency: "IDR" });
}

import type { AccountType } from "@/types";

export const APP_NAME = "Uangku";

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "kas", label: "Kas Tunai" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "utang", label: "Utang" },
  { value: "piutang", label: "Piutang" },
];

export const TRANSACTION_TYPES = [
  { value: "pemasukan", label: "Pemasukan" },
  { value: "pengeluaran", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
] as const;

export const TRANSACTION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
] as const;

export const DEBT_STATUSES = [
  { value: "belum_bayar", label: "Belum Bayar", color: "text-red-500" },
  { value: "sebagian", label: "Sebagian", color: "text-yellow-500" },
  { value: "lunas", label: "Lunas", color: "text-green-500" },
  { value: "jatuh_tempo", label: "Jatuh Tempo", color: "text-orange-500" },
] as const;

export const ACCOUNT_COLORS = [
  "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED",
  "#0891B2", "#C026D3", "#EA580C", "#4F46E5", "#16A34A",
];

export const CATEGORY_ICONS = [
  "💰", "📈", "🛒", "💼", "🚗", "⚡", "📦", "🏠", "📋", "💡",
  "🏦", "💳", "📱", "🎁", "✈️", "🍽️", "🎓", "💊", "🎯", "📊",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Pembelian Bahan", icon: "🛒", color: "#DC2626" },
  { name: "Gaji", icon: "💼", color: "#7C3AED" },
  { name: "Transportasi", icon: "🚗", color: "#D97706" },
  { name: "Listrik", icon: "⚡", color: "#2563EB" },
  { name: "Kemasan", icon: "📦", color: "#0891B2" },
  { name: "Operasional", icon: "🏠", color: "#059669" },
  { name: "Pajak", icon: "📋", color: "#C026D3" },
  { name: "Pengeluaran Lain", icon: "💡", color: "#6B7280" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Penjualan", icon: "💰", color: "#059669" },
  { name: "Pendapatan Jasa", icon: "📈", color: "#2563EB" },
  { name: "Pendapatan Lain", icon: "🎯", color: "#D97706" },
];

export const DEFAULT_ACCOUNTS = [
  { name: "Kas Tunai", account_type: "kas" as AccountType, initial_balance: 2500000, color: "#059669", icon: "💵" },
  { name: "Bank BCA", account_type: "bank" as AccountType, initial_balance: 10000000, color: "#2563EB", icon: "🏦" },
  { name: "Bank Mandiri", account_type: "bank" as AccountType, initial_balance: 5000000, color: "#7C3AED", icon: "🏦" },
  { name: "E-Wallet", account_type: "ewallet" as AccountType, initial_balance: 750000, color: "#D97706", icon: "📱" },
];

export const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
  @page { margin: 1cm; }
}
`;

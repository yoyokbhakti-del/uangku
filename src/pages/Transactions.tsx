import { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  getTransactions, filterTransactions, saveTransaction, deleteTransaction,
  duplicateTransaction, getActiveAccounts, getActiveCategories, getNextTransactionNumber,
} from "@/services/store";
import type { Transaction, TransactionType, FilterParams } from "@/types";
import {
  Plus, Search, Copy, Trash2, Edit, ArrowDown, ArrowUp, ArrowLeftRight, Filter, X,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  pemasukan: "Pemasukan",
  pengeluaran: "Pengeluaran",
  transfer: "Transfer",
};

const TYPE_COLORS: Record<string, string> = {
  pemasukan: "bg-success/10 text-success",
  pengeluaran: "bg-destructive/10 text-destructive",
  transfer: "bg-blue-500/10 text-blue-500",
};

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const accounts = useMemo(() => getActiveAccounts(), []);
  const incomeCategories = useMemo(() => getActiveCategories("pemasukan"), []);
  const expenseCategories = useMemo(() => getActiveCategories("pengeluaran"), []);

  const filters: FilterParams = useMemo(() => ({
    search: searchQuery,
    type: typeFilter as TransactionType | "all",
  }), [searchQuery, typeFilter]);

  const transactions = useMemo(() => filterTransactions(filters), [filters, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleDelete = (txn: Transaction) => {
    deleteTransaction(txn.id);
    setDeleteTarget(null);
    refresh();
    toast.success("Transaksi berhasil dihapus");
  };

  const handleDuplicate = (txn: Transaction) => {
    duplicateTransaction(txn.id);
    refresh();
    toast.success("Transaksi berhasil diduplikasi");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transaksi"
        description="Kelola pemasukan, pengeluaran, dan transfer"
        action={
          <Button onClick={() => { setEditingTxn(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Transaksi Baru
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Mulai mencatat pemasukan, pengeluaran, atau transfer."
          action={
            <Button onClick={() => { setEditingTxn(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Transaksi
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => (
            <Card key={txn.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[txn.type]}`}>
                    {txn.type === "pemasukan" && <ArrowDown className="w-5 h-5" />}
                    {txn.type === "pengeluaran" && <ArrowUp className="w-5 h-5" />}
                    {txn.type === "transfer" && <ArrowLeftRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{txn.counterparty || txn.description || "Tanpa keterangan"}</p>
                      <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[txn.type]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {txn.transaction_number} • {formatDate(txn.date)}
                      {txn.type === "transfer" && txn.destination_account_id && ` • → ${accounts.find(a => a.id === txn.destination_account_id)?.name || ""}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${
                      txn.type === "pemasukan" ? "text-success" : txn.type === "pengeluaran" ? "text-destructive" : "text-foreground"
                    }`}>
                      {txn.type === "pemasukan" ? "+" : txn.type === "pengeluaran" ? "-" : ""}
                      {formatRupiah(txn.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(txn)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTxn(txn); setShowForm(true); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(txn)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transaction Form Dialog */}
      <TransactionFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTxn(null); }}
        editingTxn={editingTxn}
        accounts={accounts}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onSaved={() => { refresh(); setShowForm(false); setEditingTxn(null); }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi {deleteTarget?.transaction_number} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Transaction Form Dialog ────────────────────────────────────────
interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  editingTxn: Transaction | null;
  accounts: { id: string; name: string }[];
  incomeCategories: { id: string; name: string }[];
  expenseCategories: { id: string; name: string }[];
  onSaved: () => void;
}

function TransactionFormDialog({
  open, onClose, editingTxn, accounts, incomeCategories, expenseCategories, onSaved,
}: TransactionFormDialogProps) {
  const [type, setType] = useState<TransactionType>(editingTxn?.type || "pengeluaran");
  const [date, setDate] = useState(editingTxn?.date || new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(editingTxn?.account_id || "");
  const [destAccountId, setDestAccountId] = useState(editingTxn?.destination_account_id || "");
  const [categoryId, setCategoryId] = useState(editingTxn?.category_id || "");
  const [counterparty, setCounterparty] = useState(editingTxn?.counterparty || "");
  const [amount, setAmount] = useState(editingTxn?.amount?.toString() || "");
  const [description, setDescription] = useState(editingTxn?.description || "");
  const [status, setStatus] = useState(editingTxn?.status || "selesai");

  // Reset form when editingTxn changes
  if (editingTxn && !open) { /* handled by onClose */ }

  const categories = type === "pemasukan" ? incomeCategories : expenseCategories;
  const txnNumber = editingTxn?.transaction_number || getNextTransactionNumber();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Nominal harus lebih dari 0");
      return;
    }
    if (type === "transfer" && accountId === destAccountId) {
      toast.error("Akun sumber dan tujuan harus berbeda");
      return;
    }
    if (!accountId) {
      toast.error("Pilih akun sumber");
      return;
    }

    saveTransaction({
      id: editingTxn?.id,
      transaction_number: txnNumber,
      type,
      date,
      account_id: accountId,
      destination_account_id: type === "transfer" ? destAccountId : undefined,
      category_id: type === "transfer" ? undefined : categoryId || undefined,
      counterparty,
      amount: amountNum,
      description,
      status: status as Transaction["status"],
    });
    toast.success(editingTxn ? "Transaksi berhasil diperbarui" : "Transaksi berhasil disimpan");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTxn ? "Edit Transaksi" : "Transaksi Baru"}</DialogTitle>
          <DialogDescription>Nomor: {txnNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Tabs */}
          <Tabs value={type} onValueChange={(v) => { setType(v as TransactionType); setCategoryId(""); }}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="pemasukan">Pemasukan</TabsTrigger>
              <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Akun Sumber</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "transfer" && (
            <div className="space-y-2">
              <Label>Akun Tujuan</Label>
              <Select value={destAccountId} onValueChange={setDestAccountId}>
                <SelectTrigger><SelectValue placeholder="Pilih akun tujuan" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== accountId).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== "transfer" && (
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Pihak Terkait</Label>
              <Input
                placeholder="Nama pihak"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Textarea
              placeholder="Catatan tambahan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit">{editingTxn ? "Simpan Perubahan" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

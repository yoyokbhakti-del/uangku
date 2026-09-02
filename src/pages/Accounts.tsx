import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  getAccounts, saveAccount, deleteAccount, getCurrentBalance,
  getTransactions, getActiveAccounts,
} from "@/services/store";
import type { FinancialAccount, AccountType } from "@/types";
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from "@/lib/constants";
import { Plus, Wallet, Edit, Trash2, ArrowDown, ArrowUp, ArrowLeftRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialAccount | null>(null);
  const [detailAccount, setDetailAccount] = useState<FinancialAccount | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const accounts = useMemo(() => getAccounts(), [refreshKey]);
  const refresh = () => setRefreshKey((k) => k + 1);

  const handleDelete = (acc: FinancialAccount) => {
    deleteAccount(acc.id);
    setDeleteTarget(null);
    refresh();
    toast.success("Akun berhasil dihapus");
  };

  // Detail view
  if (detailAccount) {
    const acc = accounts.find((a) => a.id === detailAccount.id) || detailAccount;
    const balance = getCurrentBalance(acc.id);
    const txns = getTransactions().filter(
      (t) => t.status === "selesai" && (t.account_id === acc.id || t.destination_account_id === acc.id)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let runningBalance = acc.initial_balance;
    const mutations = txns.map((t) => {
      const isSource = t.account_id === acc.id;
      if (isSource) {
        if (t.type === "pemasukan") runningBalance += t.amount;
        else runningBalance -= t.amount;
      } else {
        runningBalance += t.amount; // transfer in
      }
      return { ...t, runningBalance, isIn: !isSource };
    }).reverse();

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setDetailAccount(null)}>← Kembali</Button>
          <div>
            <h1 className="text-2xl font-bold">{acc.icon} {acc.name}</h1>
            <p className="text-muted-foreground text-sm">Saldo Awal: {formatRupiah(acc.initial_balance)}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Saat Ini</p>
              <p className="text-3xl font-bold text-primary mt-1">{formatRupiah(balance)}</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold">Riwayat Mutasi</h2>
        {mutations.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Belum ada mutasi</p>
        ) : (
          <div className="space-y-2">
            {mutations.map((m, i) => (
              <Card key={m.id + "-" + i}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      m.isIn ? "bg-success/10 text-success" : m.type === "transfer" ? "bg-blue-500/10 text-blue-500" : "bg-destructive/10 text-destructive"
                    }`}>
                      {m.isIn ? <ArrowDown className="w-4 h-4" /> : m.type === "transfer" ? <ArrowLeftRight className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.counterparty || m.description || m.transaction_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.date)} • {m.transaction_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${m.isIn ? "text-success" : "text-destructive"}`}>
                      {m.isIn ? "+" : "-"}{formatRupiah(m.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo: {formatRupiah(m.runningBalance)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Akun Keuangan"
        description="Kelola kas, bank, dan e-wallet"
        action={
          <Button onClick={() => { setEditingAccount(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Akun Baru
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          title="Belum ada akun"
          description="Tambahkan akun kas, bank, atau e-wallet pertama Anda."
          action={
            <Button onClick={() => { setEditingAccount(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Akun
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const balance = getCurrentBalance(acc.id);
            return (
              <Card key={acc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailAccount(acc)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: acc.color + "20" }}>
                        {acc.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{acc.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{ACCOUNT_TYPES.find((t) => t.value === acc.account_type)?.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAccount(acc); setShowForm(true); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(acc)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-xl font-bold" style={{ color: balance >= 0 ? acc.color : "hsl(var(--destructive))" }}>
                      {formatRupiah(balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <AccountFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingAccount(null); }}
        editing={editingAccount}
        onSaved={() => { refresh(); setShowForm(false); setEditingAccount(null); }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun "{deleteTarget?.name}" akan dihapus. Transaksi terkait tidak akan terhapus.
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

// ── Account Form Dialog ────────────────────────────────────────────
function AccountFormDialog({
  open, onClose, editing, onSaved,
}: {
  open: boolean; onClose: () => void;
  editing: FinancialAccount | null; onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name || "");
  const [type, setType] = useState<AccountType>(editing?.account_type || "kas");
  const [balance, setBalance] = useState(editing?.initial_balance?.toString() || "0");
  const [color, setColor] = useState(editing?.color || ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState(editing?.icon || "💰");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nama akun wajib diisi"); return; }
    saveAccount({
      id: editing?.id,
      name: name.trim(),
      account_type: type,
      initial_balance: parseFloat(balance) || 0,
      color,
      icon,
    });
    toast.success(editing ? "Akun berhasil diperbarui" : "Akun berhasil ditambahkan");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Akun" : "Akun Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Akun</Label>
            <Input placeholder="Contoh: Kas Tunai" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Tipe Akun</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.filter((t) => !["utang", "piutang"].includes(t.value)).map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Saldo Awal (Rp)</Label>
            <Input inputMode="numeric" value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ikon</Label>
            <div className="flex gap-2 flex-wrap">
              {["💰", "🏦", "💳", "📱", "💵", "🪙"].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${icon === i ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit">{editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

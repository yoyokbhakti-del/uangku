import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRupiah, formatDate, getDaysUntilDue } from "@/lib/utils";
import {
  getDebts, saveDebt, updateDebt, deleteDebt,
  saveDebtPayment, getDebtPayments, deleteDebtPayment,
  getActiveAccounts,
} from "@/services/store";
import type { ReceivablePayable, DebtType, DebtPayment } from "@/types";
import {
  Plus, CreditCard, HandCoins, Trash2, Edit, DollarSign, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "warning" | "success"; icon: React.ReactNode }> = {
  belum_bayar: { label: "Belum Bayar", variant: "destructive", icon: <Clock className="w-3 h-3" /> },
  sebagian: { label: "Sebagian", variant: "warning", icon: <AlertTriangle className="w-3 h-3" /> },
  lunas: { label: "Lunas", variant: "success", icon: <CheckCircle2 className="w-3 h-3" /> },
  jatuh_tempo: { label: "Jatuh Tempo", variant: "destructive", icon: <AlertTriangle className="w-3 h-3" /> },
};

export default function DebtsReceivables() {
  const [tab, setTab] = useState<"utang" | "piutang">("utang");
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<ReceivablePayable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReceivablePayable | null>(null);
  const [detailDebt, setDetailDebt] = useState<ReceivablePayable | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const accounts = useMemo(() => getActiveAccounts(), []);
  const debts = useMemo(() => getDebts(tab), [tab, refreshKey]);
  const refresh = () => setRefreshKey((k) => k + 1);

  const handleDelete = (d: ReceivablePayable) => {
    deleteDebt(d.id);
    setDeleteTarget(null);
    refresh();
    if (detailDebt?.id === d.id) setDetailDebt(null);
    toast.success("Data berhasil dihapus");
  };

  // Detail view
  if (detailDebt) {
    const debt = debts.find((d) => d.id === detailDebt.id) || detailDebt;
    const payments = getDebtPayments(debt.id);
    const pct = debt.initial_amount > 0 ? ((debt.total_paid || 0) / debt.initial_amount) * 100 : 0;
    const daysUntil = getDaysUntilDue(debt.due_date);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setDetailDebt(null)}>← Kembali</Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{debt.counterparty}</h1>
              <Badge variant={STATUS_CONFIG[debt.status || "belum_bayar"].variant} className="gap-1">
                {STATUS_CONFIG[debt.status || "belum_bayar"].icon}
                {STATUS_CONFIG[debt.status || "belum_bayar"].label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{debt.reference_number}</p>
          </div>
          <div className="flex gap-2">
            {debt.status !== "lunas" && (
              <Button onClick={() => setShowPaymentForm(true)}>
                <DollarSign className="w-4 h-4 mr-1" /> Bayar
              </Button>
            )}
            <Button variant="outline" onClick={() => { setEditingDebt(debt); setShowForm(true); }}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Nilai Awal</p>
              <p className="text-lg font-bold">{formatRupiah(debt.initial_amount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Dibayar</p>
              <p className="text-lg font-bold text-success">{formatRupiah(debt.total_paid || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Sisa Tagihan</p>
              <p className="text-lg font-bold text-destructive">{formatRupiah(debt.remaining || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Jatuh Tempo</p>
              <p className="text-lg font-bold">{formatDate(debt.due_date)}</p>
              <p className={`text-xs ${daysUntil < 0 ? "text-destructive" : daysUntil <= 7 ? "text-warning" : "text-muted-foreground"}`}>
                {daysUntil < 0 ? `${Math.abs(daysUntil)} hari terlambat` : `${daysUntil} hari lagi`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progres Pembayaran</span>
              <span>{pct.toFixed(0)}%</span>
            </div>
            <Progress value={pct} className="h-3" />
          </CardContent>
        </Card>

        {debt.notes && (
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{debt.notes}</p></CardContent></Card>
        )}

        <h2 className="text-lg font-semibold">Riwayat Pembayaran</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada pembayaran</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const acc = accounts.find((a) => a.id === p.account_id);
              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{formatDate(p.payment_date)} — {acc?.name || "Akun"}</p>
                      <p className="text-xs text-muted-foreground">{p.notes || "Pembayaran"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-success">+{formatRupiah(p.amount)}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => {
                          if (confirm("Hapus pembayaran ini? Transaksi terkait juga akan dihapus.")) {
                            deleteDebtPayment(p.id);
                            refresh();
                            toast.success("Pembayaran dihapus");
                          }
                        }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Payment Form */}
        <DebtPaymentFormDialog
          open={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          debt={debt}
          accounts={accounts}
          onSaved={() => { refresh(); setShowPaymentForm(false); setDetailDebt(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Utang & Piutang"
        description="Kelola utang, piutang, dan pembayarannya"
        action={
          <Button onClick={() => { setEditingDebt(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Baru
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "utang" | "piutang")}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="utang" className="gap-1"><CreditCard className="w-4 h-4" /> Utang</TabsTrigger>
          <TabsTrigger value="piutang" className="gap-1"><HandCoins className="w-4 h-4" /> Piutang</TabsTrigger>
        </TabsList>
      </Tabs>

      {debts.length === 0 ? (
        <EmptyState
          title={`Belum ada ${tab}`}
          description={`Tambahkan data ${tab === "utang" ? "utang" : "piutang"} pertama.`}
        />
      ) : (
        <div className="space-y-3">
          {debts.map((d) => {
            const st = STATUS_CONFIG[d.status || "belum_bayar"];
            const pct = d.initial_amount > 0 ? ((d.total_paid || 0) / d.initial_amount) * 100 : 0;
            return (
              <Card key={d.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setDetailDebt(d)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{d.counterparty}</p>
                        <Badge variant={st.variant} className="text-[10px] gap-1">{st.icon} {st.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.reference_number} • Jatuh tempo: {formatDate(d.due_date)}
                      </p>
                      <div className="mt-2 max-w-xs">
                        <Progress value={pct} className="h-2" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Sisa</p>
                      <p className="font-bold text-destructive">{formatRupiah(d.remaining || 0)}</p>
                      <p className="text-xs text-muted-foreground">dari {formatRupiah(d.initial_amount)}</p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDebt(d); setShowForm(true); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(d)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialogs */}
      <DebtFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingDebt(null); }}
        editing={editingDebt}
        defaultType={tab}
        accounts={accounts}
        onSaved={() => { refresh(); setShowForm(false); setEditingDebt(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {tab === "utang" ? "Utang" : "Piutang"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Data "{deleteTarget?.counterparty}" dan semua pembayaran terkait akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Debt Form Dialog ───────────────────────────────────────────────
function DebtFormDialog({
  open, onClose, editing, defaultType, accounts, onSaved,
}: {
  open: boolean; onClose: () => void; editing: ReceivablePayable | null;
  defaultType: DebtType; accounts: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [type, setType] = useState<DebtType>(editing?.type || defaultType);
  const [counterparty, setCounterparty] = useState(editing?.counterparty || "");
  const [refNumber, setRefNumber] = useState(editing?.reference_number || "");
  const [date, setDate] = useState(editing?.date || new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(editing?.due_date || "");
  const [amount, setAmount] = useState(editing?.initial_amount?.toString() || "");
  const [accountId, setAccountId] = useState(editing?.account_id || "");
  const [notes, setNotes] = useState(editing?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!counterparty.trim()) { toast.error("Nama pihak wajib diisi"); return; }
    if (!amt || amt <= 0) { toast.error("Nilai harus lebih dari 0"); return; }
    if (!dueDate) { toast.error("Tanggal jatuh tempo wajib diisi"); return; }
    if (!accountId) { toast.error("Pilih akun"); return; }
    saveDebt({
      id: editing?.id, type, counterparty: counterparty.trim(),
      reference_number: refNumber, date, due_date: dueDate,
      initial_amount: amt, account_id: accountId, notes,
    });
    toast.success(editing ? "Data berhasil diperbarui" : "Data berhasil disimpan");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${type === "utang" ? "Utang" : "Piutang"}` : `${type === "utang" ? "Utang" : "Piutang"} Baru`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pihak</Label>
            <Input placeholder="Nama pihak" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>No. Referensi</Label>
              <Input placeholder="REF-001" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Akun Terkait</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nilai (Rp)</Label>
            <Input type="number" min="1" step="1000" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea rows={2} placeholder="Catatan tambahan..." value={notes} onChange={(e) => setNotes(e.target.value)} />
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

// ── Debt Payment Form Dialog ───────────────────────────────────────
function DebtPaymentFormDialog({
  open, onClose, debt, accounts, onSaved,
}: {
  open: boolean; onClose: () => void;
  debt: ReceivablePayable;
  accounts: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Nominal harus lebih dari 0"); return; }
    if (amt > (debt.remaining || 0)) { toast.error("Nominal melebihi sisa tagihan"); return; }
    if (!accountId) { toast.error("Pilih akun"); return; }
    saveDebtPayment({
      receivable_payable_id: debt.id,
      payment_date: payDate, amount: amt, account_id: accountId, notes,
    });
    toast.success("Pembayaran berhasil dicatat");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-muted text-sm">
            Sisa tagihan: <strong>{formatRupiah(debt.remaining || 0)}</strong>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Bayar</Label>
            <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Nominal (Rp)</Label>
            <Input type="number" min="1" step="1000" max={debt.remaining} placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Akun Bayar</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input placeholder="Catatan..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit">Bayar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

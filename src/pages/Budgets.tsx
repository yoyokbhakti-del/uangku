import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRupiah } from "@/lib/utils";
import {
  getBudgets, saveBudget, deleteBudget, getActiveCategories,
} from "@/services/store";
import type { Budget } from "@/types";
import { Plus, Trash2, Edit, PiggyBank } from "lucide-react";
import { toast } from "sonner";

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Budgets() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const expenseCategories = useMemo(() => getActiveCategories("pengeluaran"), []);
  const budgets = useMemo(() => getBudgets(month), [month, refreshKey]);
  const refresh = () => setRefreshKey((k) => k + 1);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  const monthLabel = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anggaran"
        description="Kelola anggaran bulanan per kategori"
        action={
          <div className="flex gap-2 items-center">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[180px]"
            />
            <Button onClick={() => { setEditingBudget(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Anggaran
            </Button>
          </div>
        }
      />

      {/* Summary */}
      {budgets.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Anggaran {monthLabel}</span>
              <span className="text-sm">
                {formatRupiah(totalSpent)} / {formatRupiah(totalBudget)}
              </span>
            </div>
            <Progress
              value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
              className="h-3"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% terpakai</span>
              <span>Sisa: {formatRupiah(Math.max(0, totalBudget - totalSpent))}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <EmptyState
          title="Belum ada anggaran"
          description={`Buat anggaran untuk bulan ${monthLabel}.`}
          icon={<PiggyBank className="w-8 h-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = b.percentage || 0;
            const isOver = pct > 100;
            const isNear = pct > 80 && pct <= 100;
            return (
              <Card key={b.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.category_icon || "📋"}</span>
                      <div>
                        <p className="font-medium text-sm">{b.category_name || "Kategori"}</p>
                        <p className="text-xs text-muted-foreground">Anggaran: {formatRupiah(b.amount)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditingBudget(b); setShowForm(true); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteTarget(b)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-2.5" />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Terpakai: {formatRupiah(b.spent || 0)}</span>
                    <Badge variant={isOver ? "destructive" : isNear ? "warning" : "secondary"} className="text-[10px]">
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  {isOver && (
                    <p className="text-xs text-destructive mt-1">
                      Melebihi anggaran {formatRupiah((b.spent || 0) - b.amount)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form */}
      <BudgetFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingBudget(null); }}
        editing={editingBudget}
        month={month}
        categories={expenseCategories}
        existingBudgets={budgets}
        onSaved={() => { refresh(); setShowForm(false); setEditingBudget(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggaran?</AlertDialogTitle>
            <AlertDialogDescription>Anggaran untuk "{deleteTarget?.category_name}" akan dihapus.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { deleteBudget(deleteTarget.id); setDeleteTarget(null); refresh(); toast.success("Anggaran dihapus"); } }}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BudgetFormDialog({
  open, onClose, editing, month, categories, existingBudgets, onSaved,
}: {
  open: boolean; onClose: () => void; editing: Budget | null;
  month: string; categories: { id: string; name: string }[];
  existingBudgets: Budget[]; onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState(editing?.category_id || "");
  const [amount, setAmount] = useState(editing?.amount?.toString() || "");

  const usedCategoryIds = existingBudgets.filter((b) => b.id !== editing?.id).map((b) => b.category_id);
  const availableCategories = categories.filter((c) => !usedCategoryIds.includes(c.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!categoryId) { toast.error("Pilih kategori"); return; }
    if (!amt || amt <= 0) { toast.error("Nominal harus lebih dari 0"); return; }
    saveBudget({ id: editing?.id, category_id: categoryId, month, amount: amt });
    toast.success(editing ? "Anggaran diperbarui" : "Anggaran ditambahkan");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Anggaran" : "Anggaran Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={!!editing}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {(editing ? categories : availableCategories).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Anggaran (Rp)</Label>
            <Input inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
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

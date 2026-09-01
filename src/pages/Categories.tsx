import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCategories, saveCategory, deleteCategory } from "@/services/store";
import type { Category } from "@/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Categories() {
  const [tab, setTab] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = useMemo(() => getCategories(), [refreshKey]);
  const filtered = categories.filter((c) => c.type === tab);
  const refresh = () => setRefreshKey((k) => k + 1);

  const handleToggleActive = (cat: Category) => {
    saveCategory({ id: cat.id, is_active: !cat.is_active });
    refresh();
    toast.success(cat.is_active ? "Kategori dinonaktifkan" : "Kategori diaktifkan");
  };

  const handleDelete = (cat: Category) => {
    deleteCategory(cat.id);
    setDeleteTarget(null);
    refresh();
    toast.success("Kategori berhasil dihapus");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kategori"
        description="Kelola kategori pemasukan dan pengeluaran"
        action={
          <Button onClick={() => { setEditingCat(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Kategori Baru
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pemasukan" | "pengeluaran")}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="pemasukan">Pemasukan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada kategori"
          description={`Tambahkan kategori ${tab === "pemasukan" ? "pemasukan" : "pengeluaran"} pertama.`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cat) => (
            <Card key={cat.id} className={`transition-all ${!cat.is_active ? "opacity-50" : "hover:shadow-sm"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: cat.color + "20" }}>
                      {cat.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px] mt-1">
                        {cat.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(cat)}>
                      {cat.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCat(cat); setShowForm(true); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <CategoryFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingCat(null); }}
        editing={editingCat}
        defaultType={tab}
        onSaved={() => { refresh(); setShowForm(false); setEditingCat(null); }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori "{deleteTarget?.name}" akan dihapus. Histori transaksi tetap terbaca.
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

function CategoryFormDialog({
  open, onClose, editing, defaultType, onSaved,
}: {
  open: boolean; onClose: () => void;
  editing: Category | null; defaultType: "pemasukan" | "pengeluaran";
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name || "");
  const [type, setType] = useState<"pemasukan" | "pengeluaran">(editing?.type || defaultType);
  const [icon, setIcon] = useState(editing?.icon || "📋");
  const [color, setColor] = useState(editing?.color || "#6B7280");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nama kategori wajib diisi"); return; }
    saveCategory({ id: editing?.id, name: name.trim(), type, icon, color });
    toast.success(editing ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Kategori" : "Kategori Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Kategori</Label>
            <Input placeholder="Contoh: Gaji" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select value={type} onValueChange={(v) => setType(v as "pemasukan" | "pengeluaran")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pemasukan">Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ikon</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_ICONS.map((i) => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={`w-9 h-9 rounded-lg border-2 text-lg flex items-center justify-center transition-all ${icon === i ? "border-primary bg-primary/10" : "border-border"}`}>
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

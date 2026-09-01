import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getProfile, saveProfile, seedDemoData, clearAllData } from "@/services/store";
import { useTheme } from "@/components/layout/ThemeProvider";
import { PWAInstallSection } from "@/components/shared/PWAInstallSection";
import { Sun, Moon, Trash2, RefreshCw, Save, Download, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    full_name: "",
    business_name: "",
    address: "",
    phone: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setProfile({
        full_name: p.full_name || "",
        business_name: p.business_name || "",
        address: p.address || "",
        phone: p.phone || "",
      });
    }
  }, [refreshKey]);

  const handleSaveProfile = () => {
    saveProfile(profile);
    // Also update session name
    try {
      const raw = localStorage.getItem("uangku_session");
      if (raw) {
        const s = JSON.parse(raw);
        s.name = profile.full_name;
        localStorage.setItem("uangku_session", JSON.stringify(s));
      }
    } catch { /* ignore */ }
    toast.success("Profil berhasil disimpan");
  };

  const handleResetDemo = () => {
    if (confirm("Semua data akan dihapus dan data demo baru akan dibuat. Lanjutkan?")) {
      clearAllData();
      seedDemoData();
      setRefreshKey((k) => k + 1);
      toast.success("Data demo berhasil direset");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Kelola profil dan preferensi aplikasi" />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informasi dasar pengguna atau bisnis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Pengguna</Label>
              <Input id="name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Nama Anda" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business">Nama Usaha</Label>
              <Input id="business" value={profile.business_name} onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} placeholder="Nama usaha (opsional)" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Alamat lengkap" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="08xxx" />
          </div>
          <Button onClick={handleSaveProfile}>
            <Save className="w-4 h-4 mr-1" /> Simpan Profil
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>Pilih tampilan terang atau gelap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                theme === "light" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Terang</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                theme === "dark" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Gelap</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Data</CardTitle>
          <CardDescription>Reset data demo atau kelola data lokal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleResetDemo}>
              <RefreshCw className="w-4 h-4 mr-1" /> Reset Data Demo
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("SEMUA data akan dihapus permanen! Lanjutkan?")) {
                  clearAllData();
                  toast.success("Semua data telah dihapus");
                  window.location.reload();
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Hapus Semua Data
            </Button>
          </div>
          <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            <p><strong>Mata Uang:</strong> IDR (Rupiah Indonesia)</p>
            <p><strong>Format Tanggal:</strong> dd/MM/yyyy</p>
            <p className="mt-2">Data disimpan secara lokal di browser Anda.</p>
          </div>
        </CardContent>
      </Card>

      {/* PWA Install */}
      <PWAInstallSection />

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>Tentang Uangku</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Uangku v1.0.0 — Aplikasi pencatatan keuangan pribadi dan usaha.
            Dibuat dengan ❤️ untuk membantu Anda mengelola keuangan dengan lebih baik.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

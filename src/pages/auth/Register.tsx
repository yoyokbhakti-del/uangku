import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedDemoDataForUser } from "@/services/supabaseService";
import { toast } from "sonner";

interface RegisterPageProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        // Use Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Seed demo data
          await seedDemoDataForUser();
          setSuccess(true);
          toast.success("Akun berhasil dibuat!");
        }
      } else {
        // Use localStorage fallback
        localStorage.setItem("uangku_session", JSON.stringify({ email, name }));
        toast.success("Akun berhasil dibuat!");
        onRegister();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl mb-2">🎉</div>
            <CardTitle className="text-2xl font-bold">Pendaftaran Berhasil!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Akun Anda telah berhasil dibuat.
                {isSupabaseConfigured && (
                  <>
                    <br />
                    <strong>Silakan cek email Anda untuk verifikasi.</strong>
                  </>
                )}
              </p>
              <Button onClick={onSwitchToLogin} className="w-full">
                Masuk Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="text-4xl mb-2">💰</div>
          <CardTitle className="text-2xl font-bold">Daftar Uangku</CardTitle>
          <CardDescription>Buat akun baru untuk mulai mencatat keuangan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline font-medium">
                Masuk
              </button>
            </div>
          </form>

          {!isSupabaseConfigured && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground text-center">
              ℹ️ Mode demo: Data tersimpan di browser. Daftar dengan email dan password apa saja.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

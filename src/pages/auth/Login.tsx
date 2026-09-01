import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedDemoDataForUser } from "@/services/supabaseService";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        // Use Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Seed demo data for new user
          await seedDemoDataForUser();
          toast.success("Selamat datang kembali!");
          onLogin();
        }
      } else {
        // Use localStorage fallback
        localStorage.setItem("uangku_session", JSON.stringify({ email, name: email.split("@")[0] }));
        onLogin();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      setResetSent(true);
      toast.success("Email reset password telah dikirim!");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim email reset");
    }
  };

  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl mb-2">🔐</div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Masukkan email untuk reset password</CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Email reset password telah dikirim ke <strong>{resetEmail}</strong>.
                  <br />Silakan cek inbox atau spam Anda.
                </p>
                <Button variant="outline" onClick={() => { setResetMode(false); setResetSent(false); }}>
                  Kembali ke Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Mengirim..." : "Kirim Email Reset"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setResetMode(false)} className="text-sm text-primary hover:underline">
                    Kembali ke Login
                  </button>
                </div>
              </form>
            )}
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
          <CardTitle className="text-2xl font-bold">Uangku</CardTitle>
          <CardDescription>Masuk untuk mengelola keuangan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setResetMode(true); setResetEmail(email); }}
                className="text-sm text-primary hover:underline"
              >
                Lupa password?
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Masuk..." : "Masuk"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <button type="button" onClick={onSwitchToRegister} className="text-primary hover:underline font-medium">
                Daftar
              </button>
            </div>
          </form>

          {!isSupabaseConfigured && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground text-center">
              ℹ️ Mode demo: Data tersimpan di browser. Login dengan email dan password apa saja.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Monitor, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(ua.includes("iphone") || ua.includes("ipad"));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Already installed
  if (isInstalled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Aplikasi Terpasang
          </CardTitle>
          <CardDescription>Uangku sudah terpasang di perangkat ini</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aplikasi dapat digunakan secara offline. Semua data tersimpan di perangkat Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Pasang Aplikasi
        </CardTitle>
        <CardDescription>Instal Uangku di perangkat Anda untuk akses cepat dan offline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Android / Chrome */}
        {!isIOS && deferredPrompt && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Android / Chrome</p>
              <p className="text-xs text-muted-foreground">Klik tombol di bawah untuk menginstal</p>
            </div>
            <Button size="sm" onClick={handleInstall}>
              <Download className="w-4 h-4 mr-1" /> Install
            </Button>
          </div>
        )}

        {/* iOS Safari */}
        {isIOS && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">iPhone / iPad</p>
              <ol className="text-xs text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                <li>Buka Uangku di Safari</li>
                <li>Tap tombol <strong>Bagikan</strong> (↗) di bawah</li>
                <li>Pilih <strong>Tambah ke Layar Depan</strong></li>
                <li>Tap <strong>Tambah</strong></li>
              </ol>
            </div>
          </div>
        )}

        {/* Desktop */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <Monitor className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Desktop</p>
            <p className="text-xs text-muted-foreground">
              Klik ikon <strong>Install</strong> di address bar browser, atau gunakan menu browser → "Install Uangku"
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
          <p className="font-medium text-primary">💡 Keuntungan PWA:</p>
          <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
            <li>Bisa digunakan tanpa koneksi internet</li>
            <li>Muncul di layar seperti aplikasi native</li>
            <li>Icon di home screen untuk akses cepat</li>
            <li>Tidak perlu download dari Play Store / App Store</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

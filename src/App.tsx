import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/Login";
import { RegisterPage } from "@/pages/auth/Register";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedDemoData } from "@/services/store";
import { seedDemoDataForUser } from "@/services/supabaseService";
import { Toaster, toast } from "sonner";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { usePWAUpdate } from "@/hook/usePWAUpdate";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Categories = lazy(() => import("@/pages/Categories"));
const DebtsReceivables = lazy(() => import("@/pages/DebtsReceivables"));
const Budgets = lazy(() => import("@/pages/Budgets"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(true);
  usePWAUpdate();

  useEffect(() => {
    // Check Supabase session
    if (isSupabaseConfigured && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setIsAuthenticated(!!session);

          // Seed demo data on first login
          if (session) {
            await seedDemoDataForUser();
          }
        }
      );

      return () => subscription.unsubscribe();
    } else {
      // Demo mode: auto-login, no auth needed
      setIsAuthenticated(true);
      setIsLoading(false);
      seedDemoData();
    }
  }, []);

  const handleAuth = () => {
    if (isSupabaseConfigured && supabase) {
      setIsAuthenticated(true);
    }
    // In demo mode, already authenticated via useEffect
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("uangku_session");
    }
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat Uangku...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        {authMode === "login" ? (
          <LoginPage onLogin={handleAuth} onSwitchToRegister={() => setAuthMode("register")} />
        ) : (
          <RegisterPage onRegister={handleAuth} onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout onLogout={handleLogout}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transaksi" element={<Transactions />} />
              <Route path="/akun" element={<Accounts />} />
              <Route path="/kategori" element={<Categories />} />
              <Route path="/utang-piutang" element={<DebtsReceivables />} />
              <Route path="/anggaran" element={<Budgets />} />
              <Route path="/laporan" element={<Reports />} />
              <Route path="/pengaturan" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <PWAInstallBanner />
      <OfflineIndicator />
    </ThemeProvider>
  );
}

export default App;

import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  PiggyBank,
  BarChart3,
  Tags,
  Settings,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transaksi", icon: ArrowLeftRight, label: "Transaksi" },
  { to: "/akun", icon: Wallet, label: "Akun" },
  { to: "/utang-piutang", icon: CreditCard, label: "Utang & Piutang" },
  { to: "/anggaran", icon: PiggyBank, label: "Anggaran" },
  { to: "/laporan", icon: BarChart3, label: "Laporan" },
  { to: "/kategori", icon: Tags, label: "Kategori" },
];

export function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg">
          💰
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Uangku</h1>
          <p className="text-xs text-sidebar-foreground/60">Keuangan Pribadi</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}

        <NavLink
          to="/pengaturan"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            location.pathname === "/pengaturan"
              ? "bg-white/15 text-white"
              : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings className="w-5 h-5" />
          Pengaturan
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-2 border-t border-sidebar-border">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-white/10 hover:text-white w-full transition-all"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        </button>
        <button
          onClick={() => {
            if (confirm("Yakin ingin keluar?")) {
              if (onLogout) onLogout();
              else {
                localStorage.removeItem("uangku_session");
                window.location.reload();
              }
            }
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-white/10 hover:text-white w-full transition-all"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}

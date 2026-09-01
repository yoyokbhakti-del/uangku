import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/shared/KPICard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDate, getGreeting } from "@/lib/utils";
import { getDashboardData } from "@/services/store";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  HandCoins,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const data = useMemo(() => getDashboardData(), []);

  const getProfileName = () => {
    try {
      const raw = localStorage.getItem("uangku_session");
      if (raw) {
        const s = JSON.parse(raw);
        return s.name || "Pengguna";
      }
    } catch { /* ignore */ }
    return "Pengguna";
  };

  if (data.recentTransactions.length === 0 && data.totalBalance === 0) {
    return (
      <div>
        <PageHeader title={`${getGreeting()}, ${getProfileName()}!`} />
        <EmptyState
          title="Selamat Datang di Uangku"
          description="Mulai mencatat keuangan Anda dengan menambahkan akun dan transaksi pertama."
          action={
            <Link to="/transaksi">
              <Button>Mulai Catat</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}, ${getProfileName()}!`}
        description="Ringkasan keuangan Anda hari ini"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <KPICard
          title="Total Saldo"
          value={formatRupiah(data.totalBalance)}
          icon={<DollarSign className="w-5 h-5" />}
          color="text-primary"
        />
        <KPICard
          title="Pemasukan"
          value={formatRupiah(data.monthlyIncome)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-success"
          subtitle="Bulan berjalan"
        />
        <KPICard
          title="Pengeluaran"
          value={formatRupiah(data.monthlyExpense)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="text-destructive"
          subtitle="Bulan berjalan"
        />
        <KPICard
          title="Laba/Rugi"
          value={formatRupiah(data.profitLoss)}
          icon={data.profitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          color={data.profitLoss >= 0 ? "text-success" : "text-destructive"}
          subtitle="Bulan berjalan"
        />
        <KPICard
          title="Piutang"
          value={formatRupiah(data.totalReceivable)}
          icon={<HandCoins className="w-5 h-5" />}
          color="text-blue-500"
          subtitle="Belum lunas"
        />
        <KPICard
          title="Utang"
          value={formatRupiah(data.totalPayable)}
          icon={<CreditCard className="w-5 h-5" />}
          color="text-orange-500"
          subtitle="Belum lunas"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pemasukan vs Pengeluaran (12 Bulan)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyChart} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    formatter={(value) => formatRupiah(Number(value))}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                  />
                  <Legend />
                  <Bar dataKey="pemasukan" name="Pemasukan" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="40%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <Link to="/transaksi" className="text-sm text-primary hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                {data.recentTransactions.slice(0, 8).map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                          txn.type === "pemasukan"
                            ? "bg-success/10 text-success"
                            : txn.type === "pengeluaran"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {txn.type === "pemasukan" ? "↗" : txn.type === "pengeluaran" ? "↙" : "↔"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{txn.counterparty || txn.description || txn.transaction_number}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ${
                        txn.type === "pemasukan" ? "text-success" : txn.type === "pengeluaran" ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {txn.type === "pemasukan" ? "+" : txn.type === "pengeluaran" ? "-" : ""}
                      {formatRupiah(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Due Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Pengingat Jatuh Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dueAlerts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Tidak ada utang/piutang yang mendekati jatuh tempo 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {data.dueAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.type === "piutang" ? "default" : "secondary"} className="text-[10px]">
                          {alert.type === "piutang" ? "Piutang" : "Utang"}
                        </Badge>
                        {alert.daysUntilDue < 0 && (
                          <Badge variant="destructive" className="text-[10px]">Terlambat</Badge>
                        )}
                        {alert.daysUntilDue >= 0 && alert.daysUntilDue <= 7 && (
                          <Badge variant="warning" className="text-[10px]">Mendekati</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">{alert.counterparty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatRupiah(alert.remaining)}</p>
                      <p className={`text-xs ${alert.daysUntilDue < 0 ? "text-destructive" : alert.daysUntilDue <= 7 ? "text-warning" : "text-muted-foreground"}`}>
                        {alert.daysUntilDue < 0
                          ? `${Math.abs(alert.daysUntilDue)} hari terlambat`
                          : `${alert.daysUntilDue} hari lagi`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


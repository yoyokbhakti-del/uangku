import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatRupiah, formatDate, downloadCSV } from "@/lib/utils";
import {
  getTransactions, filterTransactions, getAccounts, getCurrentBalance,
  getDebts, getActiveAccounts, getCategories,
} from "@/services/store";
import type { Transaction, FilterParams } from "@/types";
import { Printer, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

type ReportType = "buku-kas" | "arus-kas" | "laba-rugi" | "kategori-masuk" | "kategori-keluar" | "mutasi-akun" | "utang" | "piutang";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("buku-kas");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterPreset, setFilterPreset] = useState("bulanan");
  const [selectedAccount, setSelectedAccount] = useState("all");

  const accounts = useMemo(() => getActiveAccounts(), []);

  // Apply filter preset
  const applyPreset = (preset: string) => {
    setFilterPreset(preset);
    const now = new Date();
    let start: Date;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    switch (preset) {
      case "harian":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "mingguan":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "bulanan":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "tahunan":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(0);
    }
    const toLocalISO = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    setStartDate(toLocalISO(start));
    setEndDate(toLocalISO(end));
  };

  // Set default on first render
  useMemo(() => { applyPreset("bulanan"); }, []);

  const filters: FilterParams = useMemo(() => ({
    start_date: startDate,
    end_date: endDate,
    account_id: selectedAccount !== "all" ? selectedAccount : undefined,
    type: "all",
  }), [startDate, endDate, selectedAccount]);

  const txns = useMemo(() => filterTransactions(filters), [filters]);
  const allTxns = useMemo(() => getTransactions().filter((t) => t.status === "selesai"), []);

  const handlePrint = () => window.print();
  const handleCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    downloadCSV(filename, headers, rows);
    toast.success("CSV berhasil diunduh");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan"
        description="Analisis keuangan dan ekspor data"
        action={
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Cetak
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="no-print">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex gap-2 flex-wrap flex-1">
              <div className="space-y-1">
                <Label className="text-xs">Periode</Label>
                <Select value={filterPreset} onValueChange={applyPreset}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harian">Harian</SelectItem>
                    <SelectItem value="mingguan">Mingguan</SelectItem>
                    <SelectItem value="bulanan">Bulanan</SelectItem>
                    <SelectItem value="tahunan">Tahunan</SelectItem>
                    <SelectItem value="custom">Kustom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dari</Label>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setFilterPreset("custom"); }} className="w-[155px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sampai</Label>
                <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setFilterPreset("custom"); }} className="w-[155px]" />
              </div>
              {(reportType === "mutasi-akun" || reportType === "arus-kas") && (
                <div className="space-y-1">
                  <Label className="text-xs">Akun</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Akun</SelectItem>
                      {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Type Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
        <TabsList className="w-full overflow-x-auto flex whitespace-nowrap h-auto py-1 no-print">
          <TabsTrigger value="buku-kas">Buku Kas</TabsTrigger>
          <TabsTrigger value="arus-kas">Arus Kas</TabsTrigger>
          <TabsTrigger value="laba-rugi">Laba Rugi</TabsTrigger>
          <TabsTrigger value="kategori-masuk">Rekap Masuk</TabsTrigger>
          <TabsTrigger value="kategori-keluar">Rekap Keluar</TabsTrigger>
          <TabsTrigger value="mutasi-akun">Mutasi Akun</TabsTrigger>
          <TabsTrigger value="utang">Utang</TabsTrigger>
          <TabsTrigger value="piutang">Piutang</TabsTrigger>
        </TabsList>

        <div className="print-area">
          {/* Buku Kas */}
          <TabsContent value="buku-kas">
            <ReportCard title="Buku Kas" txns={txns} onExport={() => {
              handleCSV("buku-kas.csv", ["Tanggal", "No.", "Jenis", "Keterangan", "Debet", "Kredit"],
                txns.map((t) => [t.date, t.transaction_number, t.type, t.counterparty || t.description,
                  t.type === "pemasukan" ? t.amount : "", t.type === "pengeluaran" ? t.amount : ""]));
            }} />
          </TabsContent>

          {/* Arus Kas */}
          <TabsContent value="arus-kas">
            <ArusKasReport txns={txns} accounts={accounts} startDate={startDate} endDate={endDate} onExport={handleCSV} />
          </TabsContent>

          {/* Laba Rugi */}
          <TabsContent value="laba-rugi">
            <LabaRugiReport txns={txns} onExport={handleCSV} />
          </TabsContent>

          {/* Rekap Kategori Masuk */}
          <TabsContent value="kategori-masuk">
            <KategoriReport txns={txns.filter((t) => t.type === "pemasukan")} title="Rekap Pemasukan per Kategori" type="pemasukan" onExport={handleCSV} />
          </TabsContent>

          {/* Rekap Kategori Keluar */}
          <TabsContent value="kategori-keluar">
            <KategoriReport txns={txns.filter((t) => t.type === "pengeluaran")} title="Rekap Pengeluaran per Kategori" type="pengeluaran" onExport={handleCSV} />
          </TabsContent>

          {/* Mutasi Akun */}
          <TabsContent value="mutasi-akun">
            <MutasiAkunReport txns={txns} accounts={accounts} selectedAccount={selectedAccount} onExport={handleCSV} />
          </TabsContent>

          {/* Utang */}
          <TabsContent value="utang">
            <DebtReport type="utang" />
          </TabsContent>

          {/* Piutang */}
          <TabsContent value="piutang">
            <DebtReport type="piutang" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Report Components ──────────────────────────────────────────────

function ReportCard({ title, txns, onExport }: { title: string; txns: Transaction[]; onExport: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport} className="no-print">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {txns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Tanggal</th>
                  <th className="pb-2 pr-4">Nomor</th>
                  <th className="pb-2 pr-4">Jenis</th>
                  <th className="pb-2 pr-4">Keterangan</th>
                  <th className="pb-2 text-right">Debet</th>
                  <th className="pb-2 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{formatDate(t.date)}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{t.transaction_number}</td>
                    <td className="py-2 pr-4 capitalize">{t.type}</td>
                    <td className="py-2 pr-4">{t.counterparty || t.description}</td>
                    <td className="py-2 text-right text-success">{t.type === "pemasukan" ? formatRupiah(t.amount) : ""}</td>
                    <td className="py-2 text-right text-destructive">{t.type === "pengeluaran" ? formatRupiah(t.amount) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArusKasReport({ txns, accounts, startDate, endDate, onExport }: {
  txns: Transaction[]; accounts: { id: string; name: string }[];
  startDate: string; endDate: string;
  onExport: (f: string, h: string[], r: (string | number)[][]) => void;
}) {
  // Simplified cash flow
  const masuk = txns.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0);
  const keluar = txns.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0);
  const transferIn = txns.filter((t) => t.type === "transfer").reduce((s, t) => {
    const isTarget = accounts.some((a) => a.id === t.destination_account_id);
    return s + (isTarget ? t.amount : 0);
  }, 0);
  const transferOut = txns.filter((t) => t.type === "transfer").reduce((s, t) => {
    const isSource = accounts.some((a) => a.id === t.account_id);
    return s + (isSource ? t.amount : 0);
  }, 0);
  const netCashFlow = masuk - keluar;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Arus Kas</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onExport("arus-kas.csv", ["Keterangan", "Nominal"], [["Pemasukan", masuk], ["Pengeluaran", keluar], ["Transfer Masuk", transferIn], ["Transfer Keluar", transferOut], ["Arus Kas Bersih", netCashFlow]])} className="no-print">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <p className="text-sm text-muted-foreground">Kas Masuk</p>
            <p className="text-xl font-bold text-success">{formatRupiah(masuk)}</p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm text-muted-foreground">Kas Keluar</p>
            <p className="text-xl font-bold text-destructive">{formatRupiah(keluar)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Arus Kas Bersih</p>
            <p className={`text-xl font-bold ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
              {formatRupiah(netCashFlow)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LabaRugiReport({ txns, onExport }: {
  txns: Transaction[]; onExport: (f: string, h: string[], r: (string | number)[][]) => void;
}) {
  const income = txns.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Laba Rugi Sederhana</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onExport("laba-rugi.csv", ["Keterangan", "Nominal"], [["Pendapatan", income], ["Beban", profit > 0 ? expense : expense], ["Laba/Rugi", profit]])} className="no-print">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-3">
          <div className="flex justify-between p-3 rounded-lg bg-success/5">
            <span className="font-medium">Pendapatan</span>
            <span className="font-bold text-success">{formatRupiah(income)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-destructive/5">
            <span className="font-medium">Beban</span>
            <span className="font-bold text-destructive">{formatRupiah(expense)}</span>
          </div>
          <Separator />
          <div className={`flex justify-between p-3 rounded-lg ${profit >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
            <span className="font-bold">Laba / Rugi</span>
            <span className={`text-xl font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>{formatRupiah(profit)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KategoriReport({ txns, title, type, onExport }: {
  txns: Transaction[]; title: string; type: string;
  onExport: (f: string, h: string[], r: (string | number)[][]) => void;
}) {
  const catMap = new Map<string, { name: string; total: number; count: number }>();
  const cats = getCategories();

  txns.forEach((t) => {
    const cat = cats.find((c: any) => c.id === t.category_id);
    const name = cat?.name || "Tanpa Kategori";
    const existing = catMap.get(t.category_id || "none") || { name, total: 0, count: 0 };
    existing.total += t.amount;
    existing.count += 1;
    catMap.set(t.category_id || "none", existing);
  });

  const data = Array.from(catMap.values()).sort((a, b) => b.total - a.total);
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onExport(`${title}.csv`, ["Kategori", "Jumlah Transaksi", "Total", "Persentase"], data.map((d) => [d.name, d.count, d.total, `${((d.total / total) * 100).toFixed(1)}%`]))} className="no-print">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
        ) : (
          <div className="space-y-3 max-w-lg">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{d.name}</span>
                    <span className="font-medium shrink-0 ml-2">{formatRupiah(d.total)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${type === "pemasukan" ? "bg-success" : "bg-destructive"}`}
                      style={{ width: `${(d.total / total) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                  {((d.total / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MutasiAkunReport({ txns, accounts, selectedAccount, onExport }: {
  txns: Transaction[]; accounts: { id: string; name: string }[];
  selectedAccount: string;
  onExport: (f: string, h: string[], r: (string | number)[][]) => void;
}) {
  const filteredTxns = selectedAccount !== "all"
    ? txns.filter((t) => t.account_id === selectedAccount || t.destination_account_id === selectedAccount)
    : txns;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Mutasi Akun {selectedAccount !== "all" ? `- ${accounts.find((a) => a.id === selectedAccount)?.name}` : ""}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onExport("mutasi-akun.csv", ["Tanggal", "No.", "Jenis", "Akun", "Keterangan", "Nominal"], filteredTxns.map((t) => [t.date, t.transaction_number, t.type, accounts.find((a) => a.id === t.account_id)?.name || "", t.counterparty || t.description, t.amount]))} className="no-print">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        <ReportCard title="" txns={filteredTxns} onExport={() => {}} />
      </CardContent>
    </Card>
  );
}

function DebtReport({ type }: { type: "utang" | "piutang" }) {
  const debts = getDebts(type);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Laporan {type === "utang" ? "Utang" : "Piutang"}</CardTitle>
      </CardHeader>
      <CardContent>
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Pihak</th>
                  <th className="pb-2 pr-4">Referensi</th>
                  <th className="pb-2 pr-4">Jatuh Tempo</th>
                  <th className="pb-2 pr-4 text-right">Nilai</th>
                  <th className="pb-2 pr-4 text-right">Dibayar</th>
                  <th className="pb-2 text-right">Sisa</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{d.counterparty}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{d.reference_number}</td>
                    <td className="py-2 pr-4">{formatDate(d.due_date)}</td>
                    <td className="py-2 pr-4 text-right">{formatRupiah(d.initial_amount)}</td>
                    <td className="py-2 pr-4 text-right text-success">{formatRupiah(d.total_paid || 0)}</td>
                    <td className="py-2 pr-4 text-right text-destructive">{formatRupiah(d.remaining || 0)}</td>
                    <td className="py-2 capitalize">{d.status?.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

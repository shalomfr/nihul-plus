"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  ArrowRight, Download, TrendingUp, TrendingDown, RefreshCw,
  FileSpreadsheet, BarChart3, PiggyBank, AlertCircle, CheckCircle,
  Calendar,
} from "lucide-react";
import { type ComplianceItem } from "@/lib/smart-actions";
import HandleNowButton from "@/components/HandleNowButton";
import SmartActionsModal from "@/components/SmartActionsModal";

type Summary = {
  period: { from: string; to: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    pendingExpenses: number;
    surplus: number;
    donationCount: number;
    expenseCount: number;
  };
  bankAccounts: { bankName: string; accountNumber: string; balance: number; isPrimary: boolean }[];
  expensesByCategory: Record<string, number>;
  monthlyIncome: Record<string, number>;
  compliance: { itemName: string; dueDate: string | null; status: string }[];
  missingReceipts: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  SALARIES: "משכורות", RENT: "שכירות", ACTIVITIES: "פעילויות",
  MARKETING: "שיווק", ADMINISTRATION: "הנהלה וכלליות",
  TRANSPORTATION: "תחבורה", SUPPLIES: "ציוד",
  PROFESSIONAL_SERVICES: "שירותים מקצועיים", INSURANCE: "ביטוח",
  MAINTENANCE: "תחזוקה", OTHER: "אחר",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(n);

type PeriodPreset = "month" | "quarter" | "year";

function getPeriodDates(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: Date;
  if (preset === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return { from: from.toISOString().split("T")[0], to };
}

export default function AccountantPage() {
  const [period, setPeriod] = useState<PeriodPreset>("year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [actionItem, setActionItem] = useState<ComplianceItem | null>(null);

  const { from, to } = customFrom && customTo
    ? { from: customFrom, to: customTo }
    : getPeriodDates(period);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/accountant/summary?from=${from}&to=${to}`).then(r => r.json()),
      fetch("/api/compliance").then(r => r.json()),
    ])
      .then(([summaryRes, complianceRes]) => {
        if (summaryRes.success) setSummary(summaryRes.data);
        if (complianceRes.success) setComplianceItems(complianceRes.data.items ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [from, to]);

  const handleExport = async (type: "expenses" | "transactions" | "all") => {
    setExporting(true);
    try {
      const url = `/api/accountant/export?from=${from}&to=${to}&type=${type}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `maatefet-${type}-${from}-${to}.csv`;
      a.click();
    } catch {
      console.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleOpenReport = () => {
    const year = new Date(from).getFullYear();
    window.open(`/api/reports/annual?year=${year}`, "_blank");
  };

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8" dir="rtl">
      <Topbar title="ניהול חשבונות" subtitle="דוחות כספיים, ייצוא לרואה חשבון, ספר חשבונות" />

      <Link href="/portal" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
        <ArrowRight size={14} /> חזרה לדשבורד
      </Link>

      {/* Period selector */}
      <div className="bg-white rounded-2xl border border-[#e8ecf4] p-4 mb-6 flex flex-wrap items-center gap-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <span className="text-sm font-medium text-[#64748b]">תקופה:</span>
        {(["month", "quarter", "year"] as PeriodPreset[]).map(p => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setCustomFrom(""); setCustomTo(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              period === p && !customFrom
                ? "bg-[#eff6ff] border-[#2563eb] text-[#2563eb]"
                : "border-[#e8ecf4] text-[#64748b] hover:text-[#1e293b]"
            }`}
          >
            {p === "month" ? "חודש נוכחי" : p === "quarter" ? "רבעון" : "שנה נוכחית"}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#64748b]" />
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="text-sm border border-[#e8ecf4] rounded-lg px-2 py-1.5" />
          <span className="text-[#64748b] text-sm">—</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="text-sm border border-[#e8ecf4] rounded-lg px-2 py-1.5" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw size={24} className="animate-spin text-[#2563eb]" />
        </div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#16a34a]" />
                </div>
                <span className="text-xs text-[#64748b]">סך הכנסות</span>
              </div>
              <div className="text-xl font-bold text-[#16a34a]">{fmt(summary.summary.totalIncome)}</div>
              <div className="text-xs text-[#94a3b8] mt-1">{summary.summary.donationCount} תרומות</div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#fef2f2] flex items-center justify-center">
                  <TrendingDown size={16} className="text-[#ef4444]" />
                </div>
                <span className="text-xs text-[#64748b]">סך הוצאות</span>
              </div>
              <div className="text-xl font-bold text-[#ef4444]">{fmt(summary.summary.totalExpenses)}</div>
              <div className="text-xs text-[#94a3b8] mt-1">{summary.summary.expenseCount} הוצאות</div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.summary.surplus >= 0 ? "bg-[#f0fdf4]" : "bg-[#fef2f2]"}`}>
                  <PiggyBank size={16} className={summary.summary.surplus >= 0 ? "text-[#16a34a]" : "text-[#ef4444]"} />
                </div>
                <span className="text-xs text-[#64748b]">{summary.summary.surplus >= 0 ? "עודף" : "גירעון"}</span>
              </div>
              <div className={`text-xl font-bold ${summary.summary.surplus >= 0 ? "text-[#16a34a]" : "text-[#ef4444]"}`}>
                {fmt(Math.abs(summary.summary.surplus))}
              </div>
              <div className="text-xs text-[#94a3b8] mt-1">ממתין: {fmt(summary.summary.pendingExpenses)}</div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#fef3c7] flex items-center justify-center">
                  <BarChart3 size={16} className="text-[#d97706]" />
                </div>
                <span className="text-xs text-[#64748b]">קבלות חסרות</span>
              </div>
              <div className="text-xl font-bold text-[#d97706]">{summary.missingReceipts}</div>
              <div className="text-xs text-[#94a3b8] mt-1">תרומות ללא קבלה</div>
            </div>
          </div>

          {/* Bank Accounts */}
          {summary.bankAccounts.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="text-sm font-semibold text-[#1e293b] mb-3">💰 יתרות חשבונות בנק</div>
              <div className="space-y-2">
                {summary.bankAccounts.map((acc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#64748b]">🏦 {acc.bankName} — {acc.accountNumber}{acc.isPrimary ? " (ראשי)" : ""}</span>
                    <span className="font-bold text-[#1e293b]">{fmt(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#f1f5f9]">
                  <span>סה"כ</span>
                  <span className="text-[#2563eb]">{fmt(summary.bankAccounts.reduce((s, a) => s + a.balance, 0))}</span>
                </div>
              </div>
            </div>
          )}

          {/* Expenses by category */}
          {Object.keys(summary.expensesByCategory).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="text-sm font-semibold text-[#1e293b] mb-3">📊 הוצאות לפי קטגוריה</div>
              <div className="space-y-2">
                {Object.entries(summary.expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => {
                    const pct = summary.summary.totalExpenses > 0 ? (amt / summary.summary.totalExpenses * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs text-[#64748b] mb-0.5">
                          <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                          <span>{fmt(amt)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="text-sm font-semibold text-[#1e293b] mb-3">📤 ייצוא לרואה חשבון</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleExport("expenses")}
                disabled={exporting}
                className="flex flex-col items-center gap-2 p-4 border border-[#e8ecf4] rounded-xl hover:border-[#2563eb] hover:bg-[#f8f9fc] transition-all text-center"
              >
                <FileSpreadsheet size={24} className="text-[#2563eb]" />
                <span className="text-xs font-medium text-[#1e293b]">הוצאות CSV</span>
                <span className="text-[10px] text-[#94a3b8]">תואם ריבהיט/פריוריטי</span>
              </button>
              <button
                onClick={() => handleExport("transactions")}
                disabled={exporting}
                className="flex flex-col items-center gap-2 p-4 border border-[#e8ecf4] rounded-xl hover:border-[#2563eb] hover:bg-[#f8f9fc] transition-all text-center"
              >
                <FileSpreadsheet size={24} className="text-[#0891b2]" />
                <span className="text-xs font-medium text-[#1e293b]">תנועות בנק CSV</span>
                <span className="text-[10px] text-[#94a3b8]">תואם רב-מסר</span>
              </button>
              <button
                onClick={() => handleExport("all")}
                disabled={exporting}
                className="flex flex-col items-center gap-2 p-4 border border-[#e8ecf4] rounded-xl hover:border-[#2563eb] hover:bg-[#f8f9fc] transition-all text-center"
              >
                <Download size={24} className="text-[#7c3aed]" />
                <span className="text-xs font-medium text-[#1e293b]">דוח מלא CSV</span>
                <span className="text-[10px] text-[#94a3b8]">הכנסות + הוצאות + תרומות</span>
              </button>
              <button
                onClick={handleOpenReport}
                className="flex flex-col items-center gap-2 p-4 border border-[#e8ecf4] rounded-xl hover:border-[#2563eb] hover:bg-[#f8f9fc] transition-all text-center"
              >
                <BarChart3 size={24} className="text-[#d97706]" />
                <span className="text-xs font-medium text-[#1e293b]">דוח שנתי PDF</span>
                <span className="text-[10px] text-[#94a3b8]">לרשם עמותות</span>
              </button>
            </div>
          </div>

          {/* Compliance status */}
          {summary.compliance.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="text-sm font-semibold text-[#1e293b] mb-3">✅ מצב ניהול תקין</div>
              <div className="space-y-2">
                {summary.compliance.map((c, i) => {
                  const fullItem = complianceItems.find(ci => ci.name === c.itemName);
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {c.status === "OK"
                          ? <CheckCircle size={14} className="text-[#16a34a]" />
                          : <AlertCircle size={14} className={c.status === "EXPIRED" ? "text-[#ef4444]" : "text-[#d97706]"} />}
                        <span className="text-[#64748b]">{c.itemName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#94a3b8]">
                          {c.dueDate ? new Date(c.dueDate).toLocaleDateString("he-IL") : "—"}
                        </span>
                        {fullItem && <HandleNowButton item={fullItem} onClick={setActionItem} size="sm" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-[#94a3b8]">לא נמצאו נתונים לתקופה זו</div>
      )}

      <SmartActionsModal item={actionItem} onClose={() => setActionItem(null)} onHandled={fetchData} />
    </div>
  );
}

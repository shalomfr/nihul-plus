"use client";
import { useState, useEffect, useRef } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  ArrowRight, Receipt, Upload, ScanLine, Link2, CheckCircle2,
  AlertCircle, Loader2, X, Plus, Search, FileText, ChevronDown,
} from "lucide-react";

type Expense = {
  id: string;
  description: string;
  vendor: string | null;
  amount: number;
  category: string;
  expenseDate: string;
  status: string;
  invoiceNumber: string | null;
  receiptUrl: string | null;
};

type OcrResult = {
  amount: number | null;
  date: string;
  vendor: string | null;
  invoiceNumber: string | null;
  description: string;
  category: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  SALARIES: "משכורות", RENT: "שכירות", ACTIVITIES: "פעילויות",
  MARKETING: "שיווק", ADMINISTRATION: "הנהלה וכלליות",
  TRANSPORTATION: "תחבורה", SUPPLIES: "ציוד",
  PROFESSIONAL_SERVICES: "שירותים מקצועיים", INSURANCE: "ביטוח",
  MAINTENANCE: "תחזוקה", OTHER: "אחר",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "ממתין", color: "#d97706", bg: "#fef3c7" },
  APPROVED: { label: "מאושר", color: "#2563eb", bg: "#eff6ff" },
  PAID: { label: "שולם", color: "#16a34a", bg: "#f0fdf4" },
  REJECTED: { label: "נדחה", color: "#ef4444", bg: "#fef2f2" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) => new Date(s).toLocaleDateString("he-IL");

type ModalState =
  | { type: "none" }
  | { type: "scan" }
  | { type: "ocr_result"; ocrData: OcrResult; imageBase64: string }
  | { type: "link"; expense: Expense };

export default function InvoicesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with_invoice" | "missing">("all");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Editable OCR form
  const [ocrForm, setOcrForm] = useState<OcrResult>({
    amount: null, date: "", vendor: null, invoiceNumber: null,
    description: "חשבונית", category: "OTHER",
  });

  // Link modal form
  const [linkUrl, setLinkUrl] = useState("");
  const [linkInvoiceNum, setLinkInvoiceNum] = useState("");
  const [linkSearchExpense, setLinkSearchExpense] = useState("");

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadExpenses(); }, []);

  // ── File → OCR ──
  const handleFileChosen = async (file: File) => {
    setModal({ type: "scan" });
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      try {
        const res = await fetch("/api/ocr/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });
        const json = await res.json();
        const extracted: OcrResult = json.data?.extracted ?? {
          amount: null, date: new Date().toISOString().split("T")[0],
          vendor: null, invoiceNumber: null, description: "חשבונית", category: "OTHER",
        };
        setOcrForm(extracted);
        setModal({ type: "ocr_result", ocrData: extracted, imageBase64: base64 });
      } catch {
        showToast(false, "שגיאה בסריקת החשבונית");
        setModal({ type: "none" });
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Create expense from OCR ──
  const handleCreateFromOcr = async () => {
    if (!ocrForm.amount || ocrForm.amount <= 0) {
      showToast(false, "יש להזין סכום תקין");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: ocrForm.description || "חשבונית",
          vendor: ocrForm.vendor ?? undefined,
          amount: ocrForm.amount,
          category: ocrForm.category,
          expenseDate: ocrForm.date || new Date().toISOString().split("T")[0],
          invoiceNumber: ocrForm.invoiceNumber ?? undefined,
        }),
      });
      if (res.ok) {
        showToast(true, "ההוצאה נוצרה בהצלחה מהחשבונית");
        setModal({ type: "none" });
        loadExpenses();
      } else {
        const err = await res.json();
        showToast(false, err.error ?? "שגיאה ביצירת ההוצאה");
      }
    } catch {
      showToast(false, "שגיאת רשת");
    }
    setSaving(false);
  };

  // ── Link invoice file to existing expense ──
  const handleLinkToExpense = async (expenseId: string) => {
    if (!linkUrl.trim()) {
      showToast(false, "יש להזין קישור לקובץ החשבונית");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptUrl: linkUrl.trim(),
          invoiceNumber: linkInvoiceNum.trim() || undefined,
        }),
      });
      if (res.ok) {
        showToast(true, "החשבונית קושרה להוצאה");
        setModal({ type: "none" });
        setLinkUrl("");
        setLinkInvoiceNum("");
        loadExpenses();
      } else {
        showToast(false, "שגיאה בקישור החשבונית");
      }
    } catch {
      showToast(false, "שגיאת רשת");
    }
    setSaving(false);
  };

  // ── Filtering ──
  const filtered = expenses.filter((e) => {
    if (filter === "with_invoice" && !e.receiptUrl && !e.invoiceNumber) return false;
    if (filter === "missing" && (e.receiptUrl || e.invoiceNumber)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.description?.toLowerCase().includes(q) ||
        e.vendor?.toLowerCase().includes(q) ||
        e.invoiceNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const withInvoice = expenses.filter((e) => e.receiptUrl || e.invoiceNumber).length;
  const missing = expenses.filter((e) => !e.receiptUrl && !e.invoiceNumber).length;

  // Expenses for link modal search
  const linkExpenses = expenses.filter((e) => {
    if (!linkSearchExpense) return true;
    const q = linkSearchExpense.toLowerCase();
    return e.description?.toLowerCase().includes(q) || e.vendor?.toLowerCase().includes(q);
  });

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8" dir="rtl">
      <Topbar title="חשבוניות" subtitle="ניהול, סריקה וקישור חשבוניות להוצאות" />

      <Link href="/portal" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
        <ArrowRight size={14} /> חזרה לדשבורד
      </Link>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "סה״כ הוצאות", value: expenses.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "עם חשבונית", value: withInvoice, color: "#16a34a", bg: "#f0fdf4" },
          { label: "ללא חשבונית", value: missing, color: "#ef4444", bg: "#fef2f2" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e8ecf4] px-4 py-3 text-center"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="text-[22px] font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-[#64748b]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <ScanLine size={16} />
          סרוק חשבונית (OCR)
        </button>
        <button
          onClick={() => { setLinkSearchExpense(""); setLinkUrl(""); setLinkInvoiceNum(""); setModal({ type: "link", expense: expenses[0] }); }}
          className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Link2 size={16} />
          קשר חשבונית להוצאה
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChosen(f); e.target.value = ""; }}
        />
      </div>

      {/* ── Filter + Search ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "with_invoice", "missing"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${filter === f ? "bg-[#1e293b] text-white" : "bg-white border border-[#e8ecf4] text-[#64748b] hover:border-[#cbd5e1]"}`}
          >
            {f === "all" ? "הכל" : f === "with_invoice" ? "עם חשבונית" : "חסרה חשבונית"}
          </button>
        ))}
        <div className="flex items-center gap-2 bg-white border border-[#e8ecf4] rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי תיאור / ספק..."
            className="text-[12px] bg-transparent outline-none text-[#1e293b] placeholder:text-[#94a3b8] w-full"
          />
        </div>
      </div>

      {/* ── Expenses list ── */}
      <div className="bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[#94a3b8]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">טוען הוצאות...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-[#94a3b8]">
            <Receipt size={32} strokeWidth={1.5} />
            <p className="text-sm">לא נמצאו הוצאות</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_100px_120px_80px_140px] gap-3 px-5 py-2.5 bg-[#f8fafc] text-[11px] font-semibold text-[#94a3b8] uppercase">
              <span>הוצאה</span>
              <span>סכום</span>
              <span>תאריך</span>
              <span>סטטוס</span>
              <span>חשבונית</span>
            </div>

            {filtered.map((expense) => {
              const hasInvoice = !!(expense.receiptUrl || expense.invoiceNumber);
              const st = STATUS_LABELS[expense.status] ?? STATUS_LABELS.PENDING;
              return (
                <div key={expense.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_80px_140px] gap-2 md:gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-colors items-center">
                  {/* Description */}
                  <div>
                    <div className="text-[13px] font-semibold text-[#1e293b]">{expense.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {expense.vendor && <span className="text-[11px] text-[#94a3b8]">{expense.vendor}</span>}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#64748b]">
                        {CATEGORY_LABELS[expense.category] ?? expense.category}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-[13px] font-bold text-[#1e293b]">{fmt(expense.amount)}</div>

                  {/* Date */}
                  <div className="text-[12px] text-[#64748b]">{fmtDate(expense.expenseDate)}</div>

                  {/* Status */}
                  <div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Invoice status + action */}
                  <div className="flex items-center gap-2">
                    {hasInvoice ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-[#16a34a]" />
                        <div>
                          {expense.invoiceNumber && (
                            <div className="text-[11px] font-semibold text-[#16a34a]">{expense.invoiceNumber}</div>
                          )}
                          {expense.receiptUrl && (
                            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-[#2563eb] hover:underline">
                              צפה בקובץ
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setLinkSearchExpense("");
                          setLinkUrl("");
                          setLinkInvoiceNum("");
                          setModal({ type: "link", expense });
                        }}
                        className="flex items-center gap-1 text-[11px] text-[#d97706] hover:text-[#b45309] font-semibold border border-[#fde68a] bg-[#fef9c3] hover:bg-[#fef3c7] px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <AlertCircle size={12} />
                        קשר חשבונית
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────── SCAN LOADING MODAL ─────────────────── */}
      {modal.type === "scan" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center" dir="rtl">
            <Loader2 size={40} className="animate-spin text-[#ea580c] mx-auto mb-4" />
            <p className="text-[15px] font-bold text-[#1e293b]">סורק חשבונית...</p>
            <p className="text-sm text-[#94a3b8] mt-1">ה-OCR מנתח את הטקסט בחשבונית</p>
          </div>
        </div>
      )}

      {/* ─────────────────── OCR RESULT MODAL ─────────────────── */}
      {modal.type === "ocr_result" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4" dir="rtl" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] flex items-center justify-center">
                  <ScanLine size={18} className="text-[#ea580c]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1e293b]">תוצאות סריקה</h3>
                  <p className="text-[11px] text-[#94a3b8]">בדוק ותקן את הפרטים לפני יצירת ההוצאה</p>
                </div>
              </div>
              <button onClick={() => setModal({ type: "none" })} className="text-[#94a3b8] hover:text-[#1e293b]">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">סכום (₪) *</label>
                <input
                  type="number"
                  value={ocrForm.amount ?? ""}
                  onChange={(e) => setOcrForm((f) => ({ ...f, amount: parseFloat(e.target.value) || null }))}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                  placeholder="0.00"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">ספק</label>
                <input
                  type="text"
                  value={ocrForm.vendor ?? ""}
                  onChange={(e) => setOcrForm((f) => ({ ...f, vendor: e.target.value || null }))}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                  placeholder="שם הספק"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">תיאור</label>
                <input
                  type="text"
                  value={ocrForm.description}
                  onChange={(e) => setOcrForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                />
              </div>

              {/* Date + Invoice number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1">תאריך</label>
                  <input
                    type="date"
                    value={ocrForm.date}
                    onChange={(e) => setOcrForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1">מספר חשבונית</label>
                  <input
                    type="text"
                    value={ocrForm.invoiceNumber ?? ""}
                    onChange={(e) => setOcrForm((f) => ({ ...f, invoiceNumber: e.target.value || null }))}
                    className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                    placeholder="INV-001"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">קטגוריה</label>
                <div className="relative">
                  <select
                    value={ocrForm.category}
                    onChange={(e) => setOcrForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ea580c] appearance-none bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCreateFromOcr}
                disabled={saving || !ocrForm.amount}
                className="flex-1 bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                צור הוצאה
              </button>
              <button
                onClick={() => setModal({ type: "none" })}
                className="px-5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-medium py-3 rounded-xl"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── LINK INVOICE MODAL ─────────────────── */}
      {modal.type === "link" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4" dir="rtl" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                  <Link2 size={18} className="text-[#2563eb]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1e293b]">קשר חשבונית להוצאה</h3>
                  <p className="text-[11px] text-[#94a3b8]">בחר הוצאה קיימת וצרף קישור לחשבונית</p>
                </div>
              </div>
              <button onClick={() => setModal({ type: "none" })} className="text-[#94a3b8] hover:text-[#1e293b]">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Invoice URL */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">קישור לקובץ החשבונית (URL) *</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  placeholder="https://drive.google.com/..."
                  dir="ltr"
                />
              </div>

              {/* Invoice number */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">מספר חשבונית (אופציונלי)</label>
                <input
                  type="text"
                  value={linkInvoiceNum}
                  onChange={(e) => setLinkInvoiceNum(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  placeholder="INV-001"
                />
              </div>

              {/* Search expense */}
              <div>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1">בחר הוצאה</label>
                <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-xl px-3 py-2 mb-2">
                  <Search size={13} className="text-[#94a3b8]" />
                  <input
                    type="text"
                    value={linkSearchExpense}
                    onChange={(e) => setLinkSearchExpense(e.target.value)}
                    placeholder="חפש לפי תיאור / ספק..."
                    className="text-[12px] bg-transparent outline-none text-[#1e293b] placeholder:text-[#94a3b8] w-full"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[#e2e8f0] divide-y divide-[#f1f5f9]">
                  {linkExpenses.slice(0, 20).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => handleLinkToExpense(e.id)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#eff6ff] transition-colors text-right disabled:opacity-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[#1e293b] truncate">{e.description}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {e.vendor && <span className="text-[10px] text-[#94a3b8]">{e.vendor}</span>}
                          <span className="text-[10px] font-bold text-[#1e293b]">{fmt(e.amount)}</span>
                          <span className="text-[10px] text-[#94a3b8]">{fmtDate(e.expenseDate)}</span>
                        </div>
                      </div>
                      {e.receiptUrl || e.invoiceNumber
                        ? <CheckCircle2 size={14} className="text-[#16a34a] flex-shrink-0" />
                        : <FileText size={14} className="text-[#cbd5e1] flex-shrink-0" />}
                    </button>
                  ))}
                  {linkExpenses.length === 0 && (
                    <div className="py-6 text-center text-[12px] text-[#94a3b8]">לא נמצאו הוצאות</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setModal({ type: "none" })}
                className="w-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-medium py-3 rounded-xl"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── TOAST ─────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-white text-sm font-semibold transition-all
          ${toast.ok ? "bg-[#16a34a]" : "bg-[#ef4444]"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

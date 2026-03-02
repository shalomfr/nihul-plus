"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, AlertCircle, Shield, ChevronDown,
  Search, Filter, RefreshCw, X, Mail, Upload, Users, Landmark,
  Phone, FileText, Zap, ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/Toast";

type ComplianceItem = {
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  frequency?: string;
  isRequired?: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  FOUNDING_DOCS: "מסמכי יסוד",
  ANNUAL_OBLIGATIONS: "חובות שנתיות לרשם",
  TAX_APPROVALS: "אישורים מרשות המסים",
  FINANCIAL_MGMT: "ניהול כספי שוטף",
  DISTRIBUTION_DOCS: "תיעוד חלוקת כספים",
  GOVERNANCE: "ממשל ופרוטוקולים",
  EMPLOYEES_VOLUNTEERS: "עובדים ומתנדבים",
  INSURANCE: "ביטוח",
  GEMACH: "גמ\"ח כספים",
};

const CATEGORY_ORDER = [
  "FOUNDING_DOCS", "ANNUAL_OBLIGATIONS", "TAX_APPROVALS", "FINANCIAL_MGMT",
  "DISTRIBUTION_DOCS", "GOVERNANCE", "EMPLOYEES_VOLUNTEERS", "INSURANCE", "GEMACH",
];

const FREQ_LABELS: Record<string, string> = {
  one_time: "חד-פעמי",
  annual: "שנתי",
  monthly: "חודשי",
  quarterly: "רבעוני",
};

type FilterMode = "all" | "attention" | "ok";

type SmartActionDef = {
  label: string;
  description: string;
  icon: "mail" | "upload" | "users" | "bank" | "phone" | "docs" | "zap";
  href?: string;
  /** email template key to open in institutions page */
  emailTemplate?: string;
};

type SmartActionsConfig = {
  headline: string;
  tip: string;
  actions: SmartActionDef[];
};

function getSmartActions(item: ComplianceItem): SmartActionsConfig {
  switch (item.category) {
    case "ANNUAL_OBLIGATIONS":
      return {
        headline: "חובה שנתית לרשם העמותות",
        tip: "שלח מייל מקצועי לרשם עם תבנית מוכנה, או טפל ישירות דרך הגשה מקוונת.",
        actions: [
          { label: "📧 שלח בקשת ארכה לרשם", description: "מייל מקצועי מוכן לשליחה", icon: "mail", href: "/portal/institutions?email=registrar_extension_request" },
          { label: "📤 הגש מסמכים לרשם", description: "שלח מסמכים שהתבקשו", icon: "mail", href: "/portal/institutions?email=registrar_document_submission" },
          { label: "📁 העלה מסמך לתיק", description: "שמור עותק מקומי", icon: "upload", href: "/portal/documents" },
        ],
      };

    case "TAX_APPROVALS":
      return {
        headline: "אישורי מס — סעיף 46, מלכ\"ר, קבלות",
        tip: "סעיף 46 מאפשר לתורמים זיכוי ממס של 35%. חידוש שנתי מותנה באישור ניהול תקין. הנפקת קבלות תרומה היא חובה חוקית.",
        actions: [
          { label: "📧 בקש חידוש סעיף 46", description: "מייל לרשות המסים", icon: "mail", href: "/portal/institutions?email=tax_section46_renewal" },
          { label: "🧾 הנפק קבלות תרומה", description: "קבלות סעיף 46 לתורמים", icon: "docs", href: "/portal/invoices" },
          { label: "📊 דוח תרומה מישות זרה", description: "אם רלוונטי לארגונך", icon: "mail", href: "/portal/institutions?email=tax_foreign_donation_report" },
          { label: "📁 העלה אישור מרשות", description: "אחרי קבלת האישור", icon: "upload", href: "/portal/documents" },
        ],
      };

    case "FOUNDING_DOCS":
      return {
        headline: "מסמך יסוד חסר",
        tip: "יש להעלות את המסמך לתיק העמותה כדי שיהיה נגיש בכל עת.",
        actions: [
          { label: "📤 העלה מסמך עכשיו", description: "הוסף לתיק הדיגיטלי", icon: "upload", href: "/portal/documents" },
          { label: "📋 תיק העמותה המלא", description: "צפה בכל המסמכים", icon: "docs", href: "/portal/org-file" },
        ],
      };

    case "FINANCIAL_MGMT":
      return {
        headline: "פעולה בנקאית / כספית נדרשת",
        tip: "עבור לדף הבנק לביצוע הפעולה הנדרשת, או ייצא דוח לרואה החשבון.",
        actions: [
          { label: "🏦 פתח דף בנק", description: "ניהול חשבונות והוצאות", icon: "bank", href: "/portal/banking" },
          { label: "🧮 דף רואה חשבון", description: "ייצוא ודוחות כספיים", icon: "docs", href: "/portal/accountant" },
        ],
      };

    case "DISTRIBUTION_DOCS":
      return {
        headline: "תיעוד חלוקת כספים חסר",
        tip: "יש לתעד כל חלוקת כספים לפי דרישות רשם העמותות — פרוטוקול החלטה + חשבונית.",
        actions: [
          { label: "📁 העלה תיעוד", description: "חשבונית / פרוטוקול", icon: "upload", href: "/portal/documents" },
          { label: "👥 הוסף פרוטוקול ועד", description: "ועד מנהל — ממשל", icon: "users", href: "/portal/board" },
        ],
      };

    case "GOVERNANCE":
      return {
        headline: "ממשל תקין — פרוטוקולים, ועד וביקורת",
        tip: "כל ישיבת ועד חייבת פרוטוקול חתום הכולל: תאריך, משתתפים, סדר יום, תוצאות הצבעה, והחלטות. פרוטוקול שלא נחתם — לא תקף.",
        actions: [
          { label: "👥 זמן ישיבת ועד", description: "שלח הזמנה לחברי הועד", icon: "users", href: "/portal/board" },
          { label: "📁 הוסף פרוטוקול", description: "העלה פרוטוקול חתום", icon: "upload", href: "/portal/documents" },
          { label: "📋 הצהרת ניגוד עניינים", description: "טופס הצהרה לחבר ועד", icon: "docs", href: "/portal/documents" },
          { label: "📅 תאם בלוח שנה", description: "הוסף ישיבה ליומן", icon: "docs", href: "/portal/calendar" },
        ],
      };

    case "EMPLOYEES_VOLUNTEERS":
      return {
        headline: "עובדים, מתנדבים וקרובי משפחה",
        tip: "בדוק את העסקת קרובי משפחה (עד 1/3 מהועד יכולים להיות קרובים). כל העסקת קרוב משפחה של חבר ועד מחייבת אישור מיוחד בפרוטוקול + שכר סביר.",
        actions: [
          { label: "📋 בדוק קרובי משפחה", description: "בדיקת העסקת קרובים בעמותה", icon: "users", href: "/portal/board" },
          { label: "📁 העלה הצהרת קרבה", description: "הצהרה חתומה מחבר ועד", icon: "upload", href: "/portal/documents" },
          { label: "📁 העלה חוזה עבודה", description: "חוזה עובד / מתנדב", icon: "upload", href: "/portal/documents" },
          { label: "📧 שלח לרשם", description: "הגשת מסמכים לרשם", icon: "mail", href: "/portal/institutions?email=registrar_document_submission" },
        ],
      };

    case "INSURANCE":
      return {
        headline: "כיסוי ביטוחי נדרש",
        tip: "ביטוח מתנדבים הוא חובה חוקית. כמו כן מומלץ ביטוח D&O לחברי ועד, ביטוח רכוש, וביטוח צד שלישי לאירועים.",
        actions: [
          { label: "📞 פנה למלווה", description: "קבל הכוונה מהמלווה שלך", icon: "phone", href: "/portal/contact" },
          { label: "📁 העלה פוליסה", description: "ביטוח מתנדבים / D&O / רכוש", icon: "upload", href: "/portal/documents" },
          { label: "📞 בקש הצעת מחיר", description: "פנה לסוכן ביטוח", icon: "phone", href: "/portal/contact" },
        ],
      };

    case "GEMACH":
      return {
        headline: "מסמך גמ\"ח חסר",
        tip: "פעילות גמ\"ח מחייבת תיעוד מיוחד לפי הנחיות רשם העמותות.",
        actions: [
          { label: "📁 העלה מסמך גמ\"ח", description: "הסכם / נוהל גמ\"ח", icon: "upload", href: "/portal/documents" },
          { label: "📧 הגש לרשם", description: "שלח עדכון לרשם", icon: "mail", href: "/portal/institutions?email=registrar_document_submission" },
        ],
      };

    default:
      return {
        headline: "דרוש טיפול",
        tip: item.description ?? "יש לטפל בפריט זה בהקדם.",
        actions: [
          { label: "📁 העלה מסמך", description: "הוסף לתיק הדיגיטלי", icon: "upload", href: "/portal/documents" },
          { label: "📧 שלח מייל לרשם", description: "פנה לרשות הרלוונטית", icon: "mail", href: "/portal/institutions" },
        ],
      };
  }
}

const ACTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  mail: Mail,
  upload: Upload,
  users: Users,
  bank: Landmark,
  phone: Phone,
  docs: FileText,
  zap: Zap,
};

export default function PortalStatusPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [actionModal, setActionModal] = useState<ComplianceItem | null>(null);

  const fetchData = () => {
    fetch("/api/compliance")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setItems(res.data.items ?? []);
          const initialOpen: Record<string, boolean> = {};
          const cats = new Set((res.data.items ?? []).map((i: ComplianceItem) => i.category));
          cats.forEach(cat => {
            const hasIssue = (res.data.items ?? []).some(
              (i: ComplianceItem) => i.category === cat && i.status !== "OK"
            );
            initialOpen[cat as string] = hasIssue;
          });
          setOpenCategories(prev => {
            const merged = { ...initialOpen };
            for (const key of Object.keys(prev)) {
              if (prev[key]) merged[key] = true;
            }
            return merged;
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleMarkAsHandled = async (item: ComplianceItem) => {
    setUpdatingIds(prev => new Set(prev).add(item.id));
    try {
      const res = await fetch(`/api/compliance/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OK", completedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`"${item.name}" סומן כמטופל`);
        setActionModal(null);
        fetchData();
      } else {
        showError("שגיאה בעדכון הסטטוס");
      }
    } catch {
      showError("שגיאה בעדכון הסטטוס");
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const filteredItems = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterMode === "attention") return item.status !== "OK";
    if (filterMode === "ok") return item.status === "OK";
    return true;
  });

  const byCategory: Record<string, ComplianceItem[]> = {};
  for (const cat of CATEGORY_ORDER) {
    const catItems = filteredItems.filter(i => i.category === cat);
    if (catItems.length > 0) byCategory[cat] = catItems;
  }

  const total = items.length;
  const okCount = items.filter(i => i.status === "OK").length;
  const score = total > 0 ? Math.round((okCount / total) * 100) : 0;
  const attentionCount = total - okCount;

  const getStatusIcon = (status: string) => {
    if (status === "OK") return <CheckCircle2 size={16} className="text-[#16a34a] flex-shrink-0" />;
    if (status === "EXPIRED" || status === "MISSING") return <AlertCircle size={16} className="text-[#ef4444] flex-shrink-0" />;
    return <AlertTriangle size={16} className="text-[#d97706] flex-shrink-0" />;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      OK: { label: "תקין", cls: "text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]" },
      WARNING: { label: "דורש טיפול", cls: "text-[#d97706] bg-[#fffbeb] border-[#fde68a]" },
      EXPIRED: { label: "פג תוקף", cls: "text-[#ef4444] bg-[#fef2f2] border-[#fecaca]" },
      MISSING: { label: "חסר", cls: "text-[#ef4444] bg-[#fef2f2] border-[#fecaca]" },
    };
    const s = map[status] ?? { label: status, cls: "text-[#64748b] bg-[#f8f9fc] border-[#e8ecf4]" };
    return <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${s.cls}`}>{s.label}</span>;
  };

  const getActionButton = (item: ComplianceItem) => {
    if (item.status === "OK") return null;
    const isUpdating = updatingIds.has(item.id);
    return (
      <button
        onClick={() => setActionModal(item)}
        disabled={isUpdating}
        className="text-[11px] font-bold text-white px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
      >
        {isUpdating ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
        טפל עכשיו
      </button>
    );
  };

  const getCategoryScore = (cat: string) => {
    const catItems = items.filter(i => i.category === cat);
    const catOk = catItems.filter(i => i.status === "OK").length;
    return { ok: catOk, total: catItems.length, score: catItems.length > 0 ? Math.round((catOk / catItems.length) * 100) : 0 };
  };

  const getCategoryColor = (score: number) =>
    score === 100 ? "#16a34a" : score >= 60 ? "#d97706" : "#ef4444";

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="האם אני בסדר?" subtitle="מצב הציות והמסמכים הנדרשים לארגונך" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const modalConfig = actionModal ? getSmartActions(actionModal) : null;

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="האם אני בסדר?" subtitle="מצב הציות והמסמכים הנדרשים לארגונך" />

      {/* ─── SUMMARY BAR ─── */}
      <div className="anim-fade-down bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#eff6ff] flex-shrink-0">
            <Shield size={24} className="text-[#2563eb]" />
          </div>
          <div>
            <div className="text-[28px] font-bold text-[#2563eb] leading-none">{score}</div>
            <div className="text-[11px] text-[#64748b] mt-0.5">ציון כללי מתוך 100</div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full anim-progress" style={{ width: `${score}%`, background: getCategoryColor(score) }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-[#64748b]">
              <span>{okCount} תקינים</span>
              <span>{attentionCount} דורשים טיפול</span>
              <span>{total} סה"כ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY MINI CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        {CATEGORY_ORDER.filter(cat => items.some(i => i.category === cat)).map(cat => {
          const cs = getCategoryScore(cat);
          const color = getCategoryColor(cs.score);
          return (
            <button
              key={cat}
              onClick={() => { setOpenCategories(prev => ({ ...prev, [cat]: true })); setTimeout(() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
              className="anim-fade-scale bg-white rounded-xl border border-[#e8ecf4] p-3 text-right hover:border-[#2563eb]/40 hover:shadow-sm transition-all"
            >
              <div className="text-[11px] font-semibold text-[#1e293b] leading-tight mb-1.5">{CATEGORY_LABELS[cat]}</div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cs.score}%`, background: color }} />
                </div>
                <span className="text-[11px] font-bold flex-shrink-0" style={{ color }}>{cs.ok}/{cs.total}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── FILTERS ─── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          {([["all", "הכל"], ["attention", "דורשים טיפול"], ["ok", "הושלמו"]] as [FilterMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                filterMode === mode
                  ? "bg-[#2563eb] text-white"
                  : "bg-white border border-[#e8ecf4] text-[#1e293b] hover:border-[#2563eb]/50"
              }`}
            >
              <Filter size={13} />
              {label}
              {mode === "attention" && attentionCount > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${filterMode === mode ? "bg-white/20 text-white" : "bg-[#ef4444] text-white"}`}>{attentionCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center bg-white border border-[#e8ecf4] rounded-xl px-3 py-2 gap-2 flex-1 max-w-xs">
          <Search size={14} className="text-[#64748b]" />
          <input
            type="text"
            placeholder="חיפוש פריט..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-[13px] text-[#1e293b] placeholder-[#94a3b8] w-full"
          />
        </div>
      </div>

      {/* ─── ACCORDION CATEGORIES ─── */}
      <div className="space-y-3">
        {Object.keys(byCategory).length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e8ecf4] p-8 text-center text-[#64748b]">לא נמצאו פריטים</div>
        ) : (
          Object.entries(byCategory).map(([cat, catItems], idx) => {
            const cs = getCategoryScore(cat);
            const color = getCategoryColor(cs.score);
            const isOpen = openCategories[cat] ?? false;
            const hasIssues = catItems.some(i => i.status !== "OK");

            return (
              <div key={cat} id={`cat-${cat}`} className={`anim-fade-up delay-${(idx % 4) + 1} bg-white rounded-2xl border overflow-hidden transition-all ${hasIssues ? "border-[#fde68a]" : "border-[#e8ecf4]"}`} style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-[#f8f9fc] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-[14px] font-bold text-[#1e293b]">{CATEGORY_LABELS[cat]}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cs.score}%`, background: color }} />
                      </div>
                      <span className="text-[11px] font-bold" style={{ color }}>{cs.ok}/{cs.total}</span>
                    </div>
                    {hasIssues && (
                      <span className="text-[10px] font-semibold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded-lg border border-[#fde68a]">
                        {catItems.filter(i => i.status !== "OK").length} לטיפול
                      </span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-[#64748b] transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="divide-y divide-[#e8ecf4] border-t border-[#e8ecf4]">
                    {catItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8f9fc] transition-colors">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-[#1e293b]">{item.name}</span>
                            {item.frequency && (
                              <span className="text-[10px] text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md">
                                {FREQ_LABELS[item.frequency] ?? item.frequency}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-[#64748b] mt-0.5">{item.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(item.status)}
                          {getActionButton(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── SMART ACTION MODAL ─── */}
      {actionModal && modalConfig && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setActionModal(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-4 border-b border-[#f1f5f9]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(actionModal.status)}
                  <span className="text-[15px] font-bold text-[#1e293b]">{actionModal.name}</span>
                </div>
                <div className="text-[12px] text-[#64748b]">{modalConfig.headline}</div>
              </div>
              <button onClick={() => setActionModal(null)} className="text-[#94a3b8] hover:text-[#1e293b] transition-colors ml-2 flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Tip */}
              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
                <p className="text-[12px] text-[#92400e] leading-relaxed">{modalConfig.tip}</p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[#64748b] mb-2">בחר פעולה:</div>
                {modalConfig.actions.map((action, i) => {
                  const Icon = ACTION_ICONS[action.icon] ?? FileText;
                  return (
                    <Link
                      key={i}
                      href={action.href ?? "#"}
                      onClick={() => setActionModal(null)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#e8ecf4] hover:border-[#2563eb]/40 hover:bg-[#eff6ff] transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#f8f9fc] group-hover:bg-[#eff6ff] flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon size={16} className="text-[#2563eb]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-[#1e293b]">{action.label}</div>
                        <div className="text-[11px] text-[#64748b]">{action.description}</div>
                      </div>
                      <ArrowRight size={14} className="text-[#cbd5e1] group-hover:text-[#2563eb] transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5 pt-1">
              <button
                onClick={() => handleMarkAsHandled(actionModal)}
                disabled={updatingIds.has(actionModal.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] font-semibold text-[13px] hover:bg-[#dcfce7] transition-colors disabled:opacity-50"
              >
                {updatingIds.has(actionModal.id) ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                סמן כמטופל
              </button>
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4] text-[#64748b] font-medium text-[13px] hover:bg-[#f1f5f9] transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

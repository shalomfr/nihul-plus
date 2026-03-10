"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, AlertCircle, Shield, ChevronDown,
  Search, Filter,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { type ComplianceItem, CATEGORY_LABELS } from "@/lib/smart-actions";
import HandleNowButton from "@/components/HandleNowButton";
import SmartActionsModal from "@/components/SmartActionsModal";

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

export default function PortalStatusPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
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

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="האם אני בסדר?" subtitle="מצב הציות והמסמכים הנדרשים לארגונך" />

      {/* ─── SUMMARY BAR ─── */}
      <div data-tour="status-score" className="anim-fade-down bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
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
      <div data-tour="status-categories" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
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
      <div data-tour="status-filters" className="flex flex-col sm:flex-row gap-3 mb-4">
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
      <div data-tour="status-accordion" className="space-y-3">
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
                          <HandleNowButton item={item} onClick={setActionModal} />
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
      <SmartActionsModal item={actionModal} onClose={() => setActionModal(null)} onHandled={fetchData} />
    </div>
  );
}

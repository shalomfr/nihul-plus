"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, AlertCircle, ArrowRight,
  ShieldCheck, BookOpenCheck, Receipt, FileCheck, ScrollText, Users, FileBarChart,
} from "lucide-react";
import { type ComplianceItem } from "@/lib/smart-actions";
import HandleNowButton from "@/components/HandleNowButton";
import SmartActionsModal from "@/components/SmartActionsModal";

/* The 7 key items for the org file */
const ORG_FILE_ITEMS = [
  { key: "ניהול_תקין", label: "אישור ניהול תקין", icon: ShieldCheck, description: "אישור מרשם העמותות לניהול תקין של העמותה" },
  { key: "ניהול_ספרים", label: "אישור ניהול ספרים", icon: BookOpenCheck, description: "אישור מרשות המסים על ניהול ספרים כדין" },
  { key: "ניכוי_מס", label: "אישור ניכוי מס", icon: Receipt, description: "אישור ניכוי מס במקור לספקים ונותני שירותים" },
  { key: "סעיף_46", label: "אישור סעיף 46", icon: FileCheck, description: "אישור לתורמים לקבלת זיכוי מס על תרומות" },
  { key: "תקנות", label: "תקנות העמותה", icon: ScrollText, description: "תקנון העמותה המאושר ברשם העמותות" },
  { key: "פנקס_חברים", label: "פנקס חברים", icon: Users, description: "רשימת חברי העמותה המעודכנת" },
  { key: "דוחות_שנתיים", label: 'דוחו"ת שנתיים', icon: FileBarChart, description: "דוח כספי ודוח מילולי שנתי לרשם העמותות" },
];

export default function OrgFilePage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState<ComplianceItem | null>(null);

  const fetchData = () => {
    fetch("/api/compliance")
      .then(r => r.json())
      .then(res => {
        if (res.success) setItems(res.data.items ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMatchedItem = (label: string): ComplianceItem | null => {
    return items.find(item =>
      item.name.includes(label) || label.includes(item.name) ||
      item.name.replace(/[^\u0590-\u05FF\s]/g, "").trim() === label.replace(/[^\u0590-\u05FF\s]/g, "").trim()
    ) ?? null;
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "OK") return <CheckCircle2 size={20} className="text-[#16a34a]" />;
    if (status === "WARNING") return <AlertTriangle size={20} className="text-[#d97706]" />;
    return <AlertCircle size={20} className="text-[#ef4444]" />;
  };

  const statusLabel = (status: string) => {
    if (status === "OK") return { text: "תקין", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
    if (status === "WARNING") return { text: "לטיפול", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    if (status === "EXPIRED") return { text: "פג תוקף", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
    return { text: "חסר", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
  };

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="תיק עמותה" subtitle="אישורים, תקנות ודוחות נדרשים" />

      <div className="max-w-[600px]">
        {/* Back link */}
        <Link href="/portal" className="anim-fade-up inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
          <ArrowRight size={14} /> חזרה לדשבורד
        </Link>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3" data-tour="org-file-items">
            {ORG_FILE_ITEMS.map((item, i) => {
              const matched = getMatchedItem(item.label);
              const status = matched?.status ?? "MISSING";
              const st = statusLabel(status);

              return (
                <div
                  key={item.key}
                  className={`anim-fade-up delay-${(i % 7) + 1} bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift transition-all`}
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: st.bg }}>
                        <StatusIcon status={status} />
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-[#1e293b]">{item.label}</div>
                        <div className="text-[12px] text-[#64748b]">{item.description}</div>
                        {matched?.dueDate && (
                          <div className="text-[11px] text-[#64748b] mt-0.5">
                            תוקף: {new Date(matched.dueDate).toLocaleDateString("he-IL")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-lg border"
                        style={{ color: st.color, background: st.bg, borderColor: st.border }}
                      >
                        {st.text}
                      </span>
                      {matched && <HandleNowButton item={matched} onClick={setActionItem} size="sm" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SmartActionsModal item={actionItem} onClose={() => setActionItem(null)} onHandled={fetchData} />
    </div>
  );
}

"use client";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  ArrowRight, Handshake, HeartHandshake, Briefcase,
  Calendar, FileText, CheckCircle2,
} from "lucide-react";

const PROCEDURES = [
  {
    key: "procurement",
    icon: Handshake,
    title: "נוהל התקשרויות",
    description: "נוהל לביצוע התקשרויות עם ספקים ונותני שירותים",
    approvalDate: null as string | null,
    protocolRef: null as string | null,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    key: "support",
    icon: HeartHandshake,
    title: "נוהל תמיכות",
    description: "נוהל לחלוקת תמיכות, מלגות ומענקים",
    approvalDate: null as string | null,
    protocolRef: null as string | null,
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    key: "employment",
    icon: Briefcase,
    title: "נוהל העסקת עובדים",
    description: "נוהל לגיוס, העסקה וסיום העסקת עובדים",
    approvalDate: null as string | null,
    protocolRef: null as string | null,
    color: "#0891b2",
    bg: "#ecfeff",
  },
];

export default function ProceduresPage() {
  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="נהלים" subtitle="נוהלי העמותה ותיעוד אישורם" />

      <div className="max-w-[600px]">
        <Link href="/portal" className="anim-fade-up inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
          <ArrowRight size={14} /> חזרה לדשבורד
        </Link>

        <div className="space-y-3">
          {PROCEDURES.map((proc, i) => (
            <div
              key={proc.key}
              className={`anim-fade-up delay-${i + 1} bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift`}
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: proc.bg }}
                >
                  <proc.icon size={22} style={{ color: proc.color }} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[#1e293b] mb-1">{proc.title}</div>
                  <div className="text-[12px] text-[#64748b] mb-3">{proc.description}</div>

                  {/* Approval info table */}
                  <div className="bg-[#f8f9fc] rounded-xl p-3 border border-[#e8ecf4]/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                        <Calendar size={13} />
                        <span>תאריך אישור</span>
                      </div>
                      {proc.approvalDate ? (
                        <span className="text-[12px] font-semibold text-[#1e293b]">
                          {proc.approvalDate}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded-lg border border-[#fde68a]">
                          טרם אושר
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                        <FileText size={13} />
                        <span>פרוטוקול מאשר</span>
                      </div>
                      {proc.protocolRef ? (
                        <span className="text-[12px] font-semibold text-[#2563eb]">
                          {proc.protocolRef}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded-lg border border-[#fde68a]">
                          לא מתועד
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="anim-fade-up delay-5 mt-5 bg-[#eff6ff] rounded-2xl p-4 border border-[#bfdbfe] flex items-start gap-3">
          <CheckCircle2 size={16} className="text-[#2563eb] flex-shrink-0 mt-0.5" />
          <div className="text-[12px] text-[#1e40af] leading-relaxed">
            נהלים אלו נדרשים לצורך קבלת אישור ניהול תקין. ניתן להעלות את הנהלים המאושרים
            דרך <Link href="/portal/documents" className="font-semibold underline">המסמכים שלי</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}

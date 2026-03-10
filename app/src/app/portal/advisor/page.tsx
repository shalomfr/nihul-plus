"use client";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  ArrowRight, Phone, Mail, MessageCircle, Clock,
  Zap, Settings, Landmark, FileText, BarChart2, Users,
  Calendar, CheckCircle, RefreshCw,
} from "lucide-react";

const SELF_MANAGE_LINKS = [
  { href: "/portal/status", icon: CheckCircle, label: "בדיקת ניהול תקין", color: "#2563eb", bg: "#eff6ff" },
  { href: "/portal/documents", icon: FileText, label: "ניהול מסמכים", color: "#16a34a", bg: "#f0fdf4" },
  { href: "/portal/board", icon: Users, label: "ניהול ועד", color: "#7c3aed", bg: "#f5f3ff" },
  { href: "/portal/banking", icon: Landmark, label: "בנק והוצאות", color: "#0891b2", bg: "#ecfeff" },
  { href: "/portal/bank-sync", icon: RefreshCw, label: "סנכרון בנק", color: "#d97706", bg: "#fffbeb" },
  { href: "/portal/reports", icon: BarChart2, label: "דוחות ותקציב", color: "#2563eb", bg: "#eff6ff" },
  { href: "/portal/calendar", icon: Calendar, label: "לוח שנה", color: "#16a34a", bg: "#f0fdf4" },
];

export default function AdvisorPage() {
  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="מלווה אישי" subtitle="תמיכה מקצועית וניהול עצמאי" />

      <div className="max-w-[600px]">
        <Link href="/portal" className="anim-fade-up inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
          <ArrowRight size={14} /> חזרה לדשבורד
        </Link>

        {/* ─── ADVISOR CONTACT ─── */}
        <div
          className="anim-fade-up delay-1 bg-white rounded-2xl p-6 border border-[#e8ecf4] hover-lift mb-4"
          data-tour="advisor-contact"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
              <MessageCircle size={24} className="text-[#16a34a]" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#1e293b]">המלווה שלך כאן בשבילך</h3>
              <p className="text-[12px] text-[#64748b]">תמיכה מקצועית בכל נושא</p>
            </div>
          </div>

          {/* Contact methods */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50">
              <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                <Phone size={16} className="text-[#2563eb]" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#1e293b]">טלפון</div>
                <div className="text-[12px] text-[#64748b]" dir="ltr">03-000-0000</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50">
              <div className="w-9 h-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                <MessageCircle size={16} className="text-[#16a34a]" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#1e293b]">WhatsApp</div>
                <div className="text-[12px] text-[#64748b]">הודעה מיידית למלווה</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50">
              <div className="w-9 h-9 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                <Mail size={16} className="text-[#7c3aed]" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#1e293b]">אימייל</div>
                <div className="text-[12px] text-[#64748b]">support@mahatefet.co.il</div>
              </div>
            </div>
          </div>

          {/* Response promise */}
          <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#bfdbfe] space-y-2">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-[#2563eb]" />
              <span className="text-[13px] font-bold text-[#1e40af]">התחייבות מענה</span>
            </div>
            <div className="text-[12px] text-[#1e40af] leading-relaxed">
              חזרה תוך <span className="font-bold">24 שעות</span> לכל פנייה.
              <br />למקרים דחופים — <span className="font-bold">מענה מיידי</span> בטלפון ו-WhatsApp.
            </div>
          </div>

          <Link
            href="/portal/contact"
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            <MessageCircle size={16} /> שלח הודעה למלווה
          </Link>
        </div>

        {/* ─── SELF-MANAGEMENT ─── */}
        <div
          className="anim-fade-up delay-3 bg-white rounded-2xl p-6 border-2 border-dashed border-[#e8ecf4] hover-lift"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] flex items-center justify-center">
              <Settings size={24} className="text-[#d97706]" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#1e293b]">ניהול אישי ללא מלווה</h3>
              <p className="text-[12px] text-[#64748b]">כל הכלים שצריך לניהול עצמאי של העמותה</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SELF_MANAGE_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={`anim-fade-scale delay-${(i % 6) + 2} flex flex-col items-center gap-2 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all text-center`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: link.bg }}
                >
                  <link.icon size={16} style={{ color: link.color }} />
                </div>
                <span className="text-[11px] font-medium text-[#1e293b] leading-tight">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

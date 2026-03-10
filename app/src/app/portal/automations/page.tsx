"use client";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  Zap, Sun, Heart, BarChart2, Shield, Mail, FileCheck,
  ArrowRight, Loader2, CheckCircle, AlertCircle,
} from "lucide-react";

type AutomationAction = {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  description: string;
  action: string;
  confirmText?: string;
};

const AUTOMATIONS: AutomationAction[] = [
  {
    id: "morning_digest",
    icon: Sun,
    color: "#d97706",
    bg: "#fef3c7",
    title: "☀️ שלח דיג׳סט בוקר עכשיו",
    description: "שלח מייל + WhatsApp עם סיכום יומי לכל המנהלים",
    action: "morning_digest",
    confirmText: "לשלוח דיג׳סט בוקר לכל המנהלים עכשיו?",
  },
  {
    id: "compliance_reminders",
    icon: Shield,
    color: "#7c3aed",
    bg: "#f5f3ff",
    title: "🏛️ שלח תזכורות ניהול תקין עכשיו",
    description: "שלח תזכורות על דדליינים קרובים לכל מנהלי הארגון",
    action: "compliance_reminders",
    confirmText: "לשלוח תזכורות ציות לכל המנהלים?",
  },
  {
    id: "weekly_report",
    icon: BarChart2,
    color: "#2563eb",
    bg: "#eff6ff",
    title: "📊 שלח דוח שבועי עכשיו",
    description: "שלח דוח שבועי מרוכז לועד הניהול",
    action: "weekly_report",
    confirmText: "לשלוח דוח שבועי לכל הועד?",
  },
  {
    id: "thank_donors",
    icon: Heart,
    color: "#db2777",
    bg: "#fdf2f8",
    title: "💌 שלח תודה לכל תורמי השנה",
    description: "שלח מייל תודה אישי לכל מי שתרם השנה",
    action: "thank_donors",
    confirmText: "לשלוח מיילי תודה לכל תורמי השנה?",
  },
  {
    id: "send_missing_receipts",
    icon: FileCheck,
    color: "#16a34a",
    bg: "#f0fdf4",
    title: "💼 שלח קבלות חסרות",
    description: "מצא תרומות ללא קבלת סעיף 46 ושלח אותן לתורמים",
    action: "send_missing_receipts",
    confirmText: "לשלוח קבלות לכל תורמים שעדיין לא קיבלו?",
  },
  {
    id: "send_annual_report",
    icon: Mail,
    color: "#0891b2",
    bg: "#ecfeff",
    title: "📧 שלח דוח שנתי לועד",
    description: "יצור ושלח דוח שנתי מלא לכל חברי הועד",
    action: "weekly_report",
    confirmText: "לשלוח דוח שנתי לכל הועד?",
  },
];

type RunResult = { action: string; ok: boolean; message: string };

export default function AutomationsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<RunResult[]>([]);
  const [confirmAction, setConfirmAction] = useState<AutomationAction | null>(null);

  const runAction = async (automation: AutomationAction) => {
    setRunning(automation.id);
    setConfirmAction(null);
    try {
      const res = await fetch("/api/automations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: automation.action }),
      });
      const data = await res.json();
      setResults(prev => [
        { action: automation.title, ok: res.ok, message: res.ok ? (data.data?.result ?? "בוצע") : (data.error ?? "שגיאה") },
        ...prev.slice(0, 9),
      ]);
    } catch {
      setResults(prev => [
        { action: automation.title, ok: false, message: "שגיאת רשת" },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8" dir="rtl">
      <Topbar title="מרכז אוטומציות" subtitle="הפעל פעולות ידנית בלחיצה אחת" />

      <Link href="/portal" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
        <ArrowRight size={14} /> חזרה לדשבורד
      </Link>

      <div className="bg-[#eff6ff] rounded-2xl border border-[#bfdbfe] p-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-[#1e40af]">
          <Zap size={16} />
          <span>כל הפעולות מתבצעות ברקע. תוצאות יופיעו למטה.</span>
        </div>
      </div>

      {/* Results log */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8ecf4] mb-6 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-3 border-b border-[#f1f5f9] text-sm font-semibold text-[#1e293b]">📋 לוג פעולות</div>
          <div className="divide-y divide-[#f1f5f9]">
            {results.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                {r.ok
                  ? <CheckCircle size={16} className="text-[#16a34a] flex-shrink-0" />
                  : <AlertCircle size={16} className="text-[#ef4444] flex-shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-[#1e293b]">{r.action}</div>
                  <div className="text-xs text-[#64748b]">{r.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="automations-cards">
        {AUTOMATIONS.map((automation) => (
          <div
            key={automation.id}
            className="bg-white rounded-2xl border border-[#e8ecf4] p-5"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: automation.bg }}>
                <automation.icon size={22} style={{ color: automation.color }} />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-[#1e293b] mb-0.5">{automation.title}</div>
                <div className="text-[12px] text-[#64748b] mb-3">{automation.description}</div>
                <button
                  onClick={() => setConfirmAction(automation)}
                  disabled={running === automation.id}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fc] hover:bg-[#eff6ff] border border-[#e8ecf4] hover:border-[#2563eb] rounded-xl text-sm font-medium text-[#1e293b] hover:text-[#2563eb] transition-all disabled:opacity-50"
                >
                  {running === automation.id
                    ? <><Loader2 size={14} className="animate-spin" />מבצע...</>
                    : <><Zap size={14} />הפעל עכשיו</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center" dir="rtl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: confirmAction.bg }}>
              <confirmAction.icon size={28} style={{ color: confirmAction.color }} />
            </div>
            <h3 className="text-lg font-bold text-[#1e293b] mb-2">{confirmAction.title}</h3>
            <p className="text-sm text-[#64748b] mb-6">{confirmAction.confirmText}</p>
            <div className="flex gap-3">
              <button
                onClick={() => runAction(confirmAction)}
                className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                כן, הפעל
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 border border-[#e8ecf4] text-[#64748b] font-medium py-2.5 rounded-xl hover:bg-[#f8f9fc]"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

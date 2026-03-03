"use client";

import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#fecaca] p-8 max-w-md w-full text-center" style={{ boxShadow: "0 4px 24px rgba(220,38,38,0.08)" }}>
        <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-[#ef4444]" />
        </div>
        <h2 className="text-[20px] font-bold text-[#1e293b] mb-2">שגיאה בטעינת הדף</h2>
        <p className="text-[14px] text-[#64748b] mb-6 leading-relaxed">
          אירעה שגיאה. ניתן לנסות שוב או לחזור לדף הניהול.
        </p>
        {error.digest && (
          <p className="text-[11px] text-[#94a3b8] mb-4 font-mono" dir="ltr">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold transition-all hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}
          >
            <RefreshCw size={16} />
            נסה שוב
          </button>
          <a
            href="/admin"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[#64748b] text-[14px] font-medium border border-[#e8ecf4] hover:bg-[#f8f9fc] transition-all"
          >
            <ArrowRight size={16} />
            חזרה לניהול
          </a>
        </div>
      </div>
    </div>
  );
}

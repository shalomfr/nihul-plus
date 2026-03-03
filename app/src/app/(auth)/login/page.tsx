"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ─── Envelope Animation Component (infinite loop) ─── */
function EnvelopeAnimation() {
  return (
    <div className="envelope-scene">
      <div className="env">
        {/* paper with checkmark – z-2: behind front fold, slides up to emerge */}
        <div className="env-paper">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="12" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" className="env-check-circle" />
            <path d="M9 15.5L13 19.5L21 10.5" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="env-check-mark" />
          </svg>
        </div>

        {/* envelope back wall – z-1: behind everything */}
        <div className="env-back" />

        {/* envelope front V-fold – z-3: covers paper when inside */}
        <div className="env-front" />

        {/* flap – z-4: top triangle that opens/closes */}
        <div className="env-flap-wrap">
          <div className="env-flap" />
        </div>
      </div>

      <style>{`
        .envelope-scene {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          height: 120px;
          margin-bottom: 8px;
        }

        .env {
          position: relative;
          width: 104px;
          height: 78px;
        }

        /* ── back wall ── */
        .env-back {
          position: absolute;
          left: 0;
          right: 0;
          top: 18px;
          bottom: 0;
          background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%);
          border-radius: 4px 4px 12px 12px;
          box-shadow: 0 6px 28px rgba(37, 99, 235, 0.18);
          z-index: 1;
        }

        /* ── front V fold ── covers paper at rest */
        .env-front {
          position: absolute;
          top: 18px;
          left: 0;
          width: 104px;
          height: 60px;
          z-index: 3;
          clip-path: polygon(0 10%, 50% 78%, 100% 10%, 100% 100%, 0 100%);
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-radius: 0 0 12px 12px;
        }

        /* ── paper ── starts fully hidden behind front fold */
        .env-paper {
          position: absolute;
          left: 50%;
          width: 52px;
          height: 44px;
          margin-left: -26px;
          bottom: 6px;
          background: #ffffff;
          border: 1.5px solid #e8ecf4;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          animation: paperSlide 5s ease-in-out infinite, paperZ 5s step-end infinite;
        }

        /* ── flap wrapper ── */
        .env-flap-wrap {
          position: absolute;
          top: 18px;
          left: 0;
          width: 104px;
          height: 0;
          z-index: 4;
          perspective: 400px;
        }

        .env-flap {
          width: 0;
          height: 0;
          border-left: 52px solid transparent;
          border-right: 52px solid transparent;
          border-top: 30px solid #bfdbfe;
          transform-origin: top center;
          animation: flapOpen 5s ease-in-out infinite;
        }

        /* ── checkmark parts ── */
        .env-check-circle {
          opacity: 0;
          animation: checkFade 5s ease infinite;
        }

        .env-check-mark {
          stroke-dasharray: 26;
          stroke-dashoffset: 26;
          animation: checkDraw 5s ease infinite;
        }

        /* ═══════ KEYFRAMES ═══════ */

        /* Flap: closed → open → stay → close
           Opens FIRST so paper can emerge */
        @keyframes flapOpen {
          0%, 5%    { transform: rotateX(0deg); }
          20%       { transform: rotateX(170deg); }
          72%       { transform: rotateX(170deg); }
          87%, 100% { transform: rotateX(0deg); }
        }

        /* Paper slide: smooth transform only */
        @keyframes paperSlide {
          0%, 20%   { transform: translateY(0); }
          38%       { transform: translateY(-50px); }
          62%       { transform: translateY(-50px); }
          80%, 100% { transform: translateY(0); }
        }

        /* Paper z-index: stays behind V-fold while inside,
           jumps in front only after emerging above the envelope */
        @keyframes paperZ {
          0%        { z-index: 2; }
          28%       { z-index: 5; }
          74%       { z-index: 2; }
        }

        /* Check circle: appears when paper is up */
        @keyframes checkFade {
          0%, 34%   { opacity: 0; }
          42%, 58%  { opacity: 1; }
          66%, 100% { opacity: 0; }
        }

        /* Check mark: draws in when paper is up */
        @keyframes checkDraw {
          0%, 36%   { stroke-dashoffset: 26; }
          48%, 56%  { stroke-dashoffset: 0; }
          68%, 100% { stroke-dashoffset: 26; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "אימייל או סיסמה שגויים" : res.error);
        setLoading(false);
        return;
      }

      if (res?.ok) {
        const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
        if (safeCallback) {
          router.push(safeCallback);
        } else {
          const sessionRes = await fetch("/api/auth/session");
          const session = await sessionRes.json();
          const role = session?.user?.role;
          if (role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/portal");
          }
        }
        router.refresh();
        return;
      }
    } catch {
      setError("שגיאה בהתחברות");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#f8f9fc" }}>
      {/* background decoration */}
      <div className="absolute top-0 left-0 right-0 h-[45%]" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a5f 100%)" }}>
        <div className="absolute top-[-60px] left-[-40px] w-[200px] h-[200px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-80px] right-[10%] w-[300px] h-[300px] rounded-full bg-white/[0.03]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* card */}
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-[#e8ecf4] p-8">
          {/* envelope animation as logo */}
          <EnvelopeAnimation />

          <div className="text-center mb-6">
            <h1 className="text-[24px] font-extrabold text-[#1e293b]">מעטפת</h1>
            <p className="text-[13px] text-[#64748b] mt-1">מעטפת ניהולית בע״מ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f2] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb] transition-all"
                placeholder="you@example.com"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e2e8f2] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb] transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}
            >
              {loading ? "מתחבר..." : "התחבר"}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748b] mt-6">
            אין לך חשבון?{" "}
            <Link href="/register" className="text-[#2563eb] font-semibold hover:underline">
              הרשמה
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

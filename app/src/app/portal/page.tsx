"use client";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { FolderOpen, BookOpen, Building2, UserCircle, ArrowLeft } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const CARDS = [
  {
    href: "/portal/org-file",
    icon: FolderOpen,
    title: "תיק עמותה",
    subtitle: "אישורים, תקנות ודוחות",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    href: "/portal/procedures",
    icon: BookOpen,
    title: "נהלים",
    subtitle: "נהלי התקשרויות, תמיכות והעסקה",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    href: "/portal/institutions",
    icon: Building2,
    title: "מוסדות העמותה",
    subtitle: "ועד מנהל, ביקורת ואסיפה",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    href: "/portal/advisor",
    icon: UserCircle,
    title: "מלווה אישי",
    subtitle: "תמיכה, ייעוץ וניהול עצמאי",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
];

export default function PortalHomePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "משתמש";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with user info */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="anim-fade-down">
              <h1 className="text-[32px] md:text-[42px] font-bold text-[#1e293b] leading-tight">
                שלום, {userName.split(' ')[0]} 👋
              </h1>
              <p className="text-[14px] md:text-[15px] text-[#64748b] mt-2">
                ברוך הבא לפורטל הניהול שלך · בחר קטגוריה להמשך
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="anim-fade-down delay-1 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8ecf4] hover:border-[#ef4444]/30 hover:bg-[#fef2f2] transition-all text-[13px] font-medium text-[#64748b] hover:text-[#ef4444]"
            >
              <ArrowLeft size={16} />
              התנתק
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 px-4 md:px-8 pb-8">
        <div className="max-w-[800px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {CARDS.map((card, i) => (
              <Link
                key={card.href}
                href={card.href}
                className="anim-fade-scale group bg-white rounded-3xl p-7 md:p-8 border-2 border-[#e8ecf4] hover-lift transition-all relative overflow-hidden"
                style={{
                  boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                  animationDelay: `${i * 0.08}s`
                }}
              >
                {/* Gradient overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}08 0%, transparent 100%)`
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: card.bg,
                      boxShadow: `0 8px 24px ${card.color}20`
                    }}
                  >
                    <card.icon
                      size={32}
                      style={{ color: card.color }}
                      strokeWidth={1.8}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  <h3 className="text-[19px] md:text-[21px] font-bold text-[#1e293b] mb-2 group-hover:text-opacity-90 transition-all">
                    {card.title}
                  </h3>

                  <p className="text-[13px] md:text-[14px] text-[#64748b] leading-relaxed">
                    {card.subtitle}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0" style={{ color: card.color }}>
                    <span>כנס</span>
                    <ArrowLeft size={14} />
                  </div>
                </div>

                {/* Decorative corner */}
                <div
                  className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500"
                  style={{ background: card.color }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 md:px-8 pb-6 text-center">
        <p className="text-[12px] text-[#94a3b8] anim-fade-up delay-4">
          💡 לחץ על כל כרטיס כדי להיכנס לאזור המתאים
        </p>
      </div>
    </div>
  );
}

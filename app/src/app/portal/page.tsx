"use client";
import Link from "next/link";
import {
  FolderOpen,
  BookOpen,
  Building2,
  UserCircle,
  CheckCircle,
  Calendar,
  FileText,
  BarChart2,
  MessageCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const MAIN_CARDS = [
  {
    href: "/portal/org-file",
    icon: FolderOpen,
    title: "תיק עמותה",
    subtitle: "אישורים, תקנות ודוחות רשמיים מרוכזים במקום אחד לניהול מסודר.",
    highlighted: false,
  },
  {
    href: "/portal/procedures",
    icon: BookOpen,
    title: "נהלים ומדיניות",
    subtitle: "נהלי התקשרויות, תמיכות והעסקה מעודכנים ומאושרים לפעילות תקינה.",
    highlighted: true,
  },
  {
    href: "/portal/institutions",
    icon: Building2,
    title: "מוסדות העמותה",
    subtitle: "ניהול ועד מנהל, ועדת ביקורת ואסיפה כללית בלחיצה אחת.",
    highlighted: false,
  },
];

const FEATURES = [
  {
    href: "/portal/status",
    icon: CheckCircle,
    title: "מעקב תאימות",
    subtitle: "בדיקה מיידית של מצב העמותה.",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    href: "/portal/advisor",
    icon: UserCircle,
    title: "מלווה אישי",
    subtitle: "ייעוץ וליווי מקצועי צמוד.",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    href: "/portal/documents",
    icon: Shield,
    title: "אבטחת מסמכים",
    subtitle: "מסמכים מוגנים ומאובטחים.",
    color: "#1e293b",
    bg: "#f8f9fc",
  },
  {
    href: "/portal/calendar",
    icon: Calendar,
    title: "יומן חכם",
    subtitle: "תזכורות ולוח זמנים מותאם.",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    href: "/portal/reports",
    icon: BarChart2,
    title: "דוחות מתקדמים",
    subtitle: "תקציב, ניתוחים ודיווח שוטף.",
    color: "#d97706",
    bg: "#fffbeb",
  },
];

export default function PortalHomePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "משתמש";

  return (
    <div className="min-h-screen flex flex-col items-center py-6 md:py-10 px-4">
      {/* User greeting */}
      <div className="w-full max-w-[900px] mb-6 md:mb-8 flex items-center justify-between anim-fade-down">
        <div>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#1e293b]">
            שלום, {userName.split(" ")[0]}
          </h1>
          <p className="text-[13px] md:text-[14px] text-[#94a3b8] mt-1">
            ברוך הבא לפורטל הניהול שלך
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8ecf4] hover:border-[#ef4444]/30 hover:bg-[#fef2f2] transition-all text-[13px] font-medium text-[#64748b] hover:text-[#ef4444]"
        >
          <ArrowLeft size={16} />
          התנתק
        </button>
      </div>

      {/* Main offerings section */}
      <div className="w-full max-w-[900px] bg-white rounded-[28px] border border-[#e8ecf4] p-6 md:p-10 mb-8 md:mb-10 anim-fade-up"
        style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.03)" }}>

        {/* Section header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-[26px] md:text-[34px] font-extrabold text-[#1e293b] mb-3"
            style={{ fontFamily: "'Heebo', sans-serif" }}>
            מה אנחנו מציעים
          </h2>
          <p className="text-[13px] md:text-[14px] text-[#94a3b8] leading-relaxed">
            תשתית ניהול מתקדמת{" "}
            <span className="text-[#1e293b] font-semibold">לניהול עמותה חכם</span>
            <br />
            מהירות, שקיפות ועמידה בדרישות הרגולציה.
          </p>
        </div>

        {/* 3 Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {MAIN_CARDS.map((card, i) => (
            <Link
              key={card.href}
              href={card.href}
              className={`anim-fade-scale group relative rounded-[20px] p-6 md:p-7 transition-all duration-300 flex flex-col
                ${card.highlighted
                  ? "bg-[#1e293b] text-white border-2 border-[#334155] hover:border-[#475569] md:scale-105 md:-translate-y-1"
                  : "bg-[#f8f9fc] text-[#1e293b] border-2 border-[#e8ecf4] hover:border-[#cbd5e1] hover:bg-white"
                }`}
              style={{
                animationDelay: `${i * 0.1}s`,
                boxShadow: card.highlighted
                  ? "0 12px 40px rgba(30,41,59,0.25)"
                  : "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              {/* Card title */}
              <h3 className={`text-[16px] md:text-[17px] font-bold mb-2 ${card.highlighted ? "text-white" : "text-[#1e293b]"}`}>
                {card.title}
              </h3>

              {/* Card description */}
              <p className={`text-[12px] md:text-[13px] leading-relaxed flex-1 ${card.highlighted ? "text-[#94a3b8]" : "text-[#64748b]"}`}>
                {card.subtitle}
              </p>

              {/* Icon area */}
              <div className="mt-5 flex justify-center">
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                    ${card.highlighted
                      ? "bg-[#334155]"
                      : "bg-white border border-[#e8ecf4]"
                    }`}
                  style={{
                    boxShadow: card.highlighted
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  <card.icon
                    size={32}
                    strokeWidth={1.6}
                    className={card.highlighted ? "text-white" : "text-[#2563eb]"}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features section */}
      <div className="w-full max-w-[900px] text-center mb-6 md:mb-8 anim-fade-up delay-2">
        <h2 className="text-[22px] md:text-[28px] font-extrabold text-[#1e293b] mb-8"
          style={{ fontFamily: "'Heebo', sans-serif" }}>
          מה מניע כל פעולה
        </h2>

        {/* Feature badges - row 1 (3 items) */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-3 md:mb-4">
          {FEATURES.slice(0, 3).map((feat, i) => (
            <Link
              key={feat.href}
              href={feat.href}
              className="anim-fade-scale group flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-[#e8ecf4] hover:border-[#cbd5e1] hover-lift transition-all min-w-[200px] md:min-w-[240px]"
              style={{
                animationDelay: `${0.3 + i * 0.08}s`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: feat.bg }}
              >
                <feat.icon size={20} style={{ color: feat.color }} strokeWidth={1.8} />
              </div>
              <div className="text-right">
                <div className="text-[13px] md:text-[14px] font-bold text-[#1e293b]">
                  {feat.title}
                </div>
                <div className="text-[11px] md:text-[12px] text-[#94a3b8]">
                  {feat.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Feature badges - row 2 (2 items) */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {FEATURES.slice(3).map((feat, i) => (
            <Link
              key={feat.href}
              href={feat.href}
              className="anim-fade-scale group flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-[#e8ecf4] hover:border-[#cbd5e1] hover-lift transition-all min-w-[200px] md:min-w-[240px]"
              style={{
                animationDelay: `${0.55 + i * 0.08}s`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: feat.bg }}
              >
                <feat.icon size={20} style={{ color: feat.color }} strokeWidth={1.8} />
              </div>
              <div className="text-right">
                <div className="text-[13px] md:text-[14px] font-bold text-[#1e293b]">
                  {feat.title}
                </div>
                <div className="text-[11px] md:text-[12px] text-[#94a3b8]">
                  {feat.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-4 anim-fade-up delay-5">
        <p className="text-[11px] text-[#cbd5e1]">
          פורטל ניהול עמותות · מעטפת
        </p>
      </div>
    </div>
  );
}

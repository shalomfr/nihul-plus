"use client";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import { FolderOpen, BookOpen, Building2, UserCircle } from "lucide-react";

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
  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="הפורטל שלי" subtitle="ברוך הבא · בחר קטגוריה" />

      <div className="max-w-[600px] mx-auto mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {CARDS.map((card, i) => (
            <Link
              key={card.href}
              href={card.href}
              className={`anim-fade-scale delay-${i + 1} group bg-white rounded-2xl p-6 border-2 border-[#e8ecf4] hover-lift transition-all hover:border-[${card.color}]/30`}
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ background: card.bg }}
              >
                <card.icon size={28} style={{ color: card.color }} strokeWidth={1.8} />
              </div>
              <h3 className="text-[17px] font-bold text-[#1e293b] mb-1">{card.title}</h3>
              <p className="text-[13px] text-[#64748b]">{card.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

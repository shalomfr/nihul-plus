"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  ArrowRight, Users, ShieldCheck, Megaphone, UserCheck,
} from "lucide-react";

type BoardMember = {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
};

const INSTITUTIONS = [
  {
    key: "board",
    icon: Users,
    title: "ועד מנהל",
    description: "הגוף המנהל של העמותה — אחראי על ניהול שוטף וקבלת החלטות",
    color: "#2563eb",
    bg: "#eff6ff",
    href: "/portal/board",
  },
  {
    key: "audit",
    icon: ShieldCheck,
    title: "ועדת ביקורת",
    description: "גוף הפיקוח הפנימי — בודק את תקינות פעולות הועד",
    color: "#7c3aed",
    bg: "#f5f3ff",
    href: null,
  },
  {
    key: "assembly",
    icon: Megaphone,
    title: "אסיפה כללית",
    description: "הגוף העליון של העמותה — כולל את כל חברי העמותה",
    color: "#0891b2",
    bg: "#ecfeff",
    href: null,
  },
];

export default function InstitutionsPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/portal")
      .then(r => r.json())
      .then(res => {
        if (res.success) setMembers(res.data.board?.members ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeMembers = members.filter(m => m.isActive);

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="מוסדות העמותה" subtitle="ועד מנהל, ביקורת ואסיפה כללית" />

      <div className="max-w-[600px]">
        <Link href="/portal" className="anim-fade-up inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
          <ArrowRight size={14} /> חזרה לדשבורד
        </Link>

        <div className="space-y-3">
          {INSTITUTIONS.map((inst, i) => (
            <div
              key={inst.key}
              className={`anim-fade-up delay-${i + 1} bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift`}
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: inst.bg }}
                >
                  <inst.icon size={22} style={{ color: inst.color }} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[15px] font-bold text-[#1e293b]">{inst.title}</div>
                    {inst.key === "board" && !loading && (
                      <span className="text-[11px] font-semibold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-lg border border-[#bfdbfe]">
                        {activeMembers.length} חברים
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#64748b] mb-3">{inst.description}</div>

                  {/* Board members preview */}
                  {inst.key === "board" && !loading && activeMembers.length > 0 && (
                    <div className="bg-[#f8f9fc] rounded-xl p-3 border border-[#e8ecf4]/50 space-y-1.5">
                      {activeMembers.slice(0, 5).map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCheck size={13} className="text-[#16a34a]" />
                            <span className="text-[12px] font-medium text-[#1e293b]">{member.name}</span>
                          </div>
                          <span className="text-[11px] text-[#64748b]">{member.role}</span>
                        </div>
                      ))}
                      {activeMembers.length > 5 && (
                        <div className="text-[11px] text-[#64748b] text-center pt-1">
                          +{activeMembers.length - 5} נוספים
                        </div>
                      )}
                    </div>
                  )}

                  {inst.href && (
                    <Link
                      href={inst.href}
                      className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-[#2563eb] hover:underline"
                    >
                      ניהול מלא →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
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
  TrendingUp,
  AlertTriangle,
  Clock,
  Landmark,
  Users,
  Bell,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

interface PortalStats {
  compliance: {
    score: number;
    total: number;
    ok: number;
    warning: number;
    expired: number;
    missing: number;
    expiringSoon: number;
    items: Array<{
      id: string;
      name: string;
      status: string;
      dueDate: string | null;
      category: string;
    }>;
    categoryScores: Array<{
      category: string;
      label: string;
      ok: number;
      total: number;
      score: number;
    }>;
  };
  financial: {
    totalDonationsThisYear: number;
    donationCount: number;
    totalDonors: number;
    budgets: Array<{
      id: string;
      year: number;
      name: string;
      totalBudget: number;
      totalSpent: number;
      percentage: number;
    }>;
  };
  board: {
    members: Array<{ id: string; name: string; role: string }>;
    upcomingMeetings: Array<{
      id: string;
      title: string;
      date: string;
      location: string;
    }>;
  };
  volunteers: { activeCount: number };
  documents: { count: number };
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
  }>;
  banking: {
    totalBalance: number;
    accounts: number;
    totalExpenses: number;
    expenseCount: number;
    isConnected: boolean;
  };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(n);
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (score >= 50) return { text: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

const QUICK_ACTIONS = [
  { href: "/portal/org-file", icon: FolderOpen, label: "תיק עמותה", color: "#2563eb", bg: "#eff6ff" },
  { href: "/portal/procedures", icon: BookOpen, label: "נהלים", color: "#7c3aed", bg: "#f5f3ff" },
  { href: "/portal/institutions", icon: Building2, label: "מוסדות", color: "#0891b2", bg: "#ecfeff" },
  { href: "/portal/documents", icon: FileText, label: "מסמכים", color: "#1e293b", bg: "#f8f9fc" },
  { href: "/portal/banking", icon: Landmark, label: "בנק", color: "#16a34a", bg: "#f0fdf4" },
  { href: "/portal/contact", icon: MessageCircle, label: "פנה למלווה", color: "#d97706", bg: "#fffbeb" },
];

export default function PortalHomePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "משתמש";
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats/portal");
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchStats();
    else setLoading(false);
  }, [session]);

  const scoreColor = stats ? getScoreColor(stats.compliance.score) : null;

  return (
    <div className="min-h-screen flex flex-col items-center py-6 md:py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-[960px] mb-6 md:mb-8 flex items-center justify-between anim-fade-down">
        <div>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#1e293b]">
            שלום, {userName.split(" ")[0]}
          </h1>
          <p className="text-[13px] md:text-[14px] text-[#94a3b8] mt-1">
            הנה סיכום המצב של העמותה שלך
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

      {/* ═══ MAIN STATS SECTION ═══ */}
      <div className="w-full max-w-[960px] bg-white rounded-[28px] border border-[#e8ecf4] p-6 md:p-8 mb-5 anim-fade-up"
        style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.03)" }}>

        <div className="text-center mb-7">
          <h2 className="text-[22px] md:text-[28px] font-extrabold text-[#1e293b] mb-2">
            המצב שלי
          </h2>
          <p className="text-[13px] text-[#94a3b8]">
            סקירה כללית של <span className="text-[#1e293b] font-semibold">תאימות, פיננסים ופעילות</span>
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[180px] rounded-[20px] skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {/* Compliance Card - HIGHLIGHTED */}
            <Link
              href="/portal/status"
              className="group relative rounded-[20px] p-6 bg-[#1e293b] text-white border-2 border-[#334155] hover:border-[#475569] transition-all md:scale-[1.03] md:-translate-y-1 anim-fade-scale"
              style={{ boxShadow: "0 12px 40px rgba(30,41,59,0.25)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-bold">תאימות רגולטורית</span>
                <ChevronLeft size={18} className="text-[#64748b] group-hover:text-white transition-colors" />
              </div>

              {/* Score circle */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#334155] transition-transform duration-300 group-hover:scale-110"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                >
                  <span className="text-[24px] font-black" style={{ color: scoreColor?.text ?? "#fff" }}>
                    {stats?.compliance.score ?? 0}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] text-[#94a3b8]">ציון כולל</div>
                  <div className="text-[13px] font-semibold">
                    {(stats?.compliance.score ?? 0) >= 80 ? "מצב תקין" :
                     (stats?.compliance.score ?? 0) >= 50 ? "דורש תשומת לב" : "דורש טיפול"}
                  </div>
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex gap-3 text-[11px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  <span className="text-[#94a3b8]">תקין {stats?.compliance.ok ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                  <span className="text-[#94a3b8]">אזהרה {stats?.compliance.warning ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
                  <span className="text-[#94a3b8]">חסר {(stats?.compliance.expired ?? 0) + (stats?.compliance.missing ?? 0)}</span>
                </div>
              </div>
            </Link>

            {/* Financial Card */}
            <Link
              href="/portal/reports"
              className="group relative rounded-[20px] p-6 bg-[#f8f9fc] border-2 border-[#e8ecf4] hover:border-[#cbd5e1] hover:bg-white transition-all anim-fade-scale delay-1"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-bold text-[#1e293b]">סיכום פיננסי</span>
                <ChevronLeft size={18} className="text-[#cbd5e1] group-hover:text-[#64748b] transition-colors" />
              </div>

              <div className="mb-4">
                <div className="text-[11px] text-[#94a3b8] mb-1">יתרה כוללת</div>
                <div className="text-[22px] font-black text-[#1e293b]">
                  {stats ? formatCurrency(stats.banking.totalBalance) : "—"}
                </div>
              </div>

              <div className="flex gap-4 text-[11px]">
                <div>
                  <div className="text-[#94a3b8]">תרומות השנה</div>
                  <div className="text-[13px] font-bold text-[#16a34a]">
                    {stats ? formatCurrency(stats.financial.totalDonationsThisYear) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[#94a3b8]">הוצאות</div>
                  <div className="text-[13px] font-bold text-[#1e293b]">
                    {stats ? formatCurrency(stats.banking.totalExpenses) : "—"}
                  </div>
                </div>
              </div>

              {/* Icon */}
              <div className="mt-4 flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#e8ecf4] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <TrendingUp size={26} className="text-[#2563eb]" strokeWidth={1.6} />
                </div>
              </div>
            </Link>

            {/* Activity Card */}
            <Link
              href="/portal/board"
              className="group relative rounded-[20px] p-6 bg-[#f8f9fc] border-2 border-[#e8ecf4] hover:border-[#cbd5e1] hover:bg-white transition-all anim-fade-scale delay-2"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-bold text-[#1e293b]">פעילות שוטפת</span>
                <ChevronLeft size={18} className="text-[#cbd5e1] group-hover:text-[#64748b] transition-colors" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                    <Users size={16} className="text-[#2563eb]" />
                  </div>
                  <div>
                    <div className="text-[12px] text-[#94a3b8]">חברי ועד</div>
                    <div className="text-[14px] font-bold text-[#1e293b]">{stats?.board.members.length ?? 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                    <UserCircle size={16} className="text-[#16a34a]" />
                  </div>
                  <div>
                    <div className="text-[12px] text-[#94a3b8]">מתנדבים פעילים</div>
                    <div className="text-[14px] font-bold text-[#1e293b]">{stats?.volunteers.activeCount ?? 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
                    <FileText size={16} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <div className="text-[12px] text-[#94a3b8]">מסמכים</div>
                    <div className="text-[14px] font-bold text-[#1e293b]">{stats?.documents.count ?? 0}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ═══ ALERTS & UPCOMING ═══ */}
      {stats && (stats.compliance.expiringSoon > 0 || stats.board.upcomingMeetings.length > 0 || stats.notifications.length > 0) && (
        <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 anim-fade-up delay-2">

          {/* Upcoming items */}
          {(stats.compliance.expiringSoon > 0 || stats.board.upcomingMeetings.length > 0) && (
            <div className="bg-white rounded-[20px] border border-[#e8ecf4] p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[#d97706]" />
                <h3 className="text-[15px] font-bold text-[#1e293b]">קרוב ובא</h3>
              </div>

              <div className="space-y-2.5">
                {stats.compliance.expiringSoon > 0 && (
                  <Link href="/portal/status" className="flex items-center gap-3 p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a] hover:bg-[#fef3c7] transition-all group">
                    <AlertTriangle size={16} className="text-[#d97706] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-[#92400e]">
                        {stats.compliance.expiringSoon} פריטים עומדים לפוג
                      </div>
                      <div className="text-[11px] text-[#b45309]">דורש טיפול ב-30 יום הקרובים</div>
                    </div>
                    <ChevronLeft size={16} className="text-[#d97706] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}

                {stats.board.upcomingMeetings.slice(0, 2).map((meeting) => (
                  <Link key={meeting.id} href="/portal/board" className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4] hover:bg-[#eff6ff] transition-all group">
                    <Calendar size={16} className="text-[#2563eb] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-[#1e293b]">{meeting.title}</div>
                      <div className="text-[11px] text-[#94a3b8]">
                        {new Date(meeting.date).toLocaleDateString("he-IL")}
                        {meeting.location ? ` · ${meeting.location}` : ""}
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-[#cbd5e1] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {stats.notifications.length > 0 && (
            <div className="bg-white rounded-[20px] border border-[#e8ecf4] p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Bell size={18} className="text-[#2563eb]" />
                <h3 className="text-[15px] font-bold text-[#1e293b]">התראות אחרונות</h3>
              </div>

              <div className="space-y-2.5">
                {stats.notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${notif.isRead ? "bg-[#f8f9fc] border-[#e8ecf4]" : "bg-[#eff6ff] border-[#bfdbfe]"}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.isRead ? "bg-[#cbd5e1]" : "bg-[#2563eb]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#1e293b] truncate">{notif.title}</div>
                      <div className="text-[11px] text-[#94a3b8] truncate">{notif.message}</div>
                      <div className="text-[10px] text-[#cbd5e1] mt-1">{timeAgo(notif.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="w-full max-w-[960px] text-center mb-6 anim-fade-up delay-3">
        <h2 className="text-[18px] md:text-[22px] font-extrabold text-[#1e293b] mb-5">
          גישה מהירה
        </h2>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className="anim-fade-scale group flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 border border-[#e8ecf4] hover:border-[#cbd5e1] hover-lift transition-all"
              style={{
                animationDelay: `${0.4 + i * 0.06}s`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: action.bg }}
              >
                <action.icon size={18} style={{ color: action.color }} strokeWidth={1.8} />
              </div>
              <span className="text-[13px] font-bold text-[#1e293b]">{action.label}</span>
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

"use client";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, AlertTriangle, AlertCircle,
  Calendar, FileText, MessageCircle,
  X, Shield, ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";

/* ── types ── */
type ComplianceItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
};

type BoardMeeting = {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
};

type CategoryScore = {
  category: string;
  label: string;
  ok: number;
  total: number;
  score: number;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type PortalData = {
  compliance: {
    score: number;
    total: number;
    ok: number;
    warning: number;
    expired: number;
    missing: number;
    expiringSoon: number;
    items: ComplianceItem[];
    categoryScores?: CategoryScore[];
  };
  financial: {
    totalDonationsThisYear: number;
    donationCount: number;
    totalDonors: number;
    budgets: unknown[];
  };
  board: {
    members: unknown[];
    upcomingMeetings: BoardMeeting[];
  };
  volunteers: { activeCount: number };
  documents: { count: number };
  notifications: NotificationItem[];
};

type Status = "green" | "orange" | "red";

const CATEGORY_LABELS: Record<string, string> = {
  FOUNDING_DOCS: "מסמכי יסוד",
  ANNUAL_OBLIGATIONS: "חובות שנתיות לרשם",
  TAX_APPROVALS: "אישורים מרשות המסים",
  FINANCIAL_MGMT: "ניהול כספי שוטף",
  DISTRIBUTION_DOCS: "תיעוד חלוקת כספים",
  GOVERNANCE: "ממשל ופרוטוקולים",
  EMPLOYEES_VOLUNTEERS: "עובדים ומתנדבים",
  INSURANCE: "ביטוח",
  GEMACH: 'גמ"ח כספים',
};

export default function PortalHomePage() {
  const router = useRouter();
  const [notifVisible, setNotifVisible] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/portal")
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDismissNotification = async (notifId: string) => {
    setNotifVisible(false);
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notifId] }),
      });
    } catch {
      // silently ignore
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="הפורטל שלי" subtitle="שלום · טוען נתונים..." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const score = data?.compliance?.score ?? 0;
  const warningCount = (data?.compliance?.warning ?? 0) + (data?.compliance?.expired ?? 0) + (data?.compliance?.missing ?? 0);
  const status: Status = warningCount === 0 ? "green" : warningCount <= 3 ? "orange" : "red";

  const statusText =
    status === "green" ? "הארגון שלך עומד בדרישות"
    : status === "orange" ? `יש ${warningCount} פריטים שדורשים תשומת לב`
    : "נדרש טיפול דחוף";

  // Urgent tasks — compliance items not OK, sorted by severity
  const urgentTasks = (data?.compliance?.items ?? [])
    .filter(item => item.status !== "OK")
    .map(item => {
      const daysUntil = item.dueDate
        ? Math.max(0, Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;
      const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString("he-IL") : "";
      return {
        id: item.id,
        title: item.name,
        days: daysUntil,
        date: dateStr,
        level: item.status === "EXPIRED" || item.status === "MISSING" ? "urgent" as const : "soon" as const,
      };
    })
    .sort((a, b) => (a.level === "urgent" ? 0 : 1) - (b.level === "urgent" ? 0 : 1));

  // Upcoming events — meetings + compliance deadlines
  const calendarEvents = (data?.board?.upcomingMeetings ?? []).map(m => {
    const meetDate = new Date(m.date);
    const daysUntil = Math.max(0, Math.ceil((meetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return { title: m.title, date: meetDate.toLocaleDateString("he-IL"), days: daysUntil, color: "#2563eb" };
  });

  const complianceDeadlines = (data?.compliance?.items ?? [])
    .filter(item => item.dueDate && item.status !== "OK")
    .map(item => {
      const dueDate = new Date(item.dueDate!);
      const daysUntil = Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return { title: item.name, date: dueDate.toLocaleDateString("he-IL"), days: daysUntil, color: item.status === "EXPIRED" ? "#ef4444" : "#d97706" };
    });

  const allUpcoming = [...calendarEvents, ...complianceDeadlines]
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  // Category scores — all categories, worst first
  const categoryScores = (data?.compliance?.categoryScores ?? []).filter(cs => cs.total > 0);

  // Notifications
  const firstUnread = (data?.notifications ?? []).find(n => !n.isRead);

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="הפורטל שלי" subtitle="שלום · לוח הבקרה שלך" />

      {/* ─── NOTIFICATION BAR ─── */}
      {notifVisible && firstUnread && (
        <div className="anim-fade-down mb-6 bg-white rounded-2xl border border-[#fde68a] p-4 flex items-center justify-between" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#fffbeb] flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#d97706]" />
            </div>
            <span className="text-[13px] text-[#1e293b] font-medium">
              {firstUnread.title} – {firstUnread.message}
            </span>
          </div>
          <button onClick={() => handleDismissNotification(firstUnread.id)} className="p-1.5 rounded-lg hover:bg-[#fef2f2] text-[#64748b] hover:text-[#ef4444] transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── 2 STAT CARDS ─── */}
      <div data-tour="portal-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="anim-fade-scale delay-1">
          <StatCard icon={Shield} label="ציון ניהול תקין" value={String(score)} color="#2563eb" />
        </div>
        <div className="anim-fade-scale delay-2">
          <StatCard
            icon={AlertTriangle}
            label="פריטים לטיפול"
            value={String(warningCount)}
            color={warningCount === 0 ? "#16a34a" : "#d97706"}
            change={warningCount === 0 ? "הכל תקין" : undefined}
            trend={warningCount === 0 ? "down" : undefined}
          />
        </div>
      </div>

      {/* ─── MAIN STATUS + COMPLIANCE CATEGORIES ─── */}
      <div data-tour="portal-status" className="anim-fade-up delay-2 bg-white rounded-2xl p-6 mb-6 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status === "green" ? "bg-[#f0fdf4]" : status === "orange" ? "bg-[#fffbeb]" : "bg-[#fef2f2]"
            }`}>
              {status === "green" ? <CheckCircle2 size={20} className="text-[#16a34a]" /> :
               status === "orange" ? <AlertTriangle size={20} className="text-[#d97706]" /> :
               <AlertCircle size={20} className="text-[#dc2626]" />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">{statusText}</h3>
              <p className="text-[12px] text-[#64748b]">
                {status === "green" ? "אין בעיות דחופות" : `${warningCount} דברים לטפל בקרוב`}
              </p>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-[28px] font-bold text-[#2563eb]">{score}</div>
            <div className="text-[10px] text-[#64748b]">מתוך 100</div>
          </div>
        </div>

        {/* Category list */}
        <div className="space-y-3">
          {categoryScores.map((cs, i) => {
            const color = cs.score === 100 ? "#16a34a" : cs.score >= 60 ? "#d97706" : "#ef4444";
            const bgColor = cs.score === 100 ? "bg-[#f0fdf4]" : cs.score >= 60 ? "bg-[#fffbeb]" : "bg-[#fef2f2]";
            const Icon = cs.score === 100 ? CheckCircle2 : cs.score >= 60 ? AlertTriangle : AlertCircle;
            return (
              <div key={cs.category} className={`anim-fade-right delay-${(i % 8) + 1} flex items-center gap-3`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-[#1e293b] truncate">
                      {CATEGORY_LABELS[cs.category] ?? cs.label}
                    </span>
                    <span className="text-[12px] font-bold flex-shrink-0 mr-2" style={{ color }}>
                      {cs.ok}/{cs.total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full anim-progress"
                      style={{
                        width: `${cs.score}%`,
                        background: color,
                        animationDelay: `${0.3 + i * 0.1}s`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {categoryScores.length === 0 && (
            <div className="text-center py-4 text-[13px] text-[#64748b]">אין נתוני קטגוריות</div>
          )}
        </div>

        <Link href="/portal/status" className="inline-flex items-center gap-1 mt-5 text-[12px] font-semibold text-[#2563eb] hover:underline">
          פרטים מלאים <ArrowLeft size={12} />
        </Link>
      </div>

      {/* ─── TWO COLUMNS: URGENT + ACTIONS/UPCOMING ─── */}
      <div data-tour="portal-urgent" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left: What needs attention */}
        <div className="anim-fade-up delay-4 bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <h3 className="text-[15px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#fffbeb] flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#d97706]" />
            </div>
            מה דורש טיפול ({urgentTasks.length})
          </h3>
          <div className="space-y-2">
            {urgentTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 size={32} className="text-[#16a34a] mx-auto mb-2" />
                <div className="text-[14px] font-semibold text-[#16a34a]">הכל תקין!</div>
                <div className="text-[12px] text-[#64748b]">אין פריטים שדורשים טיפול</div>
              </div>
            ) : (
              urgentTasks.slice(0, 5).map((task, i) => (
                <div key={task.id} className={`anim-fade-right delay-${(i % 4) + 1} flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all ${
                  task.level === "urgent" ? "border-r-[3px] border-r-[#ef4444]" : "border-r-[3px] border-r-[#d97706]"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${task.level === "urgent" ? "bg-[#fef2f2]" : "bg-[#fffbeb]"}`}>
                      {task.level === "urgent" ? <AlertCircle size={14} className="text-[#ef4444]" /> : <AlertTriangle size={14} className="text-[#d97706]" />}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1e293b]">{task.title}</div>
                      <div className="text-[11px] text-[#64748b]">
                        {task.days !== null ? `${task.days} ימים` : ""}{task.date ? ` · ${task.date}` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/portal/status")}
                    className="text-[11px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] px-3 py-1.5 rounded-lg hover:bg-[#eff6ff] transition-all flex-shrink-0"
                  >
                    טפל →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Actions + Upcoming */}
        <div className="space-y-4 md:space-y-6">
          {/* Quick Actions */}
          <div className="anim-fade-up delay-5 bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <h3 className="text-[15px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                <Shield size={16} className="text-[#2563eb]" />
              </div>
              פעולות מהירות
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/portal/status"
                className="anim-fade-scale delay-2 flex flex-col items-center gap-2 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-[#2563eb]" />
                </div>
                <span className="text-[12px] font-medium text-[#1e293b]">צפה בפרטים</span>
              </Link>
              <Link
                href="/portal/documents"
                className="anim-fade-scale delay-3 flex flex-col items-center gap-2 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                  <FileText size={16} className="text-[#16a34a]" />
                </div>
                <span className="text-[12px] font-medium text-[#1e293b]">העלה מסמך</span>
              </Link>
              <Link
                href="/portal/contact"
                className="anim-fade-scale delay-4 flex flex-col items-center gap-2 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                  <MessageCircle size={16} className="text-[#2563eb]" />
                </div>
                <span className="text-[12px] font-medium text-[#1e293b]">פנה למלווה</span>
              </Link>
            </div>
          </div>

          {/* Upcoming */}
          <div className="anim-fade-up delay-6 bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                  <Calendar size={16} className="text-[#2563eb]" />
                </div>
                מה בקרוב
              </h3>
              <Link href="/portal/calendar" className="text-[12px] font-semibold text-[#2563eb] hover:underline flex items-center gap-1">
                הכל <ArrowLeft size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {allUpcoming.length === 0 ? (
                <div className="text-center py-4 text-[13px] text-[#64748b]">אין אירועים קרובים</div>
              ) : (
                allUpcoming.map((ev, i) => (
                  <div key={i} className={`anim-fade-right delay-${i + 2} flex items-center justify-between p-3 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all`}>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full" style={{ background: ev.color }} />
                      <div>
                        <div className="text-[13px] font-medium text-[#1e293b]">{ev.title}</div>
                        <div className="text-[11px] text-[#64748b]">{ev.date}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2563eb] bg-[#eff6ff] px-2.5 py-1 rounded-lg">
                      {ev.days} ימים
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { Users, Calendar, Download, Clock, UserCheck, Crown, User, CheckCircle2, Plus, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { type ComplianceItem } from "@/lib/smart-actions";
import HandleNowButton from "@/components/HandleNowButton";
import SmartActionsModal from "@/components/SmartActionsModal";

type BoardMember = {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  startDate?: string;
};

type BoardMeeting = {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
  summary?: string;
  attendeesCount?: number;
  resolutions: { id: string; title: string; status: string; votesFor?: number; votesAgainst?: number; votesAbstain?: number }[];
  protocol?: { id: string; approvedAt?: string } | null;
};

type BoardResolution = {
  id: string;
  title: string;
  description?: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  createdAt: string;
  meeting?: { id: string; title: string } | null;
};

type BoardData = {
  members: BoardMember[];
  meetings: BoardMeeting[];
  resolutions: BoardResolution[];
};

function getRoleIcon(role: string) {
  const lower = role.toLowerCase();
  if (lower.includes("יו\"ר") || lower.includes("יו״ר") || lower === "chair" || lower === "chairperson") return Crown;
  if (lower.includes("גזבר") || lower === "treasurer") return UserCheck;
  return User;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name.substring(0, 2);
}

export default function PortalBoardPage() {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [governanceItems, setGovernanceItems] = useState<ComplianceItem[]>([]);
  const [actionItem, setActionItem] = useState<ComplianceItem | null>(null);

  // Meeting form
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);

  // Member form
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/board/meetings").then(r => r.json()),
      fetch("/api/board/members").then(r => r.json()),
      fetch("/api/board/resolutions").then(r => r.json()),
      fetch("/api/compliance?category=GOVERNANCE").then(r => r.json()),
    ])
      .then(([meetingsRes, membersRes, resolutionsRes, complianceRes]) => {
        setData({
          meetings: meetingsRes.success ? meetingsRes.data : [],
          members: membersRes.success ? membersRes.data : [],
          resolutions: resolutionsRes.success ? resolutionsRes.data : [],
        });
        if (complianceRes.success) {
          setGovernanceItems((complianceRes.data.items ?? []).filter((i: ComplianceItem) => i.status !== "OK"));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      showError("יש להזין כותרת לישיבה");
      return;
    }
    if (!meetingDate) {
      showError("יש לבחור תאריך");
      return;
    }
    setMeetingSubmitting(true);
    try {
      const res = await fetch("/api/board/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          date: new Date(meetingDate).toISOString(),
          location: meetingLocation.trim() || undefined,
          status: "SCHEDULED",
        }),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess("הישיבה נקבעה בהצלחה");
        setShowMeetingModal(false);
        setMeetingTitle("");
        setMeetingDate("");
        setMeetingLocation("");
        fetchData();
      } else {
        showError("שגיאה בקביעת הישיבה");
      }
    } catch {
      showError("שגיאה בקביעת הישיבה");
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleCreateMember = async () => {
    if (!memberName.trim()) {
      showError("יש להזין שם");
      return;
    }
    if (!memberRole.trim()) {
      showError("יש להזין תפקיד");
      return;
    }
    setMemberSubmitting(true);
    try {
      const res = await fetch("/api/board/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName.trim(),
          role: memberRole.trim(),
          email: memberEmail.trim() || undefined,
          phone: memberPhone.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showSuccess("חבר הועד נוסף בהצלחה");
        setShowMemberModal(false);
        setMemberName("");
        setMemberRole("");
        setMemberEmail("");
        setMemberPhone("");
        fetchData();
      } else {
        showError("שגיאה בהוספת חבר ועד");
      }
    } catch {
      showError("שגיאה בהוספת חבר ועד");
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleDownloadProtocol = (meeting: BoardMeeting) => {
    if (meeting.protocol) {
      showSuccess("פרוטוקול ישיבה — הורדה תהיה זמינה בקרוב");
    } else {
      showError("אין פרוטוקול לישיבה זו");
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="הועד שלי" subtitle="חברי ועד, ישיבות ופרוטוקולים" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const members = (data?.members ?? []).filter(m => m.isActive);
  const meetings = data?.meetings ?? [];
  const resolutions = data?.resolutions ?? [];

  // Build a map of resolution votes by id for quick lookup
  const resolutionVotesMap: Record<string, { votesFor: number; votesAgainst: number; votesAbstain: number }> = {};
  for (const r of resolutions) {
    resolutionVotesMap[r.id] = { votesFor: r.votesFor, votesAgainst: r.votesAgainst, votesAbstain: r.votesAbstain };
  }

  // Find next upcoming meeting
  const now = Date.now();
  const upcomingMeetings = meetings
    .filter(m => new Date(m.date).getTime() >= now && m.status === "SCHEDULED")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextMeeting = upcomingMeetings[0] ?? null;

  // Past meetings sorted desc
  const pastMeetings = meetings
    .filter(m => new Date(m.date).getTime() < now || m.status === "COMPLETED")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Stats
  const totalMeetings = meetings.length;
  const approvedProtocols = meetings.filter(m => m.protocol?.approvedAt).length;
  const approvalPct = totalMeetings > 0 ? Math.round((approvedProtocols / totalMeetings) * 100) : 0;

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="הועד שלי" subtitle="חברי ועד, ישיבות ופרוטוקולים" />

      {/* Encouragement */}
      {members.length > 0 && (
        <div className="anim-fade-down bg-white rounded-2xl border border-[#bbf7d0] p-4 mb-6 flex items-center gap-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
            <CheckCircle2 size={16} className="text-[#16a34a]" />
          </div>
          <span className="text-[13px] font-medium text-[#16a34a]">
            הועד שלך כולל {members.length} חברים פעילים – כל הכבוד!
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Board Members */}
        <div className="anim-fade-up delay-1 bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                <Users size={16} className="text-[#2563eb]" />
              </div>
              חברי ועד ({members.length})
            </h3>
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eff6ff] text-[#2563eb] text-[11px] font-semibold hover:bg-[#dbeafe] transition-colors"
            >
              <Plus size={12} />
              הוסף חבר ועד
            </button>
          </div>
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-center py-6 text-[13px] text-[#64748b]">אין חברי ועד</div>
            ) : (
              members.map((member, i) => {
                const Icon = getRoleIcon(member.role);
                return (
                  <div key={member.id} className={`anim-fade-right delay-${i + 1} flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50 hover:border-[#2563eb]/20 transition-all`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1e293b]">{member.name}</div>
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1">
                          <Icon size={11} /> {member.role}
                        </div>
                      </div>
                    </div>
                    {member.phone && (
                      <div className="text-[11px] text-[#64748b]">{member.phone}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Next Meeting + Stats */}
        <div>
          <div className="anim-fade-up delay-2 bg-white rounded-2xl p-5 border border-[#e8ecf4] mb-6 hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1e293b] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                  <Calendar size={16} className="text-[#2563eb]" />
                </div>
                הישיבה הבאה
              </h3>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eff6ff] text-[#2563eb] text-[11px] font-semibold hover:bg-[#dbeafe] transition-colors"
              >
                <Plus size={12} />
                קבע ישיבה
              </button>
            </div>
            {nextMeeting ? (
              <>
                <div className="bg-[#f8f9fc] rounded-xl p-4 mb-4 border border-[#e8ecf4]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[16px] font-bold text-[#2563eb]">
                      {new Date(nextMeeting.date).toLocaleDateString("he-IL")}
                    </span>
                    <span className="text-[13px] font-semibold text-[#2563eb] bg-[#eff6ff] px-3.5 py-1.5 rounded-xl">
                      {new Date(nextMeeting.date).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#64748b]">{nextMeeting.location ?? "מקום טרם נקבע"}</div>
                </div>
                <div className="text-[13px] font-semibold text-[#1e293b] mb-2">{nextMeeting.title}</div>
                {nextMeeting.summary && (
                  <p className="text-[12px] text-[#64748b]">{nextMeeting.summary}</p>
                )}
                {nextMeeting.resolutions.length > 0 && (
                  <>
                    <div className="text-[13px] font-semibold text-[#1e293b] mb-2 mt-3">סדר יום:</div>
                    <ol className="space-y-2">
                      {nextMeeting.resolutions.map((res, i) => {
                        const votes = resolutionVotesMap[res.id] ?? { votesFor: res.votesFor ?? 0, votesAgainst: res.votesAgainst ?? 0, votesAbstain: res.votesAbstain ?? 0 };
                        const hasVotes = votes.votesFor > 0 || votes.votesAgainst > 0 || votes.votesAbstain > 0;
                        return (
                          <li key={res.id} className={`anim-fade-right delay-${i + 1} flex items-start gap-2 text-[13px] text-[#64748b]`}>
                            <div className="w-5 h-5 rounded-md bg-[#eff6ff] flex items-center justify-center text-[10px] font-bold text-[#2563eb] flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>
                              <div>{res.title}</div>
                              {hasVotes && (
                                <div className="flex gap-2 mt-1">
                                  <span className="text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-md border border-[#bbf7d0]">
                                    בעד: {votes.votesFor}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#ef4444] bg-[#fef2f2] px-2 py-0.5 rounded-md border border-[#fecaca]">
                                    נגד: {votes.votesAgainst}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
                                    נמנע: {votes.votesAbstain}
                                  </span>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-[13px] text-[#64748b]">אין ישיבה מתוכננת</div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="anim-fade-scale delay-3 bg-white rounded-2xl p-5 border border-[#e8ecf4] text-center hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="text-[28px] font-bold text-[#2563eb]">{totalMeetings}</div>
              <div className="text-[11px] text-[#64748b] mt-1">ישיבות</div>
            </div>
            <div className="anim-fade-scale delay-4 bg-white rounded-2xl p-5 border border-[#e8ecf4] text-center hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div className="text-[28px] font-bold text-[#16a34a]">{approvalPct}%</div>
              <div className="text-[11px] text-[#64748b] mt-1">פרוטוקולים מאושרים</div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Meetings */}
      <div className="anim-fade-up delay-4 bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <h3 className="text-[15px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
            <Clock size={16} className="text-[#2563eb]" />
          </div>
          ישיבות אחרונות
        </h3>
        <div className="space-y-2">
          {pastMeetings.length === 0 ? (
            <div className="text-center py-6 text-[13px] text-[#64748b]">אין ישיבות קודמות</div>
          ) : (
            pastMeetings.map((meeting, i) => (
              <div key={meeting.id} className={`anim-fade-right delay-${i + 1} flex items-center justify-between p-3.5 rounded-xl hover:bg-[#f8f9fc] transition-all border border-transparent hover:border-[#e8ecf4]`}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[13px] font-bold text-[#2563eb]">
                    {new Date(meeting.date).getDate()}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#1e293b]">{meeting.title}</div>
                    <div className="text-[11px] text-[#64748b]">
                      {new Date(meeting.date).toLocaleDateString("he-IL")} · {meeting.resolutions.length} נושאים
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {meeting.protocol?.approvedAt && (
                    <span className="text-[11px] font-semibold text-[#16a34a] bg-[#f0fdf4] px-3 py-1.5 rounded-lg border border-[#bbf7d0]">
                      מאושר
                    </span>
                  )}
                  <button
                    onClick={() => handleDownloadProtocol(meeting)}
                    className="p-2 rounded-lg hover:bg-[#eff6ff] text-[#2563eb] transition-all"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── GOVERNANCE ITEMS ─── */}
      {governanceItems.length > 0 && (
        <div className="anim-fade-up delay-5 bg-white rounded-2xl p-5 border border-[#fde68a] mt-6 hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <h3 className="text-[15px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#fffbeb] flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#d97706]" />
            </div>
            ממשל תקין — דרוש טיפול
          </h3>
          <div className="space-y-2">
            {governanceItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
                <span className="text-[13px] font-semibold text-[#92400e]">{item.name}</span>
                <HandleNowButton item={item} onClick={setActionItem} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SCHEDULE MEETING MODAL ─── */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 border border-[#e8ecf4]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#1e293b]">קביעת ישיבה חדשה</h3>
              <button onClick={() => setShowMeetingModal(false)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">כותרת</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="לדוגמה: ישיבת ועד מנהל"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">תאריך ושעה</label>
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">מיקום</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={e => setMeetingLocation(e.target.value)}
                  placeholder="לדוגמה: משרד העמותה"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <button
                onClick={handleCreateMeeting}
                disabled={meetingSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {meetingSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    קבע ישיבה
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD MEMBER MODAL ─── */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 border border-[#e8ecf4]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#1e293b]">הוספת חבר ועד</h3>
              <button onClick={() => setShowMemberModal(false)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">שם</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  placeholder="שם מלא"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">תפקיד</label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                  placeholder='לדוגמה: יו"ר, גזבר, חבר ועד'
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">אימייל</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  placeholder="אופציונלי"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">טלפון</label>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={e => setMemberPhone(e.target.value)}
                  placeholder="אופציונלי"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <button
                onClick={handleCreateMember}
                disabled={memberSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {memberSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    הוסף חבר ועד
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <SmartActionsModal item={actionItem} onClose={() => setActionItem(null)} onHandled={fetchData} />
    </div>
  );
}

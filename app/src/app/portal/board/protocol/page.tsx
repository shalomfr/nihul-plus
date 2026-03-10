"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { FileText, Sparkles, ArrowRight, Check, Loader2, Copy, Download, UserCheck, Plus, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import Link from "next/link";

type Meeting = {
  id: string;
  title: string;
  date: string;
  status: string;
};

type BoardMember = {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  signatureFileId?: string | null;
};

type Guest = { name: string; role: string };

export default function ProtocolGeneratorPage() {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<"form" | "result">("form");
  const [loading, setLoading] = useState(false);

  // Meeting selection
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [freeFormMode, setFreeFormMode] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");

  // Protocol details
  const [subject, setSubject] = useState("");
  const [discussion, setDiscussion] = useState("");
  const [decisions, setDecisions] = useState("");

  // Participants
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guestRole, setGuestRole] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);

  // Result
  const [protocol, setProtocol] = useState("");

  useEffect(() => {
    fetch("/api/board/meetings")
      .then(r => r.json())
      .then(res => { if (res.success) setMeetings(res.data); })
      .catch(console.error);
    fetch("/api/board/members")
      .then(r => r.json())
      .then(res => {
        if (res.success) setBoardMembers(res.data.filter((m: BoardMember) => m.isActive));
      })
      .catch(console.error);
  }, []);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    setGuests(prev => [...prev, { name, role: guestRole.trim() || "אורח/ת" }]);
    setGuestName("");
    setGuestRole("");
  };

  const removeGuest = (index: number) => {
    setGuests(prev => prev.filter((_, i) => i !== index));
  };

  const hasMeeting = !!selectedMeeting || (freeFormMode && meetingTitle.trim());
  const hasParticipants = selectedMembers.size > 0 || guests.length > 0;
  const canSubmit = hasMeeting && subject.trim() && hasParticipants && !loading;

  const generateProtocol = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const participants = boardMembers
      .filter(m => selectedMembers.has(m.id))
      .map(m => ({ name: m.name, role: m.role }));

    try {
      const res = await fetch("/api/board/protocols/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: selectedMeeting?.id,
          meetingTitle: freeFormMode ? meetingTitle.trim() : undefined,
          meetingDate: freeFormMode ? meetingDate : undefined,
          meetingLocation: meetingLocation.trim() || undefined,
          subject: subject.trim(),
          discussion: discussion.trim(),
          decisions: decisions.trim(),
          participants,
          guests: guests.length > 0 ? guests : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProtocol(data.data.content);
        setStep("result");
        showSuccess("הפרוטוקול נוצר בהצלחה!");
      } else {
        showError(data.error || "שגיאה ביצירת הפרוטוקול");
      }
    } catch {
      showError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  const copyProtocol = () => {
    navigator.clipboard.writeText(protocol);
    showSuccess("הפרוטוקול הועתק ללוח");
  };

  const downloadProtocol = () => {
    const blob = new Blob([protocol], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = selectedMeeting?.title ?? meetingTitle ?? "פרוטוקול";
    const date = selectedMeeting
      ? new Date(selectedMeeting.date).toLocaleDateString("he-IL").replace(/\./g, "-")
      : new Date().toLocaleDateString("he-IL").replace(/\./g, "-");
    a.download = `${title}_${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── RESULT ───
  if (step === "result") {
    return (
      <div data-tour="board-protocol" className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="הפרוטוקול מוכן!" subtitle={selectedMeeting?.title ?? meetingTitle ?? "פרוטוקול"} />

        <div className="max-w-[700px] mx-auto mt-4">
          <div className="anim-fade-down bg-gradient-to-l from-[#16a34a] to-[#15803d] rounded-2xl p-4 mb-4 flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Check size={20} />
            </div>
            <div>
              <div className="text-[14px] font-bold">הפרוטוקול נוצר בהצלחה</div>
              <div className="text-[12px] opacity-80">
                {selectedMeeting ? "הפרוטוקול נשמר ומקושר לישיבה" : "תוכל להעתיק או להוריד את הפרוטוקול"}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={copyProtocol} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8ecf4] text-[13px] font-semibold text-[#1e293b] hover:border-[#2563eb]/30 transition-colors">
              <Copy size={14} /> העתק
            </button>
            <button onClick={downloadProtocol} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8ecf4] text-[13px] font-semibold text-[#1e293b] hover:border-[#2563eb]/30 transition-colors">
              <Download size={14} /> הורד קובץ
            </button>
            <button onClick={() => setStep("form")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8ecf4] text-[13px] font-semibold text-[#1e293b] hover:border-[#2563eb]/30 transition-colors">
              <ArrowRight size={14} /> חזור לטופס
            </button>
            <Link href="/portal/board" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] text-[13px] font-semibold text-white hover:bg-[#1d4ed8] transition-colors mr-auto">
              <ArrowRight size={14} /> חזור לועד
            </Link>
          </div>

          <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#e8ecf4]">
              <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                <FileText size={16} className="text-[#2563eb]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">פרוטוקול</h3>
            </div>
            <div className="text-[13px] text-[#1e293b] whitespace-pre-wrap leading-relaxed" dir="rtl">
              {protocol}
            </div>

            {/* Signatures Section */}
            {(() => {
              const signers = boardMembers.filter(m => selectedMembers.has(m.id));
              if (signers.length === 0 && guests.length === 0) return null;
              const allSigners = [
                ...signers.map(m => ({ name: m.name, role: m.role, signatureFileId: m.signatureFileId })),
                ...guests.map(g => ({ name: g.name, role: g.role, signatureFileId: null as string | null | undefined })),
              ];
              return (
                <div className="mt-8 pt-6 border-t border-[#e8ecf4]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6" dir="rtl">
                    {allSigners.map((signer, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-full h-[60px] flex items-end justify-center mb-2">
                          {signer.signatureFileId ? (
                            <img
                              src={`/api/files/${signer.signatureFileId}`}
                              alt={`חתימת ${signer.name}`}
                              className="max-h-[55px] max-w-full object-contain"
                            />
                          ) : (
                            <div className="w-full" />
                          )}
                        </div>
                        <div className="w-full border-t border-[#1e293b] pt-2">
                          <div className="text-[12px] font-semibold text-[#1e293b]">{signer.name}</div>
                          <div className="text-[11px] text-[#64748b]">{signer.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM ───
  return (
    <div data-tour="board-protocol" className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="יצירת פרוטוקול" subtitle="מלא את הפרטים וה-AI ייצור פרוטוקול מושלם" />

      <div className="max-w-[600px] mx-auto mt-4 space-y-4">
        {/* Header */}
        <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#7c3aed] flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1e293b]">יצירת פרוטוקול עם AI</h2>
              <p className="text-[12px] text-[#64748b]">מלא את הפרטים וקבל פרוטוקול רשמי מוכן</p>
            </div>
          </div>
        </div>

        {/* Section 1: Meeting Selection */}
        <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)", animationDelay: "50ms" }}>
          <h3 className="text-[14px] font-bold text-[#1e293b] mb-3">בחר ישיבה</h3>

          {meetings.length > 0 && (
            <div className="space-y-2 mb-3">
              {meetings.slice(0, 8).map(meeting => (
                <button
                  key={meeting.id}
                  onClick={() => { setSelectedMeeting(meeting); setFreeFormMode(false); }}
                  className={`w-full text-right p-3 rounded-xl border transition-all text-[13px] ${
                    selectedMeeting?.id === meeting.id
                      ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] font-semibold"
                      : "border-[#e8ecf4] bg-[#f8f9fc] text-[#1e293b] hover:border-[#2563eb]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{meeting.title}</span>
                    <span className="text-[11px] text-[#64748b]">{new Date(meeting.date).toLocaleDateString("he-IL")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-center my-3">
            <div className="flex-1 border-t border-[#e8ecf4]" />
            <span className="px-3 text-[12px] text-[#94a3b8]">או</span>
            <div className="flex-1 border-t border-[#e8ecf4]" />
          </div>

          <button
            onClick={() => { setFreeFormMode(true); setSelectedMeeting(null); }}
            className={`w-full text-right p-3 rounded-xl border transition-all text-[13px] ${
              freeFormMode
                ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] font-semibold"
                : "border-[#e8ecf4] bg-[#f8f9fc] text-[#1e293b] hover:border-[#2563eb]/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={14} />
              ישיבה חופשית
            </div>
          </button>

          {freeFormMode && (
            <div className="mt-3 space-y-2">
              <input
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
                placeholder="כותרת הישיבה *"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
                />
                <input
                  value={meetingLocation}
                  onChange={e => setMeetingLocation(e.target.value)}
                  placeholder="מיקום (אופציונלי)"
                  className="px-3 py-2.5 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Protocol Details */}
        <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)", animationDelay: "100ms" }}>
          <h3 className="text-[14px] font-bold text-[#1e293b] mb-3">פרטי הפרוטוקול</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1">נושא / סדר יום *</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="למשל: אישור תקציב שנתי, מינוי בעלי תפקידים..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1">תיאור הדיון</label>
              <textarea
                value={discussion}
                onChange={e => setDiscussion(e.target.value)}
                placeholder="תאר בקצרה מה הוצג, מה נדון, אילו מסמכים הוצגו..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] resize-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1">החלטות שהתקבלו</label>
              <textarea
                value={decisions}
                onChange={e => setDecisions(e.target.value)}
                placeholder="פרט את ההחלטות העיקריות, למשל: אושר תקציב של 100,000 ש&quot;ח..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Participants */}
        <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)", animationDelay: "150ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={16} className="text-[#2563eb]" />
            <h3 className="text-[14px] font-bold text-[#1e293b]">משתתפים בישיבה</h3>
            {hasParticipants && (
              <span className="text-[11px] bg-[#eff6ff] text-[#2563eb] px-2 py-0.5 rounded-full font-semibold">
                {selectedMembers.size + guests.length}
              </span>
            )}
          </div>

          {/* Board members checkboxes */}
          {boardMembers.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {boardMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-[13px] text-right transition-all ${
                    selectedMembers.has(member.id)
                      ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] font-semibold"
                      : "border-[#e8ecf4] bg-[#f8f9fc] text-[#1e293b] hover:border-[#2563eb]/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedMembers.has(member.id) ? "border-[#2563eb] bg-[#2563eb]" : "border-[#d1d5db]"
                  }`}>
                    {selectedMembers.has(member.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="truncate">
                    <div>{member.name}</div>
                    <div className="text-[10px] text-[#94a3b8] font-normal">{member.role}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-[13px] text-[#64748b] mb-3">אין חברי ועד במערכת</div>
          )}

          {/* Guests */}
          {guests.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <div className="text-[12px] font-medium text-[#64748b]">אורחים</div>
              {guests.map((guest, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] text-[13px]">
                  <span className="font-semibold text-[#166534]">{guest.name}</span>
                  <span className="text-[#64748b]">- {guest.role}</span>
                  <button onClick={() => removeGuest(i)} className="mr-auto text-[#94a3b8] hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add guest */}
          <div className="flex items-center gap-2">
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }}
              placeholder="שם אורח..."
              className="flex-1 px-3 py-2 rounded-lg border border-[#e8ecf4] bg-white text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
            />
            <input
              value={guestRole}
              onChange={e => setGuestRole(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }}
              placeholder="תפקיד..."
              className="w-[120px] px-3 py-2 rounded-lg border border-[#e8ecf4] bg-white text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
            />
            <button
              onClick={addGuest}
              disabled={!guestName.trim()}
              className="p-2 rounded-lg bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] disabled:opacity-40 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={generateProtocol}
          disabled={!canSubmit}
          className="anim-fade-up w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ animationDelay: "200ms" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              יוצר פרוטוקול...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              צור פרוטוקול עם AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}

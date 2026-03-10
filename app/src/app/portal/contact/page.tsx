"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { MessageCircle, Send, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/Toast";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function PortalContactPage() {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [subjectError, setSubjectError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  // History
  const [history, setHistory] = useState<NotificationItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = () => {
    setHistoryLoading(true);
    fetch("/api/notifications")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setHistory(res.data?.notifications ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const isSubjectEmpty = !subject.trim();
    const isMessageEmpty = !message.trim();
    setSubjectError(isSubjectEmpty);
    setMessageError(isMessageEmpty);

    if (isSubjectEmpty || isMessageEmpty) {
      showError("יש למלא את כל השדות");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("ההודעה נשלחה! המלווה יחזור אליך בהקדם.");
        setSubject("");
        setMessage("");
        setSubjectError(false);
        setMessageError(false);
        fetchHistory();
      } else {
        showError("שגיאה בשליחה, נסה שוב.");
      }
    } catch {
      showError("שגיאה בשליחה, נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="פנה למלווה" subtitle="יש שאלה או צריך עזרה? נשמח לעזור" />

      <div className="max-w-[600px]">
        {/* ─── CONTACT FORM ─── */}
        <div className="anim-fade-up delay-2 bg-white rounded-2xl p-6 border border-[#e8ecf4] hover-lift mb-6" data-tour="contact-form" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <MessageCircle size={20} className="text-[#2563eb]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">שלח הודעה</h3>
              <p className="text-[12px] text-[#64748b]">המלווה שלך יחזור בהקדם</p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[13px] font-medium text-[#1e293b] mb-2">
                נושא <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => { setSubject(e.target.value); if (e.target.value.trim()) setSubjectError(false); }}
                placeholder="במה אפשר לעזור?"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all ${
                  subjectError ? "border-[#ef4444]" : "border-[#e8ecf4]"
                }`}
              />
              {subjectError && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#ef4444]">
                  <AlertTriangle size={11} />
                  שדה חובה
                </div>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1e293b] mb-2">
                הודעה <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={e => { setMessage(e.target.value); if (e.target.value.trim()) setMessageError(false); }}
                placeholder="תאר את השאלה או הבקשה..."
                className={`w-full px-4 py-3 rounded-xl border bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] resize-none transition-all ${
                  messageError ? "border-[#ef4444]" : "border-[#e8ecf4]"
                }`}
              />
              {messageError && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#ef4444]">
                  <AlertTriangle size={11} />
                  שדה חובה
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  שולח...
                </>
              ) : (
                <>
                  <Send size={16} /> שלח
                </>
              )}
            </button>
          </form>
        </div>

        {/* ─── MESSAGE HISTORY ─── */}
        <div className="anim-fade-up delay-4 bg-white rounded-2xl p-6 border border-[#e8ecf4] hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <Clock size={20} className="text-[#2563eb]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">היסטוריית פניות</h3>
              <p className="text-[12px] text-[#64748b]">ההודעות האחרונות שלך</p>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-[#2563eb] border-t-transparent rounded-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-[#64748b]">אין פניות קודמות</div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((item, i) => (
                <div key={item.id} className={`anim-fade-right delay-${(i % 4) + 1} p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold text-[#1e293b]">{item.title}</span>
                    <span className="text-[11px] text-[#64748b]">
                      {new Date(item.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                  {item.message && (
                    <div className="text-[12px] text-[#64748b] line-clamp-2">{item.message}</div>
                  )}
                  <div className="mt-1.5">
                    {item.isRead ? (
                      <span className="text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-lg border border-[#bbf7d0]">
                        נקרא
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded-lg border border-[#bfdbfe]">
                        חדש
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

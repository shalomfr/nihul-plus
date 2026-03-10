"use client";
import { useState, useEffect, useRef } from "react";
import Topbar from "@/components/Topbar";
import { FileText, Send, Sparkles, ArrowRight, Check, Loader2, Copy, Download, ChevronDown } from "lucide-react";
import { useToast } from "@/components/Toast";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };
type AIResponse = { type: "question" | "protocol"; text?: string; hint?: string; content?: string };

type Meeting = {
  id: string;
  title: string;
  date: string;
  status: string;
};

export default function ProtocolGeneratorPage() {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<"select" | "chat" | "result">("select");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [noMeeting, setNoMeeting] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<AIResponse | null>(null);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/board/meetings")
      .then(r => r.json())
      .then(res => {
        if (res.success) setMeetings(res.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentQuestion]);

  useEffect(() => {
    if (step === "chat" && !loading) {
      inputRef.current?.focus();
    }
  }, [step, loading, currentQuestion]);

  const startChat = async () => {
    setStep("chat");
    setLoading(true);

    // Send initial empty message to get first question
    try {
      const res = await fetch("/api/board/protocols/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: selectedMeeting
            ? `אני רוצה ליצור פרוטוקול לישיבה: "${selectedMeeting.title}" מתאריך ${new Date(selectedMeeting.date).toLocaleDateString("he-IL")}. בוא נתחיל.`
            : "אני רוצה ליצור פרוטוקול ישיבה חדש. בוא נתחיל." }],
          meetingId: selectedMeeting?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const initial: Message = {
          role: "user",
          content: selectedMeeting
            ? `יצירת פרוטוקול ל: "${selectedMeeting.title}"`
            : "יצירת פרוטוקול ישיבה חדש",
        };
        setMessages([initial]);
        setCurrentQuestion(data.data);
      } else {
        showError("שגיאה בהתחלת השאלון");
        setStep("select");
      }
    } catch {
      showError("שגיאה בחיבור לשרת");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!userInput.trim() || loading) return;

    const answer = userInput.trim();
    setUserInput("");
    setLoading(true);

    // Add the question and answer to messages
    const questionText = currentQuestion?.text ?? "";
    const newMessages: Message[] = [
      ...messages,
      { role: "assistant", content: questionText },
      { role: "user", content: answer },
    ];
    setMessages(newMessages);
    setCurrentQuestion(null);

    try {
      const res = await fetch("/api/board/protocols/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          meetingId: selectedMeeting?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.type === "protocol") {
          setProtocol(data.data.content);
          setStep("result");
          showSuccess("הפרוטוקול נוצר בהצלחה!");
        } else {
          setCurrentQuestion(data.data);
        }
      } else {
        showError("שגיאה בעיבוד התשובה");
      }
    } catch {
      showError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
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
    const title = selectedMeeting?.title ?? "פרוטוקול";
    const date = selectedMeeting ? new Date(selectedMeeting.date).toLocaleDateString("he-IL").replace(/\./g, "-") : new Date().toLocaleDateString("he-IL").replace(/\./g, "-");
    a.download = `${title}_${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── STEP 1: SELECT MEETING ───
  if (step === "select") {
    return (
      <div data-tour="board-protocol" className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="יצירת פרוטוקול" subtitle="שאלון חכם ליצירת פרוטוקול ישיבה" />

        <div className="max-w-[600px] mx-auto mt-4">
          <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#7c3aed] flex items-center justify-center">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">יצירת פרוטוקול עם AI</h2>
                <p className="text-[12px] text-[#64748b]">אענה על כמה שאלות ואקבל פרוטוקול מוכן</p>
              </div>
            </div>

            {/* Select meeting or create ad-hoc */}
            <div className="space-y-3 mb-6">
              <label className="block text-[13px] font-medium text-[#1e293b]">בחר ישיבה קיימת</label>
              {meetings.length > 0 ? (
                <div className="space-y-2">
                  {meetings.slice(0, 10).map(meeting => (
                    <button
                      key={meeting.id}
                      onClick={() => { setSelectedMeeting(meeting); setNoMeeting(false); }}
                      className={`w-full text-right p-3.5 rounded-xl border transition-all text-[13px] ${
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
              ) : (
                <div className="text-center py-4 text-[13px] text-[#64748b]">אין ישיבות במערכת</div>
              )}

              <div className="relative flex items-center my-4">
                <div className="flex-1 border-t border-[#e8ecf4]" />
                <span className="px-3 text-[12px] text-[#94a3b8]">או</span>
                <div className="flex-1 border-t border-[#e8ecf4]" />
              </div>

              <button
                onClick={() => { setNoMeeting(true); setSelectedMeeting(null); }}
                className={`w-full text-right p-3.5 rounded-xl border transition-all text-[13px] ${
                  noMeeting
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] font-semibold"
                    : "border-[#e8ecf4] bg-[#f8f9fc] text-[#1e293b] hover:border-[#2563eb]/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  צור פרוטוקול חופשי (ללא ישיבה קיימת)
                </div>
              </button>
            </div>

            <button
              onClick={startChat}
              disabled={!selectedMeeting && !noMeeting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={16} />
              התחל שאלון חכם
              <ArrowRight size={14} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: CHAT / QUESTIONNAIRE ───
  if (step === "chat") {
    return (
      <div data-tour="board-protocol" className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="שאלון חכם" subtitle={selectedMeeting ? selectedMeeting.title : "פרוטוקול חופשי"} />

        <div className="max-w-[600px] mx-auto mt-4">
          <div className="anim-fade-up bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            {/* Progress indicator */}
            <div className="px-5 py-3 border-b border-[#e8ecf4] flex items-center justify-between bg-[#f8f9fc]">
              <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                <Sparkles size={14} className="text-[#7c3aed]" />
                <span>ה-AI שואל שאלות כדי ליצור פרוטוקול מושלם</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(Math.ceil(messages.filter(m => m.role === "user").length / 2) + 1, 7) }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#2563eb]" />
                ))}
                {Array.from({ length: Math.max(7 - Math.ceil(messages.filter(m => m.role === "user").length / 2) - 1, 0) }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#e2e8f0]" />
                ))}
              </div>
            </div>

            {/* Chat messages */}
            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] ${
                    msg.role === "user"
                      ? "bg-[#eff6ff] text-[#1e293b] rounded-tr-md"
                      : "bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white rounded-tl-md"
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {/* Current question */}
              {currentQuestion && (
                <div className="flex justify-end anim-fade-right">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white">
                    <div className="text-[13px] whitespace-pre-wrap">{currentQuestion.text}</div>
                    {currentQuestion.hint && (
                      <div className="text-[11px] mt-2 opacity-70 flex items-center gap-1">
                        <ChevronDown size={10} />
                        {currentQuestion.hint}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-gradient-to-br from-[#2563eb] to-[#7c3aed]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#e8ecf4] bg-[#f8f9fc]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || !currentQuestion}
                  placeholder={loading ? "ממתין לשאלה..." : "הקלד את התשובה שלך..."}
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px] resize-none"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
                <button
                  onClick={sendAnswer}
                  disabled={loading || !userInput.trim() || !currentQuestion}
                  className="p-3 rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rotate-180" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 3: RESULT ───
  return (
    <div data-tour="board-protocol" className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="הפרוטוקול מוכן!" subtitle={selectedMeeting?.title ?? "פרוטוקול חופשי"} />

      <div className="max-w-[700px] mx-auto mt-4">
        {/* Success banner */}
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

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <button onClick={copyProtocol} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8ecf4] text-[13px] font-semibold text-[#1e293b] hover:border-[#2563eb]/30 transition-colors">
            <Copy size={14} />
            העתק
          </button>
          <button onClick={downloadProtocol} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8ecf4] text-[13px] font-semibold text-[#1e293b] hover:border-[#2563eb]/30 transition-colors">
            <Download size={14} />
            הורד קובץ
          </button>
          <Link href="/portal/board" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] text-[13px] font-semibold text-white hover:bg-[#1d4ed8] transition-colors mr-auto">
            <ArrowRight size={14} />
            חזור לועד
          </Link>
        </div>

        {/* Protocol content */}
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
        </div>
      </div>
    </div>
  );
}

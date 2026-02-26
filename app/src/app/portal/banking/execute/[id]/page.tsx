"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

type Step =
  | "loading"    // Puppeteer starting + logging in
  | "screenshot" // Showing bank screen, waiting for confirm
  | "otp"        // Bank requires OTP
  | "confirming" // Sending confirm click
  | "success"    // Done
  | "error";     // Something failed

export default function ExecuteTransferPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [sessionId, setSessionId] = useState<string>("");
  const [screenshot, setScreenshot] = useState<string>("");
  const [message, setMessage] = useState<string>("מתחבר לבנק, ממלא פרטי העברה...");
  const [otp, setOtp] = useState("");
  const [successScreenshot, setSuccessScreenshot] = useState<string>("");

  const startExecution = useCallback(async () => {
    setStep("loading");
    setMessage("מאמת הרשאות ומפעיל דפדפן...");
    try {
      const res = await fetch(`/api/banking/transfers/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      if (!res.ok) {
        setStep("error");
        setMessage(json.error ?? json.data?.error ?? "שגיאה בהפעלת הסשן");
        return;
      }

      const data = json.data;
      setSessionId(data.sessionId);
      setScreenshot(data.screenshot);
      setMessage(data.message);
      setStep(data.step === "otp" ? "otp" : "screenshot");
    } catch {
      setStep("error");
      setMessage("שגיאת רשת — אנא נסה שוב");
    }
  }, [id]);

  const confirmTransfer = async () => {
    setStep("confirming");
    setMessage("שולח אישור לבנק...");
    try {
      const res = await fetch(`/api/banking/transfers/${id}/execute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: otp || undefined }),
      });
      const json = await res.json();
      const data = json.data;

      if (data.success) {
        setSuccessScreenshot(data.screenshot ?? "");
        setMessage(data.message);
        setStep("success");
        // Redirect after 4 seconds
        setTimeout(() => router.push("/portal/banking"), 4000);
      } else {
        setMessage(data.message ?? "לא ניתן לאמת הצלחה");
        setScreenshot(data.screenshot ?? screenshot);
        setStep("error");
      }
    } catch {
      setStep("error");
      setMessage("שגיאת רשת בשליחת האישור");
    }
  };

  useEffect(() => {
    startExecution();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="bg-white rounded-3xl border border-[#e8ecf4] w-full max-w-2xl"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-[#f1f5f9]">
          <button
            onClick={() => router.push("/portal/banking")}
            className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#334155] mb-4 transition-colors"
          >
            <ArrowLeft size={14} />
            חזרה לבנק
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] flex items-center justify-center">
              <ShieldCheck size={22} className="text-[#2563eb]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">ביצוע העברה בבנק</h1>
              <p className="text-sm text-[#64748b]">העברה מבוצעת דרך חיבור מאובטח לאתר הבנק</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* ── Loading ── */}
          {step === "loading" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 size={48} className="text-[#2563eb] animate-spin" />
              <p className="text-lg font-semibold text-[#1e293b]">{message}</p>
              <p className="text-sm text-[#94a3b8] text-center max-w-xs">
                הדפדפן מתחבר לאתר הבנק, ממלא פרטי הכניסה ומנווט לטופס ההעברה. זה לוקח כ-30 שניות.
              </p>
            </div>
          )}

          {/* ── Screenshot (confirm or otp) ── */}
          {(step === "screenshot" || step === "otp") && (
            <div className="space-y-5">
              <div className="bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] p-3 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#166534]">{message}</p>
              </div>

              {/* Bank screenshot */}
              <div className="rounded-xl overflow-hidden border border-[#e2e8f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="bg-[#1e293b] px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                    <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  </div>
                  <div className="flex-1 bg-[#334155] rounded text-xs text-[#94a3b8] px-3 py-1 text-center">
                    🔒 אתר הבנק — חיבור מאובטח
                  </div>
                </div>
                {screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/png;base64,${screenshot}`}
                    alt="מצב נוכחי בדפדפן הבנק"
                    className="w-full"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center bg-[#f8fafc] text-[#94a3b8]">
                    טוען תמונה...
                  </div>
                )}
              </div>

              {/* OTP input */}
              {step === "otp" && (
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    קוד OTP / SMS שקיבלת
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="הכנס קוד..."
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    maxLength={8}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={confirmTransfer}
                  disabled={step === "otp" && !otp.trim()}
                  className="flex-1 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  {step === "otp" ? "שלח OTP ואשר העברה" : "✅ אשר העברה"}
                </button>
                <button
                  onClick={() => router.push("/portal/banking")}
                  className="px-5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-medium py-3.5 rounded-xl transition-colors"
                >
                  ביטול
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] text-center">
                הסשן פג תוקף אחרי 5 דקות. לחיצה על "אשר" מבצעת את ההעברה בפועל בבנק.
              </p>
            </div>
          )}

          {/* ── Confirming ── */}
          {step === "confirming" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 size={48} className="text-[#16a34a] animate-spin" />
              <p className="text-lg font-semibold text-[#1e293b]">{message}</p>
            </div>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-20 h-20 rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-[#16a34a]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1e293b]">ההעברה בוצעה!</h2>
                <p className="text-[#64748b] text-center">{message}</p>
                <p className="text-xs text-[#94a3b8]">מעביר אותך חזרה לדף הבנק...</p>
              </div>

              {successScreenshot && (
                <div className="rounded-xl overflow-hidden border border-[#e2e8f0]">
                  <div className="bg-[#1e293b] px-4 py-2 text-xs text-[#94a3b8] text-center">
                    אישור מהבנק
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${successScreenshot}`}
                    alt="אישור ביצוע"
                    className="w-full"
                  />
                </div>
              )}

              <button
                onClick={() => router.push("/portal/banking")}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                חזרה לדף הבנק
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {step === "error" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-20 h-20 rounded-full bg-[#fee2e2] flex items-center justify-center">
                  <XCircle size={40} className="text-[#ef4444]" />
                </div>
                <h2 className="text-xl font-bold text-[#1e293b]">שגיאה</h2>
                <div className="bg-[#fff5f5] border border-[#fecaca] rounded-xl p-4 w-full">
                  <div className="flex gap-2">
                    <AlertCircle size={16} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#dc2626]">{message}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startExecution}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  נסה שוב
                </button>
                <button
                  onClick={() => router.push("/portal/banking")}
                  className="px-5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-medium py-3.5 rounded-xl transition-colors"
                >
                  חזרה
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] text-center">
                אם הבנק אינו נתמך לביצוע אוטומטי, חזור לדף הבנק ולחץ "בוצע ידנית" לאחר ביצוע ידני.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

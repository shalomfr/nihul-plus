"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";

/**
 * 3-step bank transfer execution flow:
 *
 * 1. loading    → Puppeteer logs in, fills form
 * 2. confirm    → Shows confirmation page screenshot, user clicks "אשר העברה"
 * 3. otp        → Bank sent SMS, user enters OTP code
 * 4. confirming → Sending action to bank...
 * 5. success    → Transfer completed
 * 6. error      → Something failed
 */
type Step = "loading" | "confirm" | "otp" | "confirming" | "success" | "error";

export default function ExecuteTransferPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [sessionId, setSessionId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [message, setMessage] = useState("מתחבר לבנק...");
  const [otp, setOtp] = useState("");
  const [successScreenshot, setSuccessScreenshot] = useState("");

  // Step 1: Start execution — login, fill form, get confirmation screenshot
  const startExecution = useCallback(async () => {
    setStep("loading");
    setMessage("מאמת הרשאות, מפעיל דפדפן ומתחבר לבנק...");
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
      setStep("confirm");
    } catch {
      setStep("error");
      setMessage("שגיאת רשת — אנא נסה שוב");
    }
  }, [id]);

  // Step 2: Click confirm on bank's confirmation page → triggers OTP
  const handleConfirm = async () => {
    setStep("confirming");
    setMessage("לוחץ אישור בבנק...");
    try {
      const res = await fetch(`/api/banking/transfers/${id}/execute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "confirm" }),
      });
      const json = await res.json();
      const data = json.data;

      if (data.step === "otp") {
        setScreenshot(data.screenshot ?? "");
        setMessage(data.message);
        setStep("otp");
      } else if (data.step === "success" && data.success) {
        setSuccessScreenshot(data.screenshot ?? "");
        setMessage(data.message);
        setStep("success");
        setTimeout(() => router.push("/portal/banking"), 4000);
      } else {
        setScreenshot(data.screenshot ?? screenshot);
        setMessage(data.message ?? "שגיאה לא צפויה");
        setStep("error");
      }
    } catch {
      setStep("error");
      setMessage("שגיאת רשת בשליחת האישור");
    }
  };

  // Step 3: Submit OTP code → complete transfer
  const handleOtpSubmit = async () => {
    if (!otp.trim()) return;
    setStep("confirming");
    setMessage("שולח קוד אימות לבנק...");
    try {
      const res = await fetch(`/api/banking/transfers/${id}/execute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "otp", otp }),
      });
      const json = await res.json();
      const data = json.data;

      if (data.success) {
        setSuccessScreenshot(data.screenshot ?? "");
        setMessage(data.message);
        setStep("success");
        setTimeout(() => router.push("/portal/banking"), 4000);
      } else {
        setScreenshot(data.screenshot ?? screenshot);
        setMessage(data.message ?? "לא ניתן לאמת הצלחה");
        setStep("error");
      }
    } catch {
      setStep("error");
      setMessage("שגיאת רשת בשליחת ה-OTP");
    }
  };

  useEffect(() => {
    startExecution();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step indicator (matches bank's 3-step wizard)
  const stepNumber = step === "loading" ? 0 : step === "confirm" ? 1 : step === "otp" ? 2 : step === "success" ? 3 : -1;
  const steps = [
    { n: 1, label: "פרטי העברה" },
    { n: 2, label: "אישור" },
    { n: 3, label: "סיום" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" dir="rtl">
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

          {/* Step indicator */}
          {stepNumber > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {steps.map((s) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      s.n < stepNumber
                        ? "bg-[#16a34a] text-white"
                        : s.n === stepNumber
                        ? "bg-[#2563eb] text-white"
                        : "bg-[#e2e8f0] text-[#94a3b8]"
                    }`}
                  >
                    {s.n < stepNumber ? "\u2713" : s.n}
                  </div>
                  <span className={`text-sm ${s.n === stepNumber ? "font-bold text-[#1e293b]" : "text-[#94a3b8]"}`}>
                    {s.label}
                  </span>
                  {s.n < 3 && <div className="w-8 h-[2px] bg-[#e2e8f0]" />}
                </div>
              ))}
            </div>
          )}
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
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#2563eb] animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Confirmation screenshot ── */}
          {step === "confirm" && (
            <div className="space-y-5">
              <div className="bg-[#eff6ff] rounded-xl border border-[#bfdbfe] p-3 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#1e40af]">{message}</p>
              </div>

              <BankScreenshot screenshot={screenshot} />

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  אשר העברה
                </button>
                <button
                  onClick={() => router.push("/portal/banking")}
                  className="px-5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-medium py-3.5 rounded-xl transition-colors"
                >
                  ביטול
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] text-center">
                בדוק שפרטי ההעברה נכונים. לחיצה על &ldquo;אשר העברה&rdquo; תשלח קוד אימות SMS לנייד שלך.
              </p>
            </div>
          )}

          {/* ── Step 2: OTP input ── */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="bg-[#fef3c7] rounded-xl border border-[#fcd34d] p-3 flex items-start gap-2">
                <KeyRound size={16} className="text-[#d97706] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#92400e]">{message}</p>
              </div>

              <BankScreenshot screenshot={screenshot} />

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  קוד אימות SMS
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && otp.trim()) handleOtpSubmit(); }}
                  placeholder="הכנס את הקוד שקיבלת..."
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
                  maxLength={8}
                  autoFocus
                />
                <p className="text-xs text-[#94a3b8] mt-1 text-center">
                  הקוד נשלח לנייד הרשום בבנק. אם לא קיבלת, נסה &ldquo;שלחו לי הקוד בדרך אחרת&rdquo;.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleOtpSubmit}
                  disabled={!otp.trim()}
                  className="flex-1 bg-[#d97706] hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound size={18} />
                  שלח קוד ואשר
                </button>
                <button
                  onClick={() => router.push("/portal/banking")}
                  className="px-5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-medium py-3.5 rounded-xl transition-colors"
                >
                  ביטול
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] text-center">
                הסשן פג תוקף אחרי 5 דקות. שליחת הקוד תשלים את ההעברה בפועל בבנק.
              </p>
            </div>
          )}

          {/* ── Confirming (loading between steps) ── */}
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

              {successScreenshot && <BankScreenshot screenshot={successScreenshot} label="אישור מהבנק" />}

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

              {screenshot && <BankScreenshot screenshot={screenshot} label="מצב אחרון" />}

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
                אם הבנק אינו נתמך, חזור לדף הבנק ולחץ &ldquo;בוצע ידנית&rdquo; לאחר ביצוע ידני.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BankScreenshot({ screenshot, label }: { screenshot: string; label?: string }) {
  if (!screenshot) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-[#e2e8f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="bg-[#1e293b] px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
        </div>
        <div className="flex-1 bg-[#334155] rounded text-xs text-[#94a3b8] px-3 py-1 text-center">
          {label ?? "login.bankhapoalim.co.il — חיבור מאובטח"}
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${screenshot}`}
        alt="צילום מסך מאתר הבנק"
        className="w-full"
      />
    </div>
  );
}

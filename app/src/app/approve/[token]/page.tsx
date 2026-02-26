"use client";
/**
 * Public Transfer Approval Page — accessible without login.
 * URL: /approve/[token]
 * Signatories land here from email/WhatsApp links to approve or reject transfers.
 */
import { useState, useEffect, use } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

type TransferInfo = {
  id: string;
  amount: number;
  purpose: string;
  description?: string;
  fromAccount?: { bankName: string; accountNumber: string };
  toExternalName?: string;
  transferDate: string;
  requiredApprovals: number;
  approvalCount: number;
  status: string;
  signatoryName: string;
  alreadySigned: boolean;
};

type PageState =
  | { phase: "loading" }
  | { phase: "ready"; info: TransferInfo; defaultAction?: "reject" }
  | { phase: "submitting" }
  | { phase: "done"; action: "APPROVED" | "REJECTED" }
  | { phase: "error"; message: string };

export default function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const defaultAction = searchParams.get("action") === "reject" ? "reject" : undefined;

    fetch(`/api/banking/transfers/approve-by-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setState({ phase: "ready", info: res.data, defaultAction });
        } else {
          setState({ phase: "error", message: res.error ?? "שגיאה בטעינת ההעברה" });
        }
      })
      .catch(() => setState({ phase: "error", message: "שגיאת רשת — אנא נסה שוב" }));
  }, [token]);

  const submit = async (action: "APPROVED" | "REJECTED") => {
    setState({ phase: "submitting" });
    const res = await fetch("/api/banking/transfers/approve-by-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, notes }),
    });
    const data = await res.json();
    if (data.success) {
      setState({ phase: "done", action });
    } else {
      setState({ phase: "error", message: data.error ?? "שגיאה בביצוע הפעולה" });
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-2">
            <span className="text-white font-bold text-lg">מ</span>
          </div>
          <p className="text-sm text-slate-500">מערכת מעטפת — ניהול עמותות</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {state.phase === "loading" && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-slate-600">טוען פרטי העברה...</p>
            </div>
          )}

          {state.phase === "error" && (
            <div className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">לא ניתן לטעון</h2>
              <p className="text-slate-500 text-sm">{state.message}</p>
            </div>
          )}

          {(state.phase === "ready" || state.phase === "submitting") && state.phase !== "submitting" && (
            <>
              {/* Header */}
              <div className="bg-blue-600 px-6 py-5 text-white text-center">
                <h1 className="text-xl font-bold">✍️ בקשת אישור העברה</h1>
                <p className="text-blue-100 text-sm mt-1">
                  שלום {state.info.signatoryName} — נדרשת חתימתך
                </p>
              </div>

              {/* Transfer details */}
              <div className="p-6">
                {state.info.alreadySigned && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
                    <p className="text-amber-700 text-sm font-medium">✓ כבר חתמת על העברה זו</p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4 mb-5">
                  <div className="text-3xl font-black text-blue-700 text-center mb-1">
                    ₪{state.info.amount.toLocaleString("he-IL")}
                  </div>
                  <p className="text-blue-600 text-center text-sm">סכום ההעברה</p>
                </div>

                <div className="space-y-3 mb-5">
                  <Row label="מטרה" value={state.info.purpose} />
                  {state.info.description && <Row label="תיאור" value={state.info.description} />}
                  {state.info.fromAccount && (
                    <Row
                      label="מחשבון"
                      value={`${state.info.fromAccount.bankName} — ${state.info.fromAccount.accountNumber}`}
                    />
                  )}
                  {state.info.toExternalName && (
                    <Row label="לנמען" value={state.info.toExternalName} />
                  )}
                  <Row
                    label="תאריך ביצוע"
                    value={new Date(state.info.transferDate).toLocaleDateString("he-IL")}
                  />
                  <Row
                    label="אישורים"
                    value={`${state.info.approvalCount} מתוך ${state.info.requiredApprovals} חתימות`}
                  />
                </div>

                {/* Notes */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    הערה (אופציונלי)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="הוסף הערה לאישור או דחייה..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={state.info.alreadySigned || state.info.status !== "PENDING_APPROVAL"}
                  />
                </div>

                {state.info.status !== "PENDING_APPROVAL" ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-slate-600 text-sm">
                      ההעברה כבר{" "}
                      {state.info.status === "APPROVED"
                        ? "אושרה ✅"
                        : state.info.status === "REJECTED"
                        ? "נדחתה ❌"
                        : state.info.status}
                    </p>
                  </div>
                ) : state.info.alreadySigned ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-green-700 text-sm">חתמת על העברה זו. ממתין לחתימות נוספות.</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => submit("APPROVED")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      אשר
                    </button>
                    <button
                      onClick={() => submit("REJECTED")}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      דחה
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {state.phase === "submitting" && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-slate-600">שומר...</p>
            </div>
          )}

          {state.phase === "done" && (
            <div className="p-8 text-center">
              {state.action === "APPROVED" ? (
                <>
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">ההעברה אושרה ✅</h2>
                  <p className="text-slate-500 text-sm">
                    חתימתך נרשמה בהצלחה. תקבל עדכון כשכל החתימות יתקבלו.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">ההעברה נדחתה ❌</h2>
                  <p className="text-slate-500 text-sm">
                    הדחייה נרשמה. המנהל יקבל הודעה מיידית.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          קישור זה תקף ל-48 שעות • מערכת מעטפת
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-slate-100">
      <span className="text-slate-500 text-sm shrink-0">{label}</span>
      <span className="text-slate-800 text-sm font-medium text-left">{value}</span>
    </div>
  );
}

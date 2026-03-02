"use client";
import { useState, useEffect, useCallback } from "react";

type WaStatus = {
  configured: boolean;
  status: string;
  phone: string | null;
  qrcode: string | null;
  qrCount: number;
  qrAge: number | null;
};

type Tab = "qr" | "phone";

export default function SettingsPage() {
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("qr");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp");
      const data = await res.json();
      setWa(data);
    } catch {
      setWa({ configured: false, status: "error", phone: null, qrcode: null, qrCount: 0, qrAge: null });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const doAction = async (action: string, extra?: Record<string, string>) => {
    setLoading(true);
    setError("");
    setPairingCode("");
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
      await fetchStatus();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = wa?.status === "connected";
  const hasQr = !!wa?.qrcode;

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">הגדרות</h1>
        <p className="text-sm text-[#64748b] mt-1">ניהול חיבורים ואינטגרציות</p>
      </div>

      {/* WhatsApp Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#dcfce7] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#16a34a">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#1e293b]">חיבור וואטסאפ</h2>
            <p className="text-sm text-[#64748b]">שליחת הודעות, אישורים והתראות ישירות ל-WhatsApp</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            isConnected
              ? "bg-[#dcfce7] text-[#16a34a]"
              : wa?.status === "qr_ready"
              ? "bg-[#fef3c7] text-[#d97706]"
              : "bg-[#f1f5f9] text-[#64748b]"
          }`}>
            {isConnected ? "מחובר" : wa?.status === "qr_ready" ? "ממתין לסריקה" : wa?.status === "connecting" ? "מתחבר..." : "לא מחובר"}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Connected */}
          {isConnected && (
            <div className="space-y-4">
              <div className="bg-[#dcfce7] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16a34a] flex items-center justify-center text-white text-lg font-bold">
                  &#10003;
                </div>
                <div>
                  <p className="font-bold text-[#15803d]">WhatsApp מחובר</p>
                  <p className="text-sm text-[#166534]">מספר: {wa.phone ?? "לא ידוע"}</p>
                </div>
              </div>
              <button
                onClick={() => doAction("disconnect")}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-[#fecaca] text-[#dc2626] font-medium hover:bg-[#fef2f2] transition-colors disabled:opacity-50"
              >
                {loading ? "מתנתק..." : "התנתק מ-WhatsApp"}
              </button>
            </div>
          )}

          {/* Not connected */}
          {!isConnected && (
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex bg-[#f1f5f9] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setTab("qr")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === "qr" ? "bg-white text-[#1e293b] shadow-sm" : "text-[#64748b]"
                  }`}
                >
                  קוד QR
                </button>
                <button
                  onClick={() => setTab("phone")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === "phone" ? "bg-white text-[#1e293b] shadow-sm" : "text-[#64748b]"
                  }`}
                >
                  מספר טלפון
                </button>
              </div>

              {/* QR */}
              {tab === "qr" && (
                <div className="space-y-4">
                  {hasQr && (
                    <div className="flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={wa.qrcode!} alt="QR Code" className="w-[250px] h-[250px] rounded-xl border border-[#e2e8f0]" />
                      <p className="text-xs text-[#94a3b8]">
                        סרוק עם WhatsApp &rarr; מכשירים מחוברים &rarr; חבר מכשיר
                      </p>
                      {wa.qrAge != null && wa.qrAge > 45 && (
                        <p className="text-xs text-[#d97706]">הקוד עומד לפוג — סרוק עכשיו!</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => doAction("connect")}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold transition-colors disabled:opacity-50"
                  >
                    {loading ? "מתחבר..." : hasQr ? "קבל קוד QR חדש" : "קבל קוד QR"}
                  </button>
                </div>
              )}

              {/* Phone */}
              {tab === "phone" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">מספר טלפון</label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && phoneInput.trim()) doAction("pair", { phone: phoneInput }); }}
                      placeholder="0501234567"
                      className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]"
                      dir="ltr"
                    />
                  </div>

                  {pairingCode && (
                    <div className="bg-[#eff6ff] rounded-xl border border-[#bfdbfe] p-4 text-center">
                      <p className="text-sm text-[#1e40af] mb-2">הכנס את הקוד הבא ב-WhatsApp:</p>
                      <p className="text-3xl font-mono font-bold tracking-[0.2em] text-[#1e293b]">{pairingCode}</p>
                      <p className="text-xs text-[#64748b] mt-2">
                        WhatsApp &rarr; מכשירים מחוברים &rarr; חבר מכשיר &rarr; חבר עם מספר טלפון
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => doAction("pair", { phone: phoneInput })}
                    disabled={loading || !phoneInput.trim()}
                    className="w-full py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "שולח..." : "קבל קוד חיבור"}
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3 text-sm text-[#dc2626]">
                  {error}
                </div>
              )}

              {wa && !wa.configured && (
                <div className="bg-[#fef3c7] border border-[#fcd34d] rounded-xl p-3 text-sm text-[#92400e]">
                  שירות WhatsApp לא מוגדר. הוסף WHATSAPP_SERVICE_URL ו-WHATSAPP_API_KEY למשתני הסביבה.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

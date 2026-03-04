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

type TemplateInfo = {
  key: string;
  authority: string;
  description: string;
  defaultEmail: string;
  overrideEmail: string | null;
  effectiveEmail: string;
};

const AUTHORITY_GROUPS: Record<string, string> = {
  "רשם העמותות": "#2563eb",
  "רשות המסים": "#7c3aed",
  "עירייה / רשות מקומית": "#0891b2",
  "ביטוח לאומי": "#059669",
  "בנק": "#d97706",
  "פנימי": "#64748b",
};

export default function SettingsPage() {
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("qr");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [error, setError] = useState("");

  // Template email overrides state
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [tmplLoading, setTmplLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [tmplMsg, setTmplMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null);

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

  // Fetch templates
  useEffect(() => {
    fetch("/api/authority-emails/overrides")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTemplates(res.data.templates);
      })
      .catch(console.error)
      .finally(() => setTmplLoading(false));
  }, []);

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

  const handleSaveEmail = async (key: string) => {
    setSavingKey(key);
    setTmplMsg(null);
    try {
      const res = await fetch("/api/authority-emails/overrides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: key, recipientEmail: editValue }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.key === key
              ? {
                  ...t,
                  overrideEmail: data.data.isOverride ? data.data.recipientEmail : null,
                  effectiveEmail: data.data.recipientEmail,
                }
              : t
          )
        );
        setEditingKey(null);
        setTmplMsg({ key, ok: true, text: "נשמר" });
        setTimeout(() => setTmplMsg((m) => (m?.key === key ? null : m)), 2000);
      } else {
        setTmplMsg({ key, ok: false, text: data.error ?? "שגיאה" });
      }
    } catch {
      setTmplMsg({ key, ok: false, text: "שגיאת רשת" });
    } finally {
      setSavingKey(null);
    }
  };

  const isConnected = wa?.status === "connected";
  const hasQr = !!wa?.qrcode;

  // Group templates by authority
  const grouped = templates.reduce<Record<string, TemplateInfo[]>>((acc, t) => {
    (acc[t.authority] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">הגדרות</h1>
        <p className="text-sm text-[#64748b] mt-1">ניהול חיבורים, אינטגרציות ותבניות</p>
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

      {/* Email Templates Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#fef3c7] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#1e293b]">תבניות מייל לרשויות</h2>
            <p className="text-sm text-[#64748b]">ניהול כתובות מייל לתבניות — ניתן להתאים את הכתובות לכל תבנית</p>
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#fef3c7] text-[#ca8a04]">
            {templates.length} תבניות
          </div>
        </div>

        <div className="p-6">
          {tmplLoading ? (
            <div className="text-center text-[#64748b] py-8">טוען תבניות...</div>
          ) : templates.length === 0 ? (
            <div className="text-center text-[#64748b] py-8">לא נמצאו תבניות</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([authority, items]) => (
                <div key={authority}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: AUTHORITY_GROUPS[authority] ?? "#94a3b8" }}
                    />
                    <h3 className="text-[14px] font-bold" style={{ color: AUTHORITY_GROUPS[authority] ?? "#475569" }}>
                      {authority}
                    </h3>
                    <span className="text-[11px] text-[#94a3b8]">({items.length})</span>
                  </div>

                  <div className="space-y-2">
                    {items.map((t) => {
                      const isEditing = editingKey === t.key;
                      const isSaving = savingKey === t.key;
                      const msg = tmplMsg?.key === t.key ? tmplMsg : null;
                      const isInternal = !t.defaultEmail && !t.overrideEmail;

                      return (
                        <div
                          key={t.key}
                          className="flex items-center gap-3 bg-[#f8f9fc] rounded-xl px-4 py-3 border border-[#e8ecf4]/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#1e293b] truncate">{t.description}</div>
                            {isInternal && !isEditing && (
                              <div className="text-[11px] text-[#94a3b8] mt-0.5">תבנית פנימית — ללא נמען</div>
                            )}
                            {!isInternal && !isEditing && (
                              <div className="text-[11px] text-[#64748b] mt-0.5" dir="ltr">
                                {t.effectiveEmail}
                                {t.overrideEmail && (
                                  <span className="mr-1 text-[#ca8a04]">(מותאם)</span>
                                )}
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveEmail(t.key); if (e.key === "Escape") setEditingKey(null); }}
                                placeholder={t.defaultEmail || "הכנס כתובת מייל"}
                                className="w-56 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#ca8a04]"
                                dir="ltr"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEmail(t.key)}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-[#ca8a04] text-white text-[11px] font-bold rounded-lg hover:bg-[#a16207] disabled:opacity-50"
                              >
                                {isSaving ? "..." : "שמור"}
                              </button>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="px-2 py-1.5 text-[#64748b] text-[11px] hover:text-[#1e293b]"
                              >
                                ביטול
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {msg && (
                                <span className={`text-[11px] font-semibold ${msg.ok ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                                  {msg.text}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingKey(t.key);
                                  setEditValue(t.overrideEmail ?? t.defaultEmail);
                                }}
                                className="px-3 py-1.5 text-[11px] font-semibold text-[#ca8a04] bg-[#fef3c7] rounded-lg hover:bg-[#fde68a] transition-colors"
                              >
                                ערוך
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

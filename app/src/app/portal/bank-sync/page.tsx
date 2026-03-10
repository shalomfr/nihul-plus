"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { useToast } from "@/components/Toast";
import {
  RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle,
  X, Shield, Clock, Landmark, CreditCard, Loader2, Eye, EyeOff,
} from "lucide-react";

/* ── Types ── */
type CredentialField = {
  key: string;
  label: string;
  type: "text" | "password";
};

type SupportedBank = {
  companyId: string;
  name: string;
  icon: string;
  type: "bank" | "card";
  fields: CredentialField[];
};

type Connection = {
  id: string;
  companyId: string;
  bankName: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  accountsFound: number;
  txnsSynced: number;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: "מחובר", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  PENDING_CONSENT: { label: "ממתין", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  ERROR: { label: "שגיאה", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  EXPIRED: { label: "פג תוקף", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  REVOKED: { label: "בוטל", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
};

export default function BankSyncPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [supportedBanks, setSupportedBanks] = useState<SupportedBank[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<SupportedBank | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const fetchData = () => {
    setLoading(true);
    fetch("/api/banking/scraper")
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setConnections(res.data.connections);
          setSupportedBanks(res.data.supportedBanks);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Connect new bank ── */
  const handleConnect = async () => {
    if (!selectedBank) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/banking/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedBank.companyId,
          credentials,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const conn = data.data.connection;
        if (conn.status === "ACTIVE") {
          showSuccess(`${selectedBank.name} חובר בהצלחה! ${data.data.sync?.accountsFound ?? 0} חשבונות, ${data.data.sync?.txnsSynced ?? 0} תנועות סונכרנו`);
        } else if (data.data.error) {
          showError(data.data.error);
        }
        setShowModal(false);
        setSelectedBank(null);
        setCredentials({});
        fetchData();
      } else {
        showError(data.error ?? "שגיאה בחיבור");
      }
    } catch {
      showError("שגיאה בחיבור לבנק");
    } finally {
      setConnecting(false);
    }
  };

  /* ── Sync existing ── */
  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      const res = await fetch(`/api/banking/scraper/${connectionId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showSuccess(`סונכרנו ${data.data.sync.accountsFound} חשבונות, ${data.data.sync.txnsSynced} תנועות חדשות`);
        fetchData();
      } else {
        showError(data.error ?? "שגיאה בסנכרון");
      }
    } catch {
      showError("שגיאה בסנכרון");
    } finally {
      setSyncingId(null);
    }
  };

  /* ── Delete connection ── */
  const handleDelete = async (connectionId: string) => {
    if (!confirm("למחוק את החיבור? הפעולה לא תמחק תנועות שכבר סונכרנו.")) return;
    setDeletingId(connectionId);
    try {
      const res = await fetch(`/api/banking/scraper/${connectionId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showSuccess("החיבור נמחק");
        fetchData();
      } else {
        showError(data.error ?? "שגיאה במחיקה");
      }
    } catch {
      showError("שגיאה במחיקה");
    } finally {
      setDeletingId(null);
    }
  };

  // Banks already connected
  const connectedIds = new Set(connections.map(c => c.companyId));

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="סנכרון בנק" subtitle="חבר את חשבון הבנק שלך לקבלת נתונים אוטומטית" />

      <div className="max-w-[700px]" data-tour="bank-sync-connections">
        {/* ─── EXISTING CONNECTIONS ─── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
          </div>
        ) : connections.length === 0 ? (
          <div className="anim-fade-up delay-1 bg-white rounded-2xl p-8 border border-[#e8ecf4] text-center mb-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] flex items-center justify-center mx-auto mb-4">
              <Landmark size={28} className="text-[#2563eb]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1e293b] mb-2">עדיין לא חיברת בנק</h3>
            <p className="text-[13px] text-[#64748b] mb-5">
              חבר את חשבון הבנק שלך כדי לסנכרן תנועות ויתרות באופן אוטומטי.
              <br />הפרטים נשמרים מוצפנים בשרת.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> חבר בנק
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {connections.map((conn, i) => {
              const st = STATUS_MAP[conn.status] ?? STATUS_MAP.ERROR;
              const isSyncing = syncingId === conn.id;
              const isDeleting = deletingId === conn.id;
              const bank = supportedBanks.find(b => b.companyId === conn.companyId);

              return (
                <div
                  key={conn.id}
                  className={`anim-fade-up delay-${(i % 6) + 1} bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift`}
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[18px]">
                        {bank?.icon ?? "🏦"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1e293b]">{conn.bankName}</span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border"
                            style={{ color: st.color, background: st.bg, borderColor: st.border }}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748b] mt-0.5">
                          <span>{conn.accountsFound} חשבונות</span>
                          <span>·</span>
                          <span>{conn.txnsSynced} תנועות</span>
                          {conn.lastSyncAt && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(conn.lastSyncAt).toLocaleDateString("he-IL")}
                                {" "}
                                {new Date(conn.lastSyncAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </>
                          )}
                        </div>
                        {conn.lastError && conn.status === "ERROR" && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-[#ef4444]">
                            <AlertCircle size={11} />
                            {conn.lastError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] px-3 py-2 rounded-xl hover:bg-[#eff6ff] transition-all disabled:opacity-50"
                      >
                        {isSyncing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        {isSyncing ? "מסנכרן..." : "סנכרן"}
                      </button>
                      <button
                        onClick={() => handleDelete(conn.id)}
                        disabled={isDeleting}
                        className="p-2 rounded-xl text-[#64748b] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-all disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setShowModal(true)}
              className="anim-fade-up delay-4 w-full p-4 rounded-2xl border-2 border-dashed border-[#e8ecf4] hover:border-[#2563eb]/30 text-[13px] font-semibold text-[#64748b] hover:text-[#2563eb] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> הוסף חיבור בנק
            </button>
          </div>
        )}

        {/* ─── SECURITY NOTICE ─── */}
        <div className="anim-fade-up delay-6 bg-[#f8f9fc] rounded-2xl p-4 border border-[#e8ecf4] flex items-start gap-3">
          <Shield size={18} className="text-[#2563eb] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-[#1e293b] mb-1">אבטחת מידע</div>
            <div className="text-[12px] text-[#64748b] leading-relaxed">
              פרטי ההתחברות שלך מוצפנים בהצפנת AES-256 ונשמרים בשרת מאובטח.
              אנחנו לא רואים את הפרטים שלך ולא שומרים סיסמאות בטקסט פתוח.
              הסנכרון מתבצע באמצעות ספריית קוד פתוח מוכרת.
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONNECT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e8ecf4]">
              <h2 className="text-[16px] font-bold text-[#1e293b]">
                {selectedBank ? `התחברות ל${selectedBank.name}` : "בחר בנק"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setSelectedBank(null); setCredentials({}); }}
                className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {!selectedBank ? (
                /* ── Bank Selection Grid ── */
                <>
                  {/* Banks */}
                  <div className="mb-5">
                    <div className="text-[12px] font-semibold text-[#64748b] mb-3 uppercase tracking-wide">בנקים</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {supportedBanks.filter(b => b.type === "bank").map(bank => {
                        const isConnected = connectedIds.has(bank.companyId);
                        return (
                          <button
                            key={bank.companyId}
                            onClick={() => {
                              if (!isConnected) {
                                setSelectedBank(bank);
                                setCredentials({});
                                setShowPasswords({});
                              }
                            }}
                            disabled={isConnected}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isConnected
                                ? "border-[#bbf7d0] bg-[#f0fdf4] opacity-60 cursor-not-allowed"
                                : "border-[#e8ecf4] hover:border-[#2563eb]/30 hover:bg-[#eff6ff]"
                            }`}
                          >
                            <div className="text-[20px] mb-1">{bank.icon}</div>
                            <div className="text-[11px] font-medium text-[#1e293b] leading-tight">{bank.name}</div>
                            {isConnected && (
                              <div className="text-[9px] text-[#16a34a] font-semibold mt-1">מחובר</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Credit Cards */}
                  <div>
                    <div className="text-[12px] font-semibold text-[#64748b] mb-3 uppercase tracking-wide">כרטיסי אשראי</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {supportedBanks.filter(b => b.type === "card").map(bank => {
                        const isConnected = connectedIds.has(bank.companyId);
                        return (
                          <button
                            key={bank.companyId}
                            onClick={() => {
                              if (!isConnected) {
                                setSelectedBank(bank);
                                setCredentials({});
                                setShowPasswords({});
                              }
                            }}
                            disabled={isConnected}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isConnected
                                ? "border-[#bbf7d0] bg-[#f0fdf4] opacity-60 cursor-not-allowed"
                                : "border-[#e8ecf4] hover:border-[#2563eb]/30 hover:bg-[#eff6ff]"
                            }`}
                          >
                            <div className="text-[20px] mb-1">{bank.icon}</div>
                            <div className="text-[11px] font-medium text-[#1e293b] leading-tight">{bank.name}</div>
                            {isConnected && (
                              <div className="text-[9px] text-[#16a34a] font-semibold mt-1">מחובר</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* ── Credential Form ── */
                <>
                  <button
                    onClick={() => { setSelectedBank(null); setCredentials({}); }}
                    className="text-[12px] font-semibold text-[#2563eb] hover:underline mb-4 flex items-center gap-1"
                  >
                    ← חזרה לבחירת בנק
                  </button>

                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]">
                    <div className="text-[24px]">{selectedBank.icon}</div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1e293b]">{selectedBank.name}</div>
                      <div className="text-[11px] text-[#64748b]">הזן את פרטי ההתחברות לאתר הבנק</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedBank.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[13px] font-medium text-[#1e293b] mb-1.5">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
                            value={credentials[field.key] ?? ""}
                            onChange={e => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                            dir="ltr"
                          />
                          {field.type === "password" && (
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                            >
                              {showPasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
                    <Shield size={14} className="text-[#d97706] flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] text-[#92400e] leading-relaxed">
                      הפרטים מוצפנים בהצפנת AES-256 ונשמרים בשרת מאובטח. הסנכרון עשוי לקחת עד דקה.
                    </span>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleConnect}
                      disabled={connecting || selectedBank.fields.some(f => !credentials[f.key]?.trim())}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connecting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          מתחבר ומסנכרן...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          התחבר וסנכרן
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowModal(false); setSelectedBank(null); setCredentials({}); }}
                      disabled={connecting}
                      className="px-5 py-2.5 rounded-xl border border-[#e8ecf4] text-[13px] font-semibold text-[#64748b] hover:bg-[#f8f9fc] transition-all disabled:opacity-50"
                    >
                      ביטול
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

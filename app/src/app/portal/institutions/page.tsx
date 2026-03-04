"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import {
  ArrowRight, Users, ShieldCheck, Megaphone, UserCheck,
  Mail, ChevronDown, ChevronUp, Loader2, CheckCircle,
  Eye, X, RefreshCw,
} from "lucide-react";
import type { AuthorityEmailKey } from "@/lib/authority-email-templates";

type BoardMember = {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
};

const INSTITUTIONS = [
  {
    key: "board",
    icon: Users,
    title: "ועד מנהל",
    description: "הגוף המנהל של העמותה — אחראי על ניהול שוטף וקבלת החלטות",
    color: "#2563eb",
    bg: "#eff6ff",
    href: "/portal/board",
  },
  {
    key: "audit",
    icon: ShieldCheck,
    title: "ועדת ביקורת",
    description: "גוף הפיקוח הפנימי — בודק את תקינות פעולות הועד",
    color: "#7c3aed",
    bg: "#f5f3ff",
    href: null,
  },
  {
    key: "assembly",
    icon: Megaphone,
    title: "אסיפה כללית",
    description: "הגוף העליון של העמותה — כולל את כל חברי העמותה",
    color: "#0891b2",
    bg: "#ecfeff",
    href: null,
  },
];

const AUTHORITY_TEMPLATES: { key: AuthorityEmailKey; label: string; authority: string; defaultEmail: string }[] = [
  // רשם העמותות
  { key: "registrar_extension_request", label: "בקשת ארכה להגשת דוחות", authority: "רשם העמותות", defaultEmail: "moked-amutot@justice.gov.il" },
  { key: "registrar_audit_response", label: "תגובה לממצאי ביקורת", authority: "רשם העמותות", defaultEmail: "moked-amutot@justice.gov.il" },
  { key: "registrar_document_submission", label: "הגשת מסמכים", authority: "רשם העמותות", defaultEmail: "moked-amutot@justice.gov.il" },
  { key: "registrar_board_change", label: "הודעה על שינוי חברי ועד", authority: "רשם העמותות", defaultEmail: "moked-amutot@justice.gov.il" },
  { key: "registrar_update_details", label: "עדכון פרטי עמותה", authority: "רשם העמותות", defaultEmail: "moked-amutot@justice.gov.il" },
  // רשות המסים
  { key: "tax_section46_renewal", label: "חידוש אישור סעיף 46", authority: "רשות המסים", defaultEmail: "malkar@taxes.gov.il" },
  { key: "tax_foreign_donation_report", label: "דיווח תרומה מישות זרה", authority: "רשות המסים", defaultEmail: "malkar@taxes.gov.il" },
  { key: "tax_bookkeeping_approval", label: "בקשת אישור ניהול ספרים", authority: "רשות המסים", defaultEmail: "amutot@taxes.gov.il" },
  // עירייה
  { key: "municipality_grant_request", label: "בקשת תמיכה מעירייה", authority: "עירייה / רשות מקומית", defaultEmail: "" },
  { key: "municipality_execution_report", label: "דוח ביצוע תמיכה", authority: "עירייה / רשות מקומית", defaultEmail: "" },
  // ביטוח לאומי
  { key: "bituach_leumi_volunteers", label: "רישום מתנדבים בביטוח לאומי", authority: "ביטוח לאומי", defaultEmail: "maasikim@nioi.gov.il" },
  // בנק
  { key: "bank_signatories_update", label: "עדכון מורשי חתימה בבנק", authority: "בנק", defaultEmail: "" },
  // פנימי
  { key: "board_meeting_protocol", label: "פרוטוקול ישיבת ועד", authority: "פנימי", defaultEmail: "" },
  { key: "general_assembly_protocol", label: "פרוטוקול אסיפה כללית", authority: "פנימי", defaultEmail: "" },
  { key: "conflict_of_interest_declaration", label: "הצהרת ניגוד עניינים", authority: "פנימי", defaultEmail: "" },
  { key: "family_relationship_declaration", label: "הצהרת קרבה משפחתית", authority: "פנימי", defaultEmail: "" },
  { key: "no_criminal_record_declaration", label: "הצהרת העדר עבירות", authority: "פנימי", defaultEmail: "" },
  { key: "section46_receipt", label: "קבלה על תרומה סעיף 46", authority: "פנימי", defaultEmail: "" },
  { key: "volunteer_certificate", label: "אישור התנדבות", authority: "פנימי", defaultEmail: "" },
];

export default function InstitutionsPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailBot, setShowEmailBot] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AuthorityEmailKey | "">("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stats/portal")
      .then(r => r.json())
      .then(res => {
        if (res.success) setMembers(res.data.board?.members ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-open email bot if URL has ?email= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailKey = params.get("email") as AuthorityEmailKey | null;
    if (emailKey && AUTHORITY_TEMPLATES.some(t => t.key === emailKey)) {
      setShowEmailBot(true);
      setSelectedTemplate(emailKey);
      const tmpl = AUTHORITY_TEMPLATES.find(t => t.key === emailKey);
      setRecipientEmail(tmpl?.defaultEmail ?? "");
    }
  }, []);

  const activeMembers = members.filter(m => m.isActive);
  const selectedTmpl = AUTHORITY_TEMPLATES.find(t => t.key === selectedTemplate);

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({ templateKey: selectedTemplate });
      if (customNotes) params.set("customNotes", customNotes);
      const res = await fetch(`/api/authority-emails/preview?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPreviewHtml(data.data.html);
        setPreviewSubject(data.data.subject);
        setShowPreview(true);
      }
    } catch {
      // silently fail
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/authority-emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedTemplate,
          recipientEmail: recipientEmail || undefined,
          customNotes: customNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ ok: true, message: `המייל נשלח בהצלחה אל ${data.data.to}` });
        setSelectedTemplate("");
        setRecipientEmail("");
        setCustomNotes("");
      } else {
        setSendResult({ ok: false, message: data.error ?? "שגיאה בשליחה" });
      }
    } catch {
      setSendResult({ ok: false, message: "שגיאת רשת" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="מוסדות העמותה" subtitle="ועד מנהל, ביקורת ואסיפה כללית" />

      <div className="max-w-[600px]">
        <Link href="/portal" className="anim-fade-up inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline mb-5">
          <ArrowRight size={14} /> חזרה לדשבורד
        </Link>

        <div className="space-y-3">
          {INSTITUTIONS.map((inst, i) => (
            <div
              key={inst.key}
              className={`anim-fade-up delay-${i + 1} bg-white rounded-2xl p-5 border border-[#e8ecf4] hover-lift`}
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: inst.bg }}
                >
                  <inst.icon size={22} style={{ color: inst.color }} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[15px] font-bold text-[#1e293b]">{inst.title}</div>
                    {inst.key === "board" && !loading && (
                      <span className="text-[11px] font-semibold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-lg border border-[#bfdbfe]">
                        {activeMembers.length} חברים
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#64748b] mb-3">{inst.description}</div>

                  {/* Board members preview */}
                  {inst.key === "board" && !loading && activeMembers.length > 0 && (
                    <div className="bg-[#f8f9fc] rounded-xl p-3 border border-[#e8ecf4]/50 space-y-1.5">
                      {activeMembers.slice(0, 5).map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCheck size={13} className="text-[#16a34a]" />
                            <span className="text-[12px] font-medium text-[#1e293b]">{member.name}</span>
                          </div>
                          <span className="text-[11px] text-[#64748b]">{member.role}</span>
                        </div>
                      ))}
                      {activeMembers.length > 5 && (
                        <div className="text-[11px] text-[#64748b] text-center pt-1">
                          +{activeMembers.length - 5} נוספים
                        </div>
                      )}
                    </div>
                  )}

                  {inst.href && (
                    <Link
                      href={inst.href}
                      className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-[#2563eb] hover:underline"
                    >
                      ניהול מלא →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Authority Email Bot */}
          <div
            className="anim-fade-up delay-4 bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          >
            <button
              onClick={() => setShowEmailBot(v => !v)}
              className="w-full flex items-center gap-4 p-5 text-right"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#fefce8]">
                <Mail size={22} className="text-[#ca8a04]" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-[#1e293b]">📨 בוט מיילים לרשויות</div>
                <div className="text-[12px] text-[#64748b]">שלח מייל מקצועי לרשם, רשות המסים, עירייה — בלחיצה אחת</div>
              </div>
              {showEmailBot ? <ChevronUp size={16} className="text-[#64748b]" /> : <ChevronDown size={16} className="text-[#64748b]" />}
            </button>

            {showEmailBot && (
              <div className="px-5 pb-5 border-t border-[#f1f5f9]">
                <div className="pt-4 space-y-3">
                  {sendResult && (
                    <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${sendResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {sendResult.ok && <CheckCircle size={14} />}
                      {sendResult.message}
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">בחר תבנית</label>
                    <select
                      value={selectedTemplate}
                      onChange={e => {
                        setSelectedTemplate(e.target.value as AuthorityEmailKey);
                        const tmpl = AUTHORITY_TEMPLATES.find(t => t.key === e.target.value);
                        setRecipientEmail(tmpl?.defaultEmail ?? "");
                      }}
                      className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      <option value="">-- בחר תבנית --</option>
                      {AUTHORITY_TEMPLATES.map(t => (
                        <option key={t.key} value={t.key}>{t.authority} — {t.label}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTmpl && (
                    <>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
                          כתובת דוא&quot;ל של הנמען
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={e => setRecipientEmail(e.target.value)}
                          placeholder={selectedTmpl.defaultEmail || "הכנס כתובת דוא״ל"}
                          className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
                          הערות נוספות (אופציונלי)
                        </label>
                        <textarea
                          value={customNotes}
                          onChange={e => setCustomNotes(e.target.value)}
                          rows={3}
                          placeholder="הוסף פרטים ספציפיים למקרה שלך..."
                          className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handlePreview}
                          disabled={previewLoading}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[#1e293b] text-[13px] font-semibold hover:bg-[#f8f9fc] transition-colors disabled:opacity-50"
                        >
                          {previewLoading ? <RefreshCw size={14} className="animate-spin" /> : <Eye size={14} />}
                          תצוגה מקדימה
                        </button>

                        <button
                          onClick={handleSendEmail}
                          disabled={sending || (!recipientEmail && !selectedTmpl.defaultEmail)}
                          className="flex-1 bg-[#ca8a04] hover:bg-[#a16207] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                          {sending ? "שולח..." : `שלח מייל ל${selectedTmpl.authority}`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ EMAIL PREVIEW MODAL ══ */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
              <div>
                <div className="text-[15px] font-bold text-[#1e293b]">תצוגה מקדימה של המייל</div>
                {previewSubject && <div className="text-[12px] text-[#64748b] mt-0.5">נושא: {previewSubject}</div>}
              </div>
              <button onClick={() => setShowPreview(false)} className="text-[#94a3b8] hover:text-[#1e293b] transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 overflow-hidden p-4">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[400px] rounded-xl border border-[#e8ecf4]"
                sandbox="allow-same-origin"
                title="תצוגה מקדימה של מייל"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-[#f1f5f9]">
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleSendEmail();
                }}
                disabled={sending || (!recipientEmail && !selectedTmpl?.defaultEmail)}
                className="flex-1 bg-[#ca8a04] hover:bg-[#a16207] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {sending ? "שולח..." : "שלח עכשיו"}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-5 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-medium text-[13px] hover:bg-[#f8f9fc] transition-colors"
              >
                חזור לעריכה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

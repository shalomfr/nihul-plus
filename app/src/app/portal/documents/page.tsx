"use client";
import { useState, useEffect, useRef } from "react";
import Topbar from "@/components/Topbar";
import { FileText, FolderOpen, Download, Search, Upload, X, AlertCircle, Link2, Check } from "lucide-react";
import { useToast } from "@/components/Toast";

type Document = {
  id: string;
  name: string;
  category: string;
  description?: string;
  fileUrl?: string;
  mimeType?: string;
  createdAt: string;
};

type ComplianceItem = {
  id: string;
  name: string;
  category: string;
  status: string;
  documentUrl?: string | null;
};

const categoryLabels: Record<string, string> = {
  FOUNDING: "מסמכי ייסוד",
  FINANCIAL: "כספי",
  COMPLIANCE: "ציות",
  BOARD: "ועד",
  GENERAL: "כללי",
};

const complianceCategoryLabels: Record<string, string> = {
  FOUNDING_DOCS: "מסמכי יסוד",
  ANNUAL_OBLIGATIONS: "חובות שנתיות",
  TAX_APPROVALS: "אישורי מס",
  FINANCIAL_MGMT: "ניהול כספי",
  DISTRIBUTION_DOCS: "מסמכי חלוקה",
  GOVERNANCE: "ממשל תאגידי",
  EMPLOYEES_VOLUNTEERS: "עובדים ומתנדבים",
  INSURANCE: "ביטוחים",
  GEMACH: 'גמ"ח',
};

const categoryTabs = [
  { key: "ALL", label: "הכל" },
  { key: "FOUNDING", label: "מסמכי ייסוד" },
  { key: "FINANCIAL", label: "כספי" },
  { key: "COMPLIANCE", label: "ציות" },
  { key: "BOARD", label: "ועד" },
  { key: "GENERAL", label: "כללי" },
];

export default function PortalDocumentsPage() {
  const { showSuccess, showError } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GENERAL");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link target state
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [linkTarget, setLinkTarget] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const linkDropdownRef = useRef<HTMLDivElement>(null);

  const fetchDocuments = () => {
    fetch("/api/documents")
      .then(r => r.json())
      .then(res => { if (res.success) setDocuments(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch compliance items when modal opens
  useEffect(() => {
    if (showUploadModal) {
      fetch("/api/compliance")
        .then(r => r.json())
        .then(res => {
          if (res.success) setComplianceItems(res.data.items ?? []);
        })
        .catch(console.error);
    }
  }, [showUploadModal]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(e.target as Node)) {
        setShowLinkDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredDocuments = documents.filter(doc => {
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory !== "ALL" && doc.category !== activeCategory) return false;
    return true;
  });

  // Group and filter compliance items
  const filteredComplianceItems = complianceItems.filter(item =>
    !linkSearch || item.name.includes(linkSearch)
  );

  const groupedItems = filteredComplianceItems.reduce<Record<string, ComplianceItem[]>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const selectedItemName = complianceItems.find(i => i.id === linkTarget)?.name ?? "";

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      showError("יש להזין שם מסמך");
      return;
    }
    if (!uploadFile) {
      showError("יש לבחור קובץ");
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", uploadFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        showError("שגיאה בהעלאת הקובץ");
        return;
      }

      const fileUrl = uploadData.data?.url;

      // Step 2: Create the document record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName.trim(),
          category: uploadCategory,
          fileUrl,
          mimeType: uploadFile.type,
        }),
      });
      const docData = await docRes.json();
      if (!docData.success) {
        showError("שגיאה בשמירת המסמך");
        return;
      }

      // Step 3: Link to compliance item if selected
      if (linkTarget && fileUrl) {
        await fetch(`/api/compliance/${linkTarget}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentUrl: fileUrl }),
        });
      }

      showSuccess(linkTarget ? "המסמך הועלה וקושר בהצלחה" : "המסמך הועלה בהצלחה");
      setShowUploadModal(false);
      setUploadName("");
      setUploadCategory("GENERAL");
      setUploadFile(null);
      setLinkTarget("");
      setLinkSearch("");
      fetchDocuments();
    } catch {
      showError("שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (doc: Document) => {
    if (doc.mimeType) {
      if (doc.mimeType.includes("pdf")) return "PDF";
      if (doc.mimeType.includes("spreadsheet") || doc.mimeType.includes("excel")) return "XLSX";
      if (doc.mimeType.includes("word") || doc.mimeType.includes("document")) return "DOC";
      if (doc.mimeType.includes("image")) return "IMG";
    }
    if (doc.fileUrl) {
      const ext = doc.fileUrl.split(".").pop()?.toUpperCase();
      if (ext) return ext.substring(0, 4);
    }
    return "PDF";
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="המסמכים שלי" subtitle="ספריית מסמכים – תקנון, אישורים, פרוטוקולים" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="המסמכים שלי" subtitle="ספריית מסמכים – תקנון, אישורים, פרוטוקולים" />

      <div className="max-w-[800px]">
        {/* ─── SEARCH + UPLOAD BAR ─── */}
        <div data-tour="documents-search" className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center bg-white border border-[#e8ecf4] rounded-xl px-3 py-2 gap-2 flex-1">
            <Search size={14} className="text-[#64748b]" />
            <input
              type="text"
              placeholder="חיפוש לפי שם..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[13px] text-[#1e293b] placeholder-[#94a3b8] w-full"
            />
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            <Upload size={14} />
            העלה מסמך
          </button>
        </div>

        {/* ─── CATEGORY TABS ─── */}
        <div data-tour="documents-tabs" className="flex gap-2 mb-4 flex-wrap">
          {categoryTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                activeCategory === tab.key
                  ? "bg-[#2563eb] text-white"
                  : "bg-white border border-[#e8ecf4] text-[#1e293b] hover:border-[#2563eb]/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── DOCUMENTS LIST ─── */}
        <div data-tour="documents-list" className="anim-fade-up delay-2 bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="p-5 border-b border-[#e8ecf4] flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <FolderOpen size={16} className="text-[#2563eb]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1e293b]">מסמכים ({filteredDocuments.length})</h3>
          </div>
          <div className="divide-y divide-[#e8ecf4]">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-[#64748b]">אין מסמכים</div>
            ) : (
              filteredDocuments.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`anim-fade-right delay-${(i % 5) + 1} flex items-center justify-between p-5 hover:bg-[#f8f9fc] transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                      <FileText size={18} className="text-[#2563eb]" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1e293b]">{doc.name}</div>
                      <div className="text-[11px] text-[#64748b]">
                        {getFileType(doc)} · {categoryLabels[doc.category] ?? doc.category} · {new Date(doc.createdAt).toLocaleDateString("he-IL")}
                      </div>
                    </div>
                  </div>
                  {doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-[#eff6ff] text-[#2563eb] transition-all">
                      <Download size={14} />
                    </a>
                  ) : (
                    <div className="relative group">
                      <button className="p-2 rounded-lg text-[#94a3b8] cursor-not-allowed" disabled>
                        <AlertCircle size={14} />
                      </button>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        אין קובץ
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── UPLOAD MODAL ─── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 border border-[#e8ecf4] max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#1e293b]">העלאת מסמך</h3>
              <button onClick={() => { setShowUploadModal(false); setLinkTarget(""); setLinkSearch(""); }} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">שם המסמך</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="לדוגמה: תקנון העמותה"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">קטגוריה</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                >
                  <option value="FOUNDING">מסמכי ייסוד</option>
                  <option value="FINANCIAL">כספי</option>
                  <option value="COMPLIANCE">ציות</option>
                  <option value="BOARD">ועד</option>
                  <option value="GENERAL">כללי</option>
                </select>
              </div>

              {/* ─── LINK TO COMPLIANCE ITEM ─── */}
              <div ref={linkDropdownRef} className="relative">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1e293b] mb-2">
                  <Link2 size={13} />
                  קשר לפריט באתר (אופציונלי)
                </label>
                {linkTarget ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#2563eb]/30 bg-[#eff6ff] text-[13px]">
                    <Check size={14} className="text-[#2563eb] flex-shrink-0" />
                    <span className="text-[#1e293b] flex-1 truncate">{selectedItemName}</span>
                    <button
                      type="button"
                      onClick={() => { setLinkTarget(""); setLinkSearch(""); }}
                      className="text-[#64748b] hover:text-[#1e293b] flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="text"
                        value={linkSearch}
                        onChange={e => { setLinkSearch(e.target.value); setShowLinkDropdown(true); }}
                        onFocus={() => setShowLinkDropdown(true)}
                        placeholder="חפש פריט לקישור... (אישור ניכוי מס, סעיף 46...)"
                        className="w-full pl-4 pr-9 py-3 rounded-xl border border-[#e8ecf4] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all text-[13px]"
                      />
                    </div>
                    {showLinkDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)", maxHeight: "240px", overflowY: "auto" }}>
                        {Object.keys(groupedItems).length === 0 ? (
                          <div className="p-3 text-[12px] text-[#64748b] text-center">לא נמצאו פריטים</div>
                        ) : (
                          Object.entries(groupedItems).map(([cat, items]) => (
                            <div key={cat}>
                              <div className="sticky top-0 bg-[#f8f9fc] px-3 py-1.5 text-[11px] font-bold text-[#64748b] border-b border-[#e8ecf4]">
                                {complianceCategoryLabels[cat] ?? cat}
                              </div>
                              {items.map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setLinkTarget(item.id);
                                    setShowLinkDropdown(false);
                                    setLinkSearch("");
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-right hover:bg-[#eff6ff] transition-colors border-b border-[#e8ecf4]/50 last:border-b-0"
                                >
                                  <span className="text-[12px] text-[#1e293b]">{item.name}</span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                    item.status === "OK" ? "text-[#16a34a] bg-[#f0fdf4]" :
                                    item.status === "WARNING" ? "text-[#d97706] bg-[#fffbeb]" :
                                    "text-[#ef4444] bg-[#fef2f2]"
                                  }`}>
                                    {item.documentUrl ? "יש מסמך" : "חסר מסמך"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1e293b] mb-2">קובץ</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 rounded-xl border border-dashed border-[#e8ecf4] bg-[#f8f9fc] text-[13px] text-[#64748b] hover:border-[#2563eb]/50 hover:bg-[#eff6ff] transition-all text-center"
                >
                  {uploadFile ? uploadFile.name : "לחץ לבחירת קובץ"}
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    מעלה...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    העלה
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

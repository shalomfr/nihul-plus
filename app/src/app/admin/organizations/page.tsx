"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { useToast } from "@/components/Toast";
import { Building2, ExternalLink, Plus, Search, X, Pencil, Trash2, Eye } from "lucide-react";

interface OrgData {
  id: string;
  name: string;
  number: string;
  users: number;
  workflows: number;
  donations: number;
  createdAt: string;
}

export default function AdminOrganizationsPage() {
  const { showSuccess, showError } = useToast();
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgData | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrganizations = useCallback(() => {
    setLoading(true);
    fetch("/api/stats/admin")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOrganizations(res.data.organizations ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  function openAddModal() {
    setFormName("");
    setFormNumber("");
    setShowAddModal(true);
  }

  function openEditModal(org: OrgData) {
    setSelectedOrg(org);
    setFormName(org.name);
    setFormNumber(org.number ?? "");
    setShowEditModal(true);
  }

  function openDetailsModal(org: OrgData) {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  }

  function openDeleteConfirm(org: OrgData) {
    setSelectedOrg(org);
    setShowDeleteConfirm(true);
  }

  async function handleAddOrg() {
    if (!formName.trim()) {
      showError("יש להזין שם ארגון");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), number: formNumber.trim() }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        showSuccess("הארגון נוצר בהצלחה");
        setShowAddModal(false);
        fetchOrganizations();
      } else {
        showError(data.error ?? "שגיאה ביצירת ארגון");
      }
    } catch {
      showError("שגיאה ביצירת ארגון");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditOrg() {
    if (!selectedOrg || !formName.trim()) {
      showError("יש להזין שם ארגון");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${selectedOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), number: formNumber.trim() }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        showSuccess("הארגון עודכן בהצלחה");
        setShowEditModal(false);
        fetchOrganizations();
      } else {
        showError(data.error ?? "שגיאה בעדכון ארגון");
      }
    } catch {
      showError("שגיאה בעדכון ארגון");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteOrg() {
    if (!selectedOrg) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${selectedOrg.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success || res.ok) {
        showSuccess("הארגון נמחק בהצלחה");
        setShowDeleteConfirm(false);
        fetchOrganizations();
      } else {
        showError(data.error ?? "שגיאה במחיקת ארגון");
      }
    } catch {
      showError("שגיאה במחיקת ארגון");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="ניהול ארגונים" subtitle="כל העמותות שמעטפת משרתת" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="ניהול ארגונים" subtitle="כל העמותות שמעטפת משרתת" />

      <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6 flex items-center justify-between flex-wrap gap-4" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center">
            <Building2 size={22} className="text-[#2563eb]" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#1e293b]">{organizations.length} ארגונים</div>
            <div className="text-sm text-[#64748b]">ניהול עמותות ומנויים</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="חיפוש ארגון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 pl-4 py-2 text-sm border border-[#e8ecf4] rounded-xl bg-[#f8f9fc] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all w-full sm:w-56"
            />
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> הוסף ארגון
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        {filteredOrgs.length === 0 ? (
          <div className="p-8 text-center text-[#64748b]">
            {search ? "לא נמצאו ארגונים התואמים לחיפוש" : "אין נתונים"}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8ecf4]">
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">ארגון</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">מס׳ רישום</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">משתמשים</th>
                <th className="hidden md:table-cell text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">אוטומציות</th>
                <th className="hidden md:table-cell text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">תרומות</th>
                <th className="hidden md:table-cell text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">תאריך הצטרפות</th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="border-b border-[#e8ecf4]/50 hover:bg-[#f8f9fc]">
                  <td className="p-4">
                    <button
                      onClick={() => openDetailsModal(org)}
                      className="text-[13px] font-medium text-[#2563eb] hover:underline cursor-pointer bg-transparent border-none"
                    >
                      {org.name}
                    </button>
                  </td>
                  <td className="p-4 text-[13px] text-[#64748b]">{org.number ?? "—"}</td>
                  <td className="p-4 text-[13px] text-[#1e293b]">{org.users}</td>
                  <td className="hidden md:table-cell p-4 text-[13px] text-[#1e293b]">{org.workflows}</td>
                  <td className="hidden md:table-cell p-4 text-[13px] text-[#1e293b]">{org.donations}</td>
                  <td className="hidden md:table-cell p-4 text-[13px] text-[#64748b]">
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDetailsModal(org)}
                        className="p-1.5 rounded-lg hover:bg-[#eff6ff] text-[#64748b] hover:text-[#2563eb] transition-colors"
                        title="צפה בפרטים"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(org)}
                        className="p-1.5 rounded-lg hover:bg-[#eff6ff] text-[#64748b] hover:text-[#2563eb] transition-colors"
                        title="ערוך"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(org)}
                        className="p-1.5 rounded-lg hover:bg-[#fef2f2] text-[#64748b] hover:text-[#e8445a] transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={14} />
                      </button>
                      <a
                        href={`/portal?org=${org.id}`}
                        className="inline-flex items-center gap-1.5 text-[12px] text-[#2563eb] font-semibold hover:underline mr-2"
                      >
                        <ExternalLink size={12} /> <span className="hidden md:inline">פתח בפורטל</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-[#e8ecf4] w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#1e293b]">הוסף ארגון חדש</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">שם הארגון</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="לדוגמה: עמותת אור לילד"
                  className="w-full px-4 py-2.5 text-sm border border-[#e8ecf4] rounded-xl bg-[#f8f9fc] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">מספר רישום (ע.ר.)</label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="לדוגמה: 580123456"
                  className="w-full px-4 py-2.5 text-sm border border-[#e8ecf4] rounded-xl bg-[#f8f9fc] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddOrg}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Plus size={16} />
                )}
                צור ארגון
              </button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-[#e8ecf4] w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#1e293b]">עריכת ארגון</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">שם הארגון</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-[#e8ecf4] rounded-xl bg-[#f8f9fc] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">מספר רישום (ע.ר.)</label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-[#e8ecf4] rounded-xl bg-[#f8f9fc] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleEditOrg}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Pencil size={16} />
                )}
                שמור שינויים
              </button>
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {showDetailsModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-[#e8ecf4] w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#1e293b]">פרטי ארגון</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50">
                <Building2 size={18} className="text-[#2563eb]" />
                <div>
                  <div className="text-[11px] text-[#64748b]">שם הארגון</div>
                  <div className="text-[14px] font-bold text-[#1e293b]">{selectedOrg.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50">
                  <div className="text-[11px] text-[#64748b]">מספר רישום</div>
                  <div className="text-[14px] font-bold text-[#1e293b]">{selectedOrg.number ?? "—"}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4]/50">
                  <div className="text-[11px] text-[#64748b]">תאריך יצירה</div>
                  <div className="text-[14px] font-bold text-[#1e293b]">
                    {selectedOrg.createdAt ? new Date(selectedOrg.createdAt).toLocaleDateString("he-IL") : "—"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#eff6ff] border border-[#dbeafe] text-center">
                  <div className="text-[11px] text-[#64748b]">משתמשים</div>
                  <div className="text-[18px] font-bold text-[#2563eb]">{selectedOrg.users}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-center">
                  <div className="text-[11px] text-[#64748b]">אוטומציות</div>
                  <div className="text-[18px] font-bold text-[#16a34a]">{selectedOrg.workflows}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-center">
                  <div className="text-[11px] text-[#64748b]">תרומות</div>
                  <div className="text-[18px] font-bold text-[#d97706]">{selectedOrg.donations}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <a
                href={`/portal?org=${selectedOrg.id}`}
                className="btn-primary flex items-center gap-2"
              >
                <ExternalLink size={14} /> פתח בפורטל
              </a>
              <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors">
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedOrg && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-[#e8ecf4] w-full sm:max-w-sm p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fef2f2] flex items-center justify-center">
                <Trash2 size={18} className="text-[#e8445a]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e293b]">מחיקת ארגון</h3>
                <p className="text-sm text-[#64748b]">פעולה זו לא ניתנת לביטול</p>
              </div>
            </div>
            <p className="text-sm text-[#1e293b] mb-6">
              האם אתה בטוח שברצונך למחוק את <span className="font-bold">{selectedOrg.name}</span>?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteOrg}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#e8445a] rounded-xl hover:bg-[#dc2626] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Trash2 size={14} />
                )}
                מחק
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

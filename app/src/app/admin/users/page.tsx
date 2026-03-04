"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { Users, UserPlus, Clock, CheckCircle, XCircle, Pause, Play, Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string | null;
  organizationName: string;
  organizationNumber: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<"pending" | "active" | "all">("pending");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?tab=${tab}`);
      const data = await res.json();
      if (data.success) setUsers(data.data);
      else showError(data.error ?? "שגיאה");
    } catch {
      showError("שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [tab]);

  async function approve(id: string) {
    try {
      const res = await fetch(`/api/users/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showSuccess("הבקשה אושרה");
        fetchUsers();
      } else {
        showError(data.error ?? "שגיאה");
      }
    } catch {
      showError("שגיאה");
    }
  }

  async function reject(id: string) {
    try {
      const res = await fetch(`/api/users/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showSuccess("הבקשה נדחתה");
        fetchUsers();
      } else {
        showError(data.error ?? "שגיאה");
      }
    } catch {
      showError("שגיאה");
    }
  }

  async function suspendUser(id: string, currentStatus: string | null) {
    const action = currentStatus === "SUSPENDED" ? "הפעלה" : "השהיה";
    if (!confirm(`האם ${action} משתמש זה?`)) return;
    try {
      const res = await fetch(`/api/users/${id}/suspend`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showSuccess(currentStatus === "SUSPENDED" ? "המשתמש הופעל" : "המשתמש הושהה");
        fetchUsers();
      } else {
        showError(data.error ?? "שגיאה");
      }
    } catch {
      showError("שגיאה");
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`האם למחוק את ${name}? פעולה זו בלתי הפיכה.`)) return;
    try {
      const res = await fetch(`/api/users/${id}/delete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showSuccess("המשתמש נמחק");
        fetchUsers();
      } else {
        showError(data.error ?? "שגיאה");
      }
    } catch {
      showError("שגיאה");
    }
  }

  const roleLabel = (r: string) => (r === "ADMIN" ? "Admin" : "מנהל עמותה");
  const statusLabel = (s: string | null) => {
    if (!s) return "–";
    const m: Record<string, string> = { PENDING: "ממתין", APPROVED: "אושר", REJECTED: "נדחה", SUSPENDED: "מושהה" };
    return m[s] ?? s;
  };

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="משתמשים והרשאות" subtitle="עובדי החברה + מנהלי עמותות" />

      <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6 flex items-center justify-between flex-wrap gap-4" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#2563eb]/10">
            <Users size={22} className="text-[#2563eb]" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#1e293b]">משתמשי מערכת</div>
            <div className="text-sm text-[#64748b]">Admin · מנהלי עמותות</div>
          </div>
        </div>
        <a href="/register" className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> הרשמת עמותה
        </a>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "pending", label: "בקשות ממתינות", icon: Clock },
          { key: "active", label: "משתמשים פעילים", icon: CheckCircle },
          { key: "all", label: "הכל", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as "pending" | "active" | "all")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-[#2563eb] text-white"
                : "bg-white border border-[#e8ecf4] text-[#1e293b] hover:border-[#2563eb]/50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div className="p-8 text-center text-[#64748b]">טוען...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#64748b]">אין משתמשים</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8ecf4]">
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  שם
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  תפקיד
                </th>
                <th className="hidden md:table-cell text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  אימייל
                </th>
                <th className="hidden lg:table-cell text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  ארגון
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="text-right p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#e8ecf4]/50 hover:bg-[#f8f9fc]"
                >
                  <td className="p-4 text-[13px] font-medium text-[#1e293b]">{user.name}</td>
                  <td className="p-4">
                    <span
                      className={`badge ${
                        user.role === "ADMIN" ? "badge-purple" : "badge-info"
                      }`}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell p-4 text-[13px] text-[#64748b]">{user.email}</td>
                  <td className="hidden lg:table-cell p-4 text-[13px] text-[#1e293b]">
                    {user.organizationName}
                    {user.organizationNumber !== "–" && ` (${user.organizationNumber})`}
                  </td>
                  <td className="p-4">
                    <span
                      className={`badge ${
                        user.status === "PENDING"
                          ? "badge-warning"
                          : user.status === "APPROVED"
                            ? "badge-success"
                            : user.status === "SUSPENDED"
                              ? "badge-purple"
                              : "badge-danger"
                      }`}
                    >
                      {statusLabel(user.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 justify-end">
                      {user.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => approve(user.id)}
                            className="p-2 rounded-lg bg-[#2ecc8f]/15 text-[#2ecc8f] hover:bg-[#2ecc8f]/25 transition-colors"
                            title="אישור"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => reject(user.id)}
                            className="p-2 rounded-lg bg-[#e8445a]/15 text-[#e8445a] hover:bg-[#e8445a]/25 transition-colors"
                            title="דחייה"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {user.role !== "ADMIN" && user.status !== "PENDING" && (
                        <>
                          <button
                            onClick={() => suspendUser(user.id, user.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === "SUSPENDED"
                                ? "bg-[#2ecc8f]/15 text-[#2ecc8f] hover:bg-[#2ecc8f]/25"
                                : "bg-[#d97706]/15 text-[#d97706] hover:bg-[#d97706]/25"
                            }`}
                            title={user.status === "SUSPENDED" ? "הפעל מחדש" : "השהה"}
                          >
                            {user.status === "SUSPENDED" ? <Play size={16} /> : <Pause size={16} />}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="p-2 rounded-lg bg-[#e8445a]/15 text-[#e8445a] hover:bg-[#e8445a]/25 transition-colors"
                            title="מחק"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

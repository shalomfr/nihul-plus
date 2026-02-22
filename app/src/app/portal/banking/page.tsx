"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { useToast } from "@/components/Toast";
import {
  Landmark, ArrowUpDown, Receipt, Plus, RefreshCw,
  TrendingUp, TrendingDown, Building2, CreditCard, AlertCircle,
  X, Filter,
} from "lucide-react";

type BankAccount = {
  id: string;
  bankName: string;
  bankCode: number;
  branchNumber: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  isPrimary: boolean;
  isActive: boolean;
  lastSyncAt: string | null;
  _count?: { transactions: number };
};

type BankTransaction = {
  id: string;
  amount: number;
  direction: string;
  description: string;
  counterpartyName: string | null;
  valueDate: string;
  bookingDate: string;
  balance: number | null;
  state: string;
};

type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  vendor: string | null;
  status: string;
  expenseDate: string;
  paidAt: string | null;
  bankAccount: { bankName: string; accountNumber: string } | null;
  budgetLine: { category: string; planned: number; actual: number } | null;
};

type ConnectionInfo = {
  isConfigured: boolean;
  supportedBanks: { bankCode: number; name: string; icon: string }[];
  connections: { bankCode: number; bankName: string; status: string }[];
};

const tabs = [
  { id: "accounts", label: "חשבונות", icon: Building2 },
  { id: "transactions", label: "תנועות", icon: ArrowUpDown },
  { id: "expenses", label: "הוצאות", icon: Receipt },
];

const categoryLabels: Record<string, string> = {
  SALARIES: "משכורות",
  RENT: "שכירות",
  ACTIVITIES: "פעילויות",
  MARKETING: "שיווק",
  ADMINISTRATION: "הנהלה וכלליות",
  TRANSPORTATION: "תחבורה",
  SUPPLIES: "ציוד",
  PROFESSIONAL_SERVICES: "שירותים מקצועיים",
  INSURANCE: "ביטוח",
  MAINTENANCE: "תחזוקה",
  OTHER: "אחר",
};

const statusLabels: Record<string, string> = {
  PENDING: "ממתין",
  PENDING_APPROVAL: "ממתין לאישור",
  APPROVED: "מאושר",
  PAID: "שולם",
  REJECTED: "נדחה",
  CANCELLED: "בוטל",
  PROCESSING: "בעיבוד",
  COMPLETED: "הושלם",
  FAILED: "נכשל",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-[#fef3c7] text-[#92400e]",
  PENDING_APPROVAL: "bg-[#fef3c7] text-[#92400e]",
  APPROVED: "bg-[#dbeafe] text-[#1e40af]",
  PAID: "bg-[#d1fae5] text-[#065f46]",
  REJECTED: "bg-[#fee2e2] text-[#991b1b]",
  CANCELLED: "bg-[#f3f4f6] text-[#6b7280]",
  PROCESSING: "bg-[#fef3c7] text-[#92400e]",
  COMPLETED: "bg-[#d1fae5] text-[#065f46]",
  FAILED: "bg-[#fee2e2] text-[#991b1b]",
};

const fmt = (n: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("he-IL");

export default function BankingPage() {
  const [tab, setTab] = useState("accounts");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<string>("");
  const { showSuccess, showError } = useToast();

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/banking/accounts");
    if (res.ok) {
      const json = await res.json();
      setAccounts(json.data ?? []);
      if (!selectedAccountId && json.data?.length > 0) {
        setSelectedAccountId(json.data[0].id);
      }
    }
  }, [selectedAccountId]);

  const fetchTransactions = useCallback(async (accountId: string) => {
    const params = new URLSearchParams();
    if (directionFilter) params.set("direction", directionFilter);
    const res = await fetch(`/api/banking/accounts/${accountId}/transactions?${params}`);
    if (res.ok) {
      const json = await res.json();
      setTransactions(json.data ?? []);
    }
  }, [directionFilter]);

  const fetchExpenses = useCallback(async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) {
      const json = await res.json();
      setExpenses(json.data ?? []);
    }
  }, []);

  const fetchConnection = useCallback(async () => {
    const res = await fetch("/api/banking/connect");
    if (res.ok) {
      const json = await res.json();
      setConnectionInfo(json.data ?? null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAccounts(), fetchExpenses(), fetchConnection()]);
      setLoading(false);
    };
    load();
  }, [fetchAccounts, fetchExpenses, fetchConnection]);

  useEffect(() => {
    if (selectedAccountId && tab === "transactions") {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId, tab, fetchTransactions]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.filter(e => e.status === "PAID").reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.get("amount")),
          description: form.get("description"),
          category: form.get("category"),
          vendor: form.get("vendor") || undefined,
          expenseDate: new Date(form.get("expenseDate") as string).toISOString(),
          bankAccountId: form.get("bankAccountId") || undefined,
          budgetLineId: form.get("budgetLineId") || undefined,
        }),
      });
      if (res.ok) {
        showSuccess("הוצאה נוספה בהצלחה");
        setShowExpenseModal(false);
        fetchExpenses();
      } else {
        showError("שגיאה בהוספת הוצאה");
      }
    } catch {
      showError("שגיאה בהוספת הוצאה");
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="בנק והוצאות" subtitle="ניהול חשבונות בנק, תנועות והוצאות" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="animate-spin text-[#2563eb]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="בנק והוצאות" subtitle="ניהול חשבונות בנק, תנועות והוצאות" />

      {/* Connection Status Banner */}
      {connectionInfo && !connectionInfo.isConfigured && (
        <div className="bg-[#fffbeb] rounded-2xl border border-[#fde68a] p-4 mb-6 flex items-center gap-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <AlertCircle size={20} className="text-[#d97706] flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-[#92400e]">Finanda לא מוגדר — </span>
            <span className="text-sm text-[#92400e]">חשבונות בנק מנוהלים ידנית. לסנכרון אוטומטי, הגדר את חיבור Finanda בהגדרות.</span>
          </div>
        </div>
      )}

      {connectionInfo?.isConfigured && connectionInfo.connections.length > 0 && (
        <div className="bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] p-4 mb-6 flex items-center gap-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <Landmark size={20} className="text-[#16a34a] flex-shrink-0" />
          <span className="text-sm font-medium text-[#166534]">
            מחובר ל-{connectionInfo.connections.filter((c) => c.status === "ACTIVE").length} בנקים דרך Finanda
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <Landmark size={20} className="text-[#2563eb]" />
            </div>
            <div className="text-xs text-[#64748b]">יתרה כוללת</div>
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{fmt(totalBalance)}</div>
          <div className="text-xs text-[#94a3b8] mt-1">{accounts.length} חשבונות</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#fef2f2] flex items-center justify-center">
              <Receipt size={20} className="text-[#ef4444]" />
            </div>
            <div className="text-xs text-[#64748b]">הוצאות ששולמו</div>
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{fmt(totalExpenses)}</div>
          <div className="text-xs text-[#94a3b8] mt-1">{expenses.length} הוצאות</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
              <CreditCard size={20} className="text-[#16a34a]" />
            </div>
            <div className="text-xs text-[#64748b]">חשבונות פעילים</div>
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{accounts.filter(a => a.isActive).length}</div>
          <div className="text-xs text-[#94a3b8] mt-1">מסונכרנים</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#f8f9fc] p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-[#1e293b] shadow-sm"
                : "text-[#64748b] hover:text-[#1e293b]"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "accounts" && (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-2xl border border-[#e8ecf4] p-5 ${account.isPrimary ? "border-r-4 border-r-[#2563eb]" : ""}`}
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center text-2xl">
                    🏦
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1e293b]">{account.bankName}</span>
                      {account.isPrimary && (
                        <span className="text-[10px] bg-[#eff6ff] text-[#2563eb] px-2 py-0.5 rounded-full font-medium">ראשי</span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748b] mt-0.5">
                      סניף {account.branchNumber} | חשבון {account.accountNumber}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-[#1e293b]">{fmt(account.balance)}</div>
                  {account.lastSyncAt && (
                    <div className="text-[10px] text-[#94a3b8]">
                      עודכן {fmtDate(account.lastSyncAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-12 text-[#94a3b8]">
              <Building2 size={40} className="mx-auto mb-3 opacity-50" />
              <p>אין חשבונות בנק עדיין</p>
            </div>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <select
                value={selectedAccountId ?? ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-sm border border-[#e8ecf4] rounded-lg px-3 py-2 bg-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.bankName} - {a.accountNumber}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[#64748b]" />
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="text-sm border border-[#e8ecf4] rounded-lg px-3 py-2 bg-white"
              >
                <option value="">הכל</option>
                <option value="CREDIT">זיכויים</option>
                <option value="DEBIT">חיובים</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="divide-y divide-[#f1f5f9]">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#f8f9fc] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.direction === "CREDIT" ? "bg-[#f0fdf4]" : "bg-[#fef2f2]"}`}>
                      {tx.direction === "CREDIT" ? (
                        <TrendingUp size={16} className="text-[#16a34a]" />
                      ) : (
                        <TrendingDown size={16} className="text-[#ef4444]" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1e293b]">{tx.description}</div>
                      <div className="text-xs text-[#94a3b8]">
                        {tx.counterpartyName && `${tx.counterpartyName} • `}
                        {fmtDate(tx.valueDate)}
                        {tx.state === "pending" && (
                          <span className="mr-2 text-[#d97706]">• ממתין</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${tx.direction === "CREDIT" ? "text-[#16a34a]" : "text-[#ef4444]"}`}>
                      {tx.direction === "CREDIT" ? "+" : "-"}{fmt(tx.amount)}
                    </div>
                    {tx.balance != null && (
                      <div className="text-[10px] text-[#94a3b8]">יתרה: {fmt(tx.balance)}</div>
                    )}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-12 text-[#94a3b8]">
                  <ArrowUpDown size={40} className="mx-auto mb-3 opacity-50" />
                  <p>אין תנועות</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              הוסף הוצאה
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="divide-y divide-[#f1f5f9]">
              {expenses.map((expense) => (
                <div key={expense.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#f8f9fc] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fef2f2] flex items-center justify-center">
                      <Receipt size={16} className="text-[#ef4444]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1e293b]">{expense.description}</div>
                      <div className="text-xs text-[#94a3b8]">
                        {expense.vendor && `${expense.vendor} • `}
                        {categoryLabels[expense.category] ?? expense.category}
                        {" • "}{fmtDate(expense.expenseDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[expense.status] ?? ""}`}>
                      {statusLabels[expense.status] ?? expense.status}
                    </span>
                    <div className="text-sm font-bold text-[#1e293b]">{fmt(expense.amount)}</div>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-12 text-[#94a3b8]">
                  <Receipt size={40} className="mx-auto mb-3 opacity-50" />
                  <p>אין הוצאות</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e293b]">הוספת הוצאה</h3>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-[#f8f9fc] rounded-lg">
                <X size={18} className="text-[#64748b]" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">סכום *</label>
                  <input name="amount" type="number" step="0.01" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">תאריך *</label>
                  <input name="expenseDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">תיאור *</label>
                <input name="description" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">קטגוריה</label>
                  <select name="category" className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">ספק</label>
                  <input name="vendor" className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">חשבון בנק</label>
                <select name="bankAccountId" className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm">
                  <option value="">— ללא —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountNumber}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">שמור</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 px-4 border border-[#e8ecf4] rounded-xl text-sm font-medium text-[#64748b] hover:bg-[#f8f9fc]">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

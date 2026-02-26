"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { useToast } from "@/components/Toast";
import {
  Landmark, ArrowUpDown, Receipt, Plus, RefreshCw,
  TrendingUp, TrendingDown, Building2, CreditCard, AlertCircle,
  X, Filter, Send, CheckCircle2, Clock, XCircle,
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

type BankTransfer = {
  id: string;
  amount: number;
  purpose: string;
  description: string | null;
  status: string;
  transferDate: string;
  fromAccount: { bankName: string; accountNumber: string } | null;
  toAccount: { bankName: string; accountNumber: string } | null;
  toExternalName: string | null;
  toExternalAccount: string | null;
  requestedBy: { name: string } | null;
  approvals: { signatory: { name: string }; action: string; signedAt: string }[];
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
  { id: "transfers", label: "העברות", icon: Send },
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
  EXECUTED: "בוצע",
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
  EXECUTED: "bg-[#d1fae5] text-[#065f46]",
  PAID: "bg-[#d1fae5] text-[#065f46]",
  REJECTED: "bg-[#fee2e2] text-[#991b1b]",
  CANCELLED: "bg-[#f3f4f6] text-[#6b7280]",
  PROCESSING: "bg-[#fef3c7] text-[#92400e]",
  COMPLETED: "bg-[#d1fae5] text-[#065f46]",
  FAILED: "bg-[#fee2e2] text-[#991b1b]",
};

const ISRAELI_BANKS = [
  { code: 10, name: "בנק לאומי" },
  { code: 12, name: "בנק הפועלים" },
  { code: 11, name: "בנק דיסקונט" },
  { code: 20, name: "בנק מזרחי טפחות" },
  { code: 31, name: "הבנק הבינלאומי" },
  { code: 14, name: "בנק אוצר החייל" },
  { code: 17, name: "בנק מרכנתיל דיסקונט" },
  { code: 9, name: "בנק הדואר" },
  { code: 46, name: "בנק מסד" },
  { code: 52, name: "בנק פועלי אגודת ישראל" },
  { code: 13, name: "בנק אגוד" },
  { code: 4, name: "בנק יהב" },
];

const fmt = (n: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("he-IL");

export default function BankingPage() {
  const [tab, setTab] = useState("accounts");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<string>("");
  const [transferDestType, setTransferDestType] = useState<"internal" | "external">("external");
  const [submitting, setSubmitting] = useState(false);
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

  const fetchTransfers = useCallback(async () => {
    const res = await fetch("/api/banking/transfers");
    if (res.ok) {
      const json = await res.json();
      setTransfers(json.data ?? []);
    }
  }, []);

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
      await Promise.all([fetchAccounts(), fetchExpenses(), fetchConnection(), fetchTransfers()]);
      setLoading(false);
    };
    load();
  }, [fetchAccounts, fetchExpenses, fetchConnection, fetchTransfers]);

  useEffect(() => {
    if (selectedAccountId && tab === "transactions") {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId, tab, fetchTransactions]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.filter(e => e.status === "PAID").reduce((sum, e) => sum + e.amount, 0);
  const pendingTransfers = transfers.filter(t => t.status === "PENDING_APPROVAL").length;

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/banking/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: form.get("bankName"),
          bankCode: Number(form.get("bankCode")),
          branchNumber: form.get("branchNumber"),
          accountNumber: form.get("accountNumber"),
          balance: Number(form.get("balance") || 0),
          availableBalance: Number(form.get("balance") || 0),
          isPrimary: form.get("isPrimary") === "on",
        }),
      });
      if (res.ok) {
        showSuccess("חשבון בנק נוסף בהצלחה");
        setShowAccountModal(false);
        fetchAccounts();
      } else {
        const err = await res.json();
        showError(err.error ?? "שגיאה בהוספת חשבון");
      }
    } catch {
      showError("שגיאה בהוספת חשבון");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        fromAccountId: form.get("fromAccountId"),
        amount: Number(form.get("amount")),
        purpose: form.get("purpose"),
        description: form.get("description") || undefined,
        transferDate: new Date(form.get("transferDate") as string).toISOString(),
      };
      if (transferDestType === "internal") {
        body.toAccountId = form.get("toAccountId");
      } else {
        body.toExternalAccount = form.get("toExternalAccount");
        body.toExternalBankCode = form.get("toExternalBankCode");
        body.toExternalName = form.get("toExternalName");
      }
      const res = await fetch("/api/banking/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showSuccess("העברה נוצרה — נשלחו הודעות לאישור מורשי חתימה");
        setShowTransferModal(false);
        fetchTransfers();
      } else {
        const err = await res.json();
        showError(err.error ?? "שגיאה ביצירת העברה");
      }
    } catch {
      showError("שגיאה ביצירת העברה");
    } finally {
      setSubmitting(false);
    }
  };

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
        <Topbar title="בנק והעברות" subtitle="ניהול חשבונות בנק, העברות ותנועות" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="animate-spin text-[#2563eb]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="בנק והעברות" subtitle="ניהול חשבונות בנק, העברות ותנועות" />

      {/* Connection Status Banner */}
      {connectionInfo && !connectionInfo.isConfigured && (
        <div className="bg-[#fffbeb] rounded-2xl border border-[#fde68a] p-4 mb-6 flex items-center gap-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <AlertCircle size={20} className="text-[#d97706] flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-[#92400e]">סנכרון בנק לא מוגדר — </span>
            <span className="text-sm text-[#92400e]">חשבונות מנוהלים ידנית. לסנכרון אוטומטי, הגדר חיבור scraper בהגדרות.</span>
          </div>
        </div>
      )}

      {connectionInfo?.isConfigured && connectionInfo.connections.length > 0 && (
        <div className="bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] p-4 mb-6 flex items-center gap-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <Landmark size={20} className="text-[#16a34a] flex-shrink-0" />
          <span className="text-sm font-medium text-[#166534]">
            מחובר ל-{connectionInfo.connections.filter((c) => c.status === "ACTIVE").length} בנקים — סנכרון אוטומטי יומי בשעה 07:45
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <Landmark size={20} className="text-[#2563eb]" />
            </div>
            <div className="text-xs text-[#64748b]">יתרה כוללת</div>
          </div>
          <div className="text-xl font-bold text-[#1e293b]">{fmt(totalBalance)}</div>
          <div className="text-xs text-[#94a3b8] mt-1">{accounts.length} חשבונות</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#fef2f2] flex items-center justify-center">
              <Receipt size={20} className="text-[#ef4444]" />
            </div>
            <div className="text-xs text-[#64748b]">הוצאות ששולמו</div>
          </div>
          <div className="text-xl font-bold text-[#1e293b]">{fmt(totalExpenses)}</div>
          <div className="text-xs text-[#94a3b8] mt-1">{expenses.length} הוצאות</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
              <CreditCard size={20} className="text-[#16a34a]" />
            </div>
            <div className="text-xs text-[#64748b]">חשבונות פעילים</div>
          </div>
          <div className="text-xl font-bold text-[#1e293b]">{accounts.filter(a => a.isActive).length}</div>
          <div className="text-xs text-[#94a3b8] mt-1">מסונכרנים</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ecf4] p-5 cursor-pointer hover:border-[#fde68a] transition-colors" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }} onClick={() => setTab("transfers")}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center">
              <Send size={20} className="text-[#d97706]" />
            </div>
            <div className="text-xs text-[#64748b]">ממתינות לאישור</div>
          </div>
          <div className="text-xl font-bold text-[#1e293b]">{pendingTransfers}</div>
          <div className="text-xs text-[#94a3b8] mt-1">העברות</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#f8f9fc] p-1 rounded-xl w-fit flex-wrap">
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
            {t.id === "transfers" && pendingTransfers > 0 && (
              <span className="bg-[#fde68a] text-[#92400e] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingTransfers}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── ACCOUNTS TAB ── */}
      {tab === "accounts" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAccountModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              הוסף חשבון בנק
            </button>
          </div>
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
                      {!account.isActive && (
                        <span className="text-[10px] bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded-full font-medium">לא פעיל</span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748b] mt-0.5">
                      סניף {account.branchNumber} | חשבון {account.accountNumber}
                      {account._count && <span className="mr-2">• {account._count.transactions} תנועות</span>}
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
              <p className="text-xs mt-1">לחץ "הוסף חשבון בנק" להוספת חשבון ידני</p>
            </div>
          )}
        </div>
      )}

      {/* ── TRANSFERS TAB ── */}
      {tab === "transfers" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTransferModal(true)}
              className="btn-primary flex items-center gap-2"
              disabled={accounts.length === 0}
            >
              <Plus size={16} />
              ביצוע העברה
            </button>
          </div>

          {accounts.length === 0 && (
            <div className="bg-[#fffbeb] rounded-2xl border border-[#fde68a] p-4 mb-4 text-sm text-[#92400e]">
              ⚠️ יש להוסיף חשבון בנק תחילה (לשונית "חשבונות") לפני ביצוע העברה.
            </div>
          )}

          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="bg-white rounded-2xl border border-[#e8ecf4] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transfer.status === "EXECUTED" ? "bg-[#d1fae5]" :
                      transfer.status === "REJECTED" ? "bg-[#fee2e2]" :
                      transfer.status === "PENDING_APPROVAL" ? "bg-[#fef3c7]" : "bg-[#eff6ff]"
                    }`}>
                      {transfer.status === "EXECUTED" ? <CheckCircle2 size={18} className="text-[#16a34a]" /> :
                       transfer.status === "REJECTED" ? <XCircle size={18} className="text-[#ef4444]" /> :
                       transfer.status === "PENDING_APPROVAL" ? <Clock size={18} className="text-[#d97706]" /> :
                       <Send size={18} className="text-[#2563eb]" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1e293b]">{transfer.purpose}</div>
                      <div className="text-xs text-[#64748b] mt-0.5">
                        מ: {transfer.fromAccount ? `${transfer.fromAccount.bankName} ${transfer.fromAccount.accountNumber}` : "—"}
                        {" → "}
                        {transfer.toAccount
                          ? `${transfer.toAccount.bankName} ${transfer.toAccount.accountNumber}`
                          : transfer.toExternalName
                          ? `${transfer.toExternalName} (${transfer.toExternalAccount})`
                          : "חיצוני"}
                      </div>
                      {transfer.description && (
                        <div className="text-xs text-[#94a3b8] mt-0.5">{transfer.description}</div>
                      )}
                      <div className="text-xs text-[#94a3b8] mt-1">
                        {fmtDate(transfer.transferDate)}
                        {transfer.requestedBy && ` • בוקש ע״י ${transfer.requestedBy.name}`}
                      </div>
                      {transfer.approvals.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {transfer.approvals.map((a, i) => (
                            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.action === "APPROVED" ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fee2e2] text-[#991b1b]"}`}>
                              {a.action === "APPROVED" ? "✓" : "✗"} {a.signatory.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-lg font-bold text-[#1e293b]">{fmt(transfer.amount)}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[transfer.status] ?? "bg-[#f3f4f6] text-[#6b7280]"}`}>
                      {statusLabels[transfer.status] ?? transfer.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {transfers.length === 0 && (
              <div className="text-center py-12 text-[#94a3b8]">
                <Send size={40} className="mx-auto mb-3 opacity-50" />
                <p>אין העברות עדיין</p>
                <p className="text-xs mt-1">לחץ "ביצוע העברה" כדי ליצור העברה חדשה</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {tab === "transactions" && (
        <div>
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

      {/* ── EXPENSES TAB ── */}
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

      {/* ══ MODAL: Add Bank Account ══ */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e293b]">הוספת חשבון בנק</h3>
              <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-[#f8f9fc] rounded-lg">
                <X size={18} className="text-[#64748b]" />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">בנק *</label>
                <select name="bankCode" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm"
                  onChange={(e) => {
                    const bank = ISRAELI_BANKS.find(b => b.code === Number(e.target.value));
                    if (bank) {
                      const nameInput = e.target.form?.elements.namedItem("bankName") as HTMLInputElement;
                      if (nameInput) nameInput.value = bank.name;
                    }
                  }}>
                  <option value="">— בחר בנק —</option>
                  {ISRAELI_BANKS.map(b => (
                    <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                  ))}
                  <option value="0">אחר</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">שם בנק *</label>
                <input name="bankName" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="ייתמלא אוטומטית עם בחירת הבנק" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">מספר סניף *</label>
                  <input name="branchNumber" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="למשל: 123" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">מספר חשבון *</label>
                  <input name="accountNumber" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="למשל: 12345678" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">יתרה נוכחית (₪)</label>
                <input name="balance" type="number" step="0.01" defaultValue={0} className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#1e293b] cursor-pointer">
                <input name="isPrimary" type="checkbox" className="rounded" />
                הגדר כחשבון ראשי
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? "שומר..." : "הוסף חשבון"}
                </button>
                <button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 py-2 px-4 border border-[#e8ecf4] rounded-xl text-sm font-medium text-[#64748b] hover:bg-[#f8f9fc]">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: New Transfer ══ */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e293b]">ביצוע העברה בנקאית</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-[#f8f9fc] rounded-lg">
                <X size={18} className="text-[#64748b]" />
              </button>
            </div>
            <div className="bg-[#eff6ff] rounded-xl p-3 mb-4 text-xs text-[#1e40af]">
              ✍️ לאחר יצירת ההעברה, יישלחו הודעות אימייל ו-WhatsApp לכל מורשי החתימה לאישור.
            </div>
            <form onSubmit={handleAddTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">חשבון מקור *</label>
                <select name="fromAccountId" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm">
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} — {a.accountNumber} ({fmt(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">יעד ההעברה</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTransferDestType("external")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${transferDestType === "external" ? "bg-[#eff6ff] border-[#2563eb] text-[#2563eb]" : "border-[#e8ecf4] text-[#64748b]"}`}
                  >
                    העברה חיצונית
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDestType("internal")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${transferDestType === "internal" ? "bg-[#eff6ff] border-[#2563eb] text-[#2563eb]" : "border-[#e8ecf4] text-[#64748b]"}`}
                  >
                    בין חשבונות
                  </button>
                </div>

                {transferDestType === "internal" ? (
                  <select name="toAccountId" className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm">
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.bankName} — {a.accountNumber}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#64748b] mb-1 block">שם הנמען *</label>
                      <input name="toExternalName" required={transferDestType === "external"} className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="שם מלא / שם עסק" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-[#64748b] mb-1 block">מספר חשבון *</label>
                        <input name="toExternalAccount" required={transferDestType === "external"} className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="12345678" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#64748b] mb-1 block">בנק</label>
                        <select name="toExternalBankCode" className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm">
                          <option value="">— בחר —</option>
                          {ISRAELI_BANKS.map(b => (
                            <option key={b.code} value={String(b.code)}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">סכום (₪) *</label>
                  <input name="amount" type="number" step="0.01" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-1 block">תאריך *</label>
                  <input name="transferDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">מטרת ההעברה *</label>
                <input name="purpose" required className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm" placeholder="למשל: תשלום שכר, רכישת ציוד..." />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1 block">תיאור נוסף</label>
                <textarea name="description" rows={2} className="w-full border border-[#e8ecf4] rounded-lg px-3 py-2 text-sm resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Send size={15} />
                  {submitting ? "שולח..." : "צור והשלח לאישור"}
                </button>
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2 px-4 border border-[#e8ecf4] rounded-xl text-sm font-medium text-[#64748b] hover:bg-[#f8f9fc]">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Add Expense ══ */}
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

"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, X, ArrowRight,
  Mail, Upload, Users, Landmark, Phone, FileText, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { getSmartActions, type ComplianceItem } from "@/lib/smart-actions";

const ACTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  mail: Mail,
  upload: Upload,
  users: Users,
  bank: Landmark,
  phone: Phone,
  docs: FileText,
  zap: Zap,
};

const getStatusIcon = (status: string) => {
  if (status === "OK") return <CheckCircle2 size={16} className="text-[#16a34a] flex-shrink-0" />;
  if (status === "EXPIRED" || status === "MISSING") return <AlertCircle size={16} className="text-[#ef4444] flex-shrink-0" />;
  return <AlertTriangle size={16} className="text-[#d97706] flex-shrink-0" />;
};

interface Props {
  item: ComplianceItem | null;
  onClose: () => void;
  onHandled?: () => void;
}

export default function SmartActionsModal({ item, onClose, onHandled }: Props) {
  const { showSuccess, showError } = useToast();
  const [updating, setUpdating] = useState(false);

  if (!item) return null;
  const config = getSmartActions(item);

  const handleMarkAsHandled = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/compliance/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OK", completedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`"${item.name}" סומן כמטופל`);
        onClose();
        onHandled?.();
      } else {
        showError("שגיאה בעדכון הסטטוס");
      }
    } catch {
      showError("שגיאה בעדכון הסטטוס");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-[#f1f5f9]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(item.status)}
              <span className="text-[15px] font-bold text-[#1e293b]">{item.name}</span>
            </div>
            <div className="text-[12px] text-[#64748b]">{config.headline}</div>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#1e293b] transition-colors ml-2 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Tip */}
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
            <p className="text-[12px] text-[#92400e] leading-relaxed">{config.tip}</p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#64748b] mb-2">בחר פעולה:</div>
            {config.actions.map((action, i) => {
              const Icon = ACTION_ICONS[action.icon] ?? FileText;
              return (
                <Link
                  key={i}
                  href={action.href ?? "#"}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#e8ecf4] hover:border-[#2563eb]/40 hover:bg-[#eff6ff] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#f8f9fc] group-hover:bg-[#eff6ff] flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon size={16} className="text-[#2563eb]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-[#1e293b]">{action.label}</div>
                    <div className="text-[11px] text-[#64748b]">{action.description}</div>
                  </div>
                  <ArrowRight size={14} className="text-[#cbd5e1] group-hover:text-[#2563eb] transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-1">
          <button
            onClick={handleMarkAsHandled}
            disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] font-semibold text-[13px] hover:bg-[#dcfce7] transition-colors disabled:opacity-50"
          >
            {updating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            סמן כמטופל
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf4] text-[#64748b] font-medium text-[13px] hover:bg-[#f1f5f9] transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

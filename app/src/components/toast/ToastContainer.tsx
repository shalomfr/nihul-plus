"use client";
import { useToast } from "./ToastContext";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: {
    bg: "#f0fdf4",
    border: "#16a34a",
    text: "#166534",
    icon: "#16a34a",
  },
  error: {
    bg: "#fef2f2",
    border: "#ef4444",
    text: "#991b1b",
    icon: "#ef4444",
  },
  warning: {
    bg: "#fffbeb",
    border: "#f59e0b",
    text: "#92400e",
    icon: "#f59e0b",
  },
  info: {
    bg: "#eff6ff",
    border: "#2563eb",
    text: "#1e40af",
    icon: "#2563eb",
  },
};

export default function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        const style = colors[toast.type];

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-lg backdrop-blur-sm animate-[toastSlideIn_0.3s_ease-out]"
            style={{
              background: style.bg,
              borderColor: style.border,
              color: style.text,
            }}
          >
            <Icon size={20} style={{ color: style.icon }} strokeWidth={2} />
            <span className="text-[14px] font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => hideToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors"
              aria-label="סגור"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

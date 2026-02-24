"use client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface BackButtonProps {
  fallback?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ fallback = "/portal", label = "חזרה", className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back in history, fallback to portal if no history
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e8ecf4] hover:border-[#2563eb]/30 hover:bg-[#eff6ff] transition-all text-[13px] font-medium text-[#64748b] hover:text-[#2563eb] ${className}`}
      aria-label={label}
    >
      <ArrowRight size={16} />
      <span>{label}</span>
    </button>
  );
}

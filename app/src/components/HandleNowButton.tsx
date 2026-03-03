"use client";
import { Zap } from "lucide-react";
import type { ComplianceItem } from "@/lib/smart-actions";

interface Props {
  item: ComplianceItem;
  onClick: (item: ComplianceItem) => void;
  size?: "sm" | "md";
}

export default function HandleNowButton({ item, onClick, size = "md" }: Props) {
  if (item.status === "OK") return null;
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(item); }}
      className={`font-bold text-white rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] transition-all flex items-center gap-1.5 flex-shrink-0 ${
        size === "sm" ? "text-[10px] px-2 py-1" : "text-[11px] px-3 py-1.5"
      }`}
    >
      <Zap size={size === "sm" ? 10 : 12} />
      טפל עכשיו
    </button>
  );
}

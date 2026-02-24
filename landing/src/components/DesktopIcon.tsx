"use client";
import { motion } from "motion/react";

type Props = {
  letter: string;
  title: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
  isOpen: boolean;
};

export default function DesktopIcon({
  letter,
  title,
  icon,
  gradient,
  onClick,
  isOpen,
}: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 group cursor-pointer w-[110px]"
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* macOS-style icon */}
      <div
        className={`mac-icon w-[80px] h-[80px] ${gradient} flex items-center justify-center`}
      >
        <div className="relative z-10 flex flex-col items-center gap-0.5">
          {icon}
        </div>
      </div>

      {/* Title */}
      <span className="text-[11px] leading-tight text-center text-white/90 font-medium max-w-full line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {title}
      </span>

      {/* Open indicator dot */}
      {isOpen && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}
    </motion.button>
  );
}

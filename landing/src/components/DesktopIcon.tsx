"use client";
import { motion } from "motion/react";

type Props = {
  letter: string;
  title: string;
  onClick: () => void;
  isOpen: boolean;
};

export default function DesktopIcon({ letter, title, onClick, isOpen }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group cursor-pointer w-[100px]"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Icon square */}
      <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-blue-500/20 flex items-center justify-center transition-shadow duration-200 group-hover:shadow-xl group-hover:shadow-blue-500/30">
        <span
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Secular One', sans-serif" }}
        >
          {letter}
        </span>
      </div>

      {/* Title */}
      <span className="text-[11px] leading-tight text-center text-[#1e293b] font-medium max-w-full line-clamp-2">
        {title}
      </span>

      {/* Open indicator dot */}
      {isOpen && (
        <motion.div
          className="w-1 h-1 rounded-full bg-[#2563eb]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          layoutId={`dot-${letter}`}
        />
      )}
    </motion.button>
  );
}

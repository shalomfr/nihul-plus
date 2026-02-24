"use client";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  id: string;
  title: string;
  children: React.ReactNode;
  isMaximized: boolean;
  position: { x: number; y: number };
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
};

export default function MacWindow({
  id,
  title,
  children,
  isMaximized,
  position,
  zIndex,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onDragEnd,
}: Props) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // On mobile or maximized: full-screen
  const isFullScreen = isMobile || isMaximized;

  return (
    <>
      {/* Drag constraints container (full viewport) */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: zIndex - 1 }}
      />

      <motion.div
        className="fixed"
        style={{
          zIndex,
          ...(isFullScreen
            ? { inset: 0 }
            : { top: position.y, left: position.x }),
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        drag={isFullScreen ? false : true}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        onDragEnd={(_, info) => {
          onDragEnd({
            x: position.x + info.offset.x,
            y: position.y + info.offset.y,
          });
        }}
        onPointerDown={onFocus}
      >
        <div
          className={`bg-white shadow-2xl shadow-black/15 flex flex-col overflow-hidden ${
            isFullScreen
              ? "w-full h-full rounded-none"
              : "w-[90vw] sm:w-[480px] md:w-[540px] max-h-[80vh] rounded-xl border border-[#d1d5db]"
          }`}
        >
          {/* ── Title bar ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 bg-[#f6f6f6] border-b border-[#e2e2e2] cursor-grab active:cursor-grabbing select-none shrink-0"
            onPointerDown={(e) => {
              if (!isFullScreen) dragControls.start(e);
            }}
          >
            {/* Traffic lights */}
            <div className="flex items-center gap-[7px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-[13px] h-[13px] rounded-full bg-[#ff5f57] hover:brightness-90 transition-all flex items-center justify-center group"
              >
                <svg
                  className="w-[7px] h-[7px] opacity-0 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 10 10"
                >
                  <path
                    d="M1 1L9 9M9 1L1 9"
                    stroke="#4a0002"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                className="w-[13px] h-[13px] rounded-full bg-[#febc2e] hover:brightness-90 transition-all flex items-center justify-center group"
              >
                <svg
                  className="w-[7px] h-[7px] opacity-0 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 10 10"
                >
                  <path
                    d="M1 5H9"
                    stroke="#995700"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
                className="w-[13px] h-[13px] rounded-full bg-[#28c840] hover:brightness-90 transition-all flex items-center justify-center group"
              >
                <svg
                  className="w-[8px] h-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 10 10"
                >
                  {isMaximized ? (
                    <>
                      <path
                        d="M3 1H9V7"
                        stroke="#006500"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path
                        d="M1 3H7V9H1Z"
                        stroke="#006500"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </>
                  ) : (
                    <path
                      d="M1 1L5 5M1 9L5 5M9 1L5 5M9 9L5 5"
                      stroke="#006500"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Title */}
            <span className="flex-1 text-[13px] font-medium text-[#4b4b4b] text-center truncate pr-[52px]">
              {title}
            </span>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6" dir="rtl">
            {children}
          </div>
        </div>
      </motion.div>
    </>
  );
}

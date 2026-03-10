"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, CheckCircle, List, SkipForward } from "lucide-react";
import { useTour } from "./TourContext";

interface TooltipRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(target: string): TooltipRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

/**
 * Smart tooltip positioning — never goes off-screen.
 * 1. Tries the requested position
 * 2. If it doesn't fit, tries the opposite side
 * 3. Final clamp to viewport edges
 */
function calcTooltipStyle(
  targetRect: TooltipRect,
  position: string,
  tooltipHeight: number,
): React.CSSProperties {
  const GAP = 14;
  const MARGIN = 12;
  const scrollY = window.scrollY;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = Math.min(320, vw - MARGIN * 2);

  // Target center in viewport
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  // Space available in each direction (viewport-relative)
  const spaceBelow = vh - (targetRect.top + targetRect.height);
  const spaceAbove = targetRect.top;
  const spaceRight = vw - (targetRect.left + targetRect.width);
  const spaceLeft = targetRect.left;

  let top: number;
  let left: number;

  // Determine best vertical placement
  const wantsBottom = position.startsWith("bottom") || position === "right" || position === "left" || !position;
  const fitsBelow = spaceBelow >= tooltipHeight + GAP;
  const fitsAbove = spaceAbove >= tooltipHeight + GAP;
  const fitsRight = spaceRight >= tooltipW + GAP;
  const fitsLeft = spaceLeft >= tooltipW + GAP;

  let finalPosition = position || "bottom";

  // Auto-flip logic
  if (finalPosition.startsWith("bottom") && !fitsBelow && fitsAbove) {
    finalPosition = finalPosition.replace("bottom", "top");
  } else if (finalPosition.startsWith("top") && !fitsAbove && fitsBelow) {
    finalPosition = finalPosition.replace("top", "bottom");
  } else if (finalPosition === "right" && !fitsRight) {
    finalPosition = fitsLeft ? "left" : fitsBelow ? "bottom" : "top";
  } else if (finalPosition === "left" && !fitsLeft) {
    finalPosition = fitsRight ? "right" : fitsBelow ? "bottom" : "top";
  } else if (finalPosition.startsWith("bottom") && !fitsBelow && !fitsAbove) {
    // No space above or below — place beside
    finalPosition = fitsRight ? "right" : fitsLeft ? "left" : "bottom";
  } else if (finalPosition.startsWith("top") && !fitsAbove && !fitsBelow) {
    finalPosition = fitsRight ? "right" : fitsLeft ? "left" : "top";
  }

  switch (finalPosition) {
    case "bottom":
    case "bottom-right":
      top = targetRect.top + targetRect.height + GAP + scrollY;
      left = targetCenterX - tooltipW / 2;
      break;
    case "bottom-left":
      top = targetRect.top + targetRect.height + GAP + scrollY;
      left = targetCenterX - tooltipW / 2;
      break;
    case "top":
    case "top-right":
    case "top-left":
      top = targetRect.top - GAP - tooltipHeight + scrollY;
      left = targetCenterX - tooltipW / 2;
      break;
    case "left":
      top = targetCenterY - tooltipHeight / 2 + scrollY;
      left = targetRect.left - tooltipW - GAP;
      break;
    case "right":
      top = targetCenterY - tooltipHeight / 2 + scrollY;
      left = targetRect.left + targetRect.width + GAP;
      break;
    default:
      top = targetRect.top + targetRect.height + GAP + scrollY;
      left = targetCenterX - tooltipW / 2;
  }

  // Clamp horizontal — always visible
  left = Math.max(MARGIN, Math.min(left, vw - tooltipW - MARGIN));

  // Clamp vertical — always in viewport
  const minTop = scrollY + MARGIN;
  const maxTop = scrollY + vh - tooltipHeight - MARGIN;
  top = Math.max(minTop, Math.min(top, maxTop));

  return { top, left, width: tooltipW };
}

export default function OnboardingTour() {
  const {
    isActive, currentStep, totalSteps, steps, nextStep, prevStep, skipTour,
    chapters, currentChapter, chapterIndex, isNavigating,
    showTOC, setShowTOC, goToChapter,
  } = useTour();
  const [targetRect, setTargetRect] = useState<TooltipRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(220);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  const step = steps[currentStep];

  // Measure actual tooltip height after render
  useEffect(() => {
    if (!tooltipRef.current) return;
    const h = tooltipRef.current.offsetHeight;
    if (h > 0 && h !== tooltipHeight) setTooltipHeight(h);
  });

  const updateRect = useCallback(() => {
    if (!step?.target) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect); // set even if null — so we can show fallback
  }, [step?.target]);

  useEffect(() => {
    if (!isActive || !step) return;
    setTargetRect(null);
    if (step.target) {
      if (step.mobileSkip && isMobile) { nextStep(); return; }
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      // Poll for element — it may not exist yet after navigation
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        const r = getTargetRect(step.target!);
        if (r) {
          setTargetRect(r);
          clearInterval(interval);
        } else if (elapsed >= 3000) {
          // Element never appeared — show tooltip centered
          setTargetRect(null);
          clearInterval(interval);
        }
      }, 100);
      // Initial check after scroll settles
      const t = setTimeout(updateRect, 400);
      return () => { clearTimeout(t); clearInterval(interval); };
    }
  }, [isActive, step, updateRect, nextStep, isMobile]);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateRect();
        setIsMobile(window.innerWidth < 768);
        ticking = false;
      });
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, { passive: true });
    return () => { window.removeEventListener("resize", handler); window.removeEventListener("scroll", handler); };
  }, [updateRect]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === "Escape") skipTour();
      if (e.key === "ArrowLeft") nextStep();
      if (e.key === "ArrowRight") prevStep();
      if (e.key === "Enter") nextStep();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!mounted || !isActive || !step) return null;

  const isWelcome = step.type === "welcome";
  const isCompletion = step.type === "completion";
  const isChapterIntro = step.type === "chapter-intro";
  const isCentered = isWelcome || isCompletion || isChapterIntro;

  // Next chapter for "skip to next chapter"
  const nextChapterIdx = chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapterIndex + 1 : -1;
  const nextChapterData = nextChapterIdx >= 0 ? chapters[nextChapterIdx] : null;

  // Chapter progress
  const chapterStepStart = currentChapter?.startIndex ?? 0;
  const chapterStepCount = currentChapter?.stepCount ?? 1;
  const stepInChapter = currentStep - chapterStepStart + 1;
  const overallProgress = Math.round(((currentStep + 1) / totalSteps) * 100);

  const overlayContent = (
    <div className="fixed inset-0 z-[9999]" dir="rtl">
      {/* Dark overlay with spotlight cutout */}
      {isCentered || !targetRect ? (
        <div className="absolute inset-0 bg-black/60 tour-fade-in" />
      ) : (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-spotlight-mask)" />
          <rect
            x={targetRect.left - 8}
            y={targetRect.top - 8}
            width={targetRect.width + 16}
            height={targetRect.height + 16}
            rx="12"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
        </svg>
      )}

      {/* Navigating shimmer */}
      {isNavigating && (
        <div className="absolute inset-0 flex items-center justify-center z-[10001]">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
            <div className="animate-spin w-5 h-5 border-[3px] border-[#2563eb] border-t-transparent rounded-full" />
            <span className="text-[14px] font-medium text-[#1e293b]">עובר לדף הבא...</span>
          </div>
        </div>
      )}

      {/* Table of Contents */}
      {showTOC && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-[10002]">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl tour-fade-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1e293b]">תוכן הסיור</h3>
              <button onClick={() => setShowTOC(false)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1.5">
              {chapters.map((ch, i) => {
                const isCurrentCh = ch.key === currentChapter?.key;
                const isPast = chapterIndex > i;
                return (
                  <button
                    key={ch.key}
                    onClick={() => goToChapter(ch.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all ${
                      isCurrentCh
                        ? "bg-[#2563eb] text-white"
                        : isPast
                        ? "bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]"
                        : "bg-[#f8f9fc] text-[#64748b] hover:bg-[#eff6ff] hover:text-[#2563eb]"
                    }`}
                  >
                    <span className="text-[18px] flex-shrink-0">{ch.icon}</span>
                    <span className="text-[13px] font-medium flex-1">{ch.title}</span>
                    {isPast && <CheckCircle size={14} className="flex-shrink-0" />}
                    {isCurrentCh && <ChevronLeft size={14} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#e8ecf4]">
              <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-2">
                <span>התקדמות כללית</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-l from-[#2563eb] to-[#7c3aed] transition-all duration-500" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered cards (welcome / chapter-intro / completion) */}
      {isCentered && !showTOC && !isNavigating && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl tour-fade-in">
            {isCompletion ? (
              <div className="mb-6">
                <div className="tour-completion-circle w-20 h-20 rounded-full bg-[#f0fdf4] border-4 border-[#bbf7d0] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-[#16a34a] tour-check" />
                </div>
                <div className="flex justify-center gap-1.5 mb-4">
                  {["#2563eb", "#16a34a", "#d97706", "#ef4444", "#8b5cf6"].map((c, i) => (
                    <div key={i} className="w-2 h-2 rounded-full tour-confetti" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            ) : isChapterIntro ? (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#eff6ff] to-[#e0e7ff] flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">{step.icon ?? "📋"}</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">👋</span>
              </div>
            )}

            {isChapterIntro && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff6ff] text-[#2563eb] text-[11px] font-semibold mb-3">
                פרק {chapterIndex + 1} מתוך {chapters.length}
              </div>
            )}

            <h2 className="text-[20px] font-bold text-[#1e293b] mb-3">{step.title}</h2>
            <p className="text-[14px] text-[#64748b] leading-relaxed mb-6">{step.description}</p>

            {!isWelcome && (
              <div className="mb-5">
                <div className="h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-l from-[#2563eb] to-[#7c3aed] transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {!isCompletion && (
                <button onClick={skipTour} className="px-4 py-2.5 rounded-xl border border-[#e8ecf4] text-[13px] text-[#64748b] font-medium hover:bg-[#f8f9fc] transition-colors">
                  דלג על הסיור
                </button>
              )}
              <button onClick={isCompletion ? skipTour : nextStep} className="px-6 py-2.5 rounded-xl bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors">
                {isCompletion ? "סגור" : isChapterIntro ? "התחל פרק" : "בואו נתחיל!"}
              </button>
            </div>

            {!isWelcome && !isCompletion && (
              <button onClick={() => setShowTOC(true)} className="mt-4 text-[12px] text-[#94a3b8] hover:text-[#2563eb] transition-colors flex items-center gap-1 mx-auto">
                <List size={12} />
                תוכן הסיור
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tooltip for highlight steps */}
      {!isCentered && !showTOC && !isNavigating && (
        <div
          ref={tooltipRef}
          className={`bg-white shadow-2xl tour-slide-tooltip ${
            isMobile
              ? "fixed bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8"
              : "absolute rounded-2xl p-5"
          }`}
          style={isMobile
            ? { zIndex: 10000 }
            : {
              ...(targetRect
                ? calcTooltipStyle(targetRect, step.position ?? "bottom", tooltipHeight)
                : { position: "fixed" as const, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: Math.min(320, window.innerWidth - 24) }),
              zIndex: 10000,
            }
          }
        >
          {/* Chapter header + TOC button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {currentChapter && (
                <button
                  onClick={() => setShowTOC(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff6ff] text-[#2563eb] text-[10px] font-semibold hover:bg-[#dbeafe] transition-colors"
                >
                  <span>{currentChapter.icon}</span>
                  <span>{currentChapter.title}</span>
                </button>
              )}
            </div>
            <button onClick={skipTour} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#94a3b8] hover:text-[#64748b] transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Step progress bars for chapter */}
          <div className="flex gap-1 mb-3">
            {Array.from({ length: chapterStepCount }).map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full flex-1 transition-colors"
                style={{ background: i < stepInChapter ? "#2563eb" : "#e2e8f0" }}
              />
            ))}
          </div>

          <h3 className="text-[15px] font-bold text-[#1e293b] mb-2">{step.title}</h3>
          <p className="text-[13px] text-[#64748b] leading-relaxed mb-4">{step.description}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94a3b8]">{currentStep + 1} / {totalSteps}</span>
              {nextChapterData && (
                <button
                  onClick={() => goToChapter(nextChapterData.key)}
                  className="flex items-center gap-1 text-[11px] text-[#94a3b8] hover:text-[#2563eb] transition-colors"
                >
                  <SkipForward size={10} />
                  דלג לפרק הבא
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={prevStep} className="p-2 rounded-xl border border-[#e8ecf4] text-[#64748b] hover:bg-[#f8f9fc] transition-colors">
                  <ChevronRight size={14} />
                </button>
              )}
              <button onClick={nextStep} className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[12px] font-semibold hover:bg-[#1d4ed8] transition-colors flex items-center gap-1.5">
                {currentStep === totalSteps - 2 ? "סיים" : "הבא"}
                <ChevronLeft size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlayContent, document.body);
}

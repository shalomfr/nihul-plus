"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { TourStep, TourChapter } from "./tourSteps";
import { extractChapters } from "./tourSteps";

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  steps: TourStep[];
  chapters: TourChapter[];
  currentChapter: TourChapter | null;
  chapterIndex: number;
  isNavigating: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToChapter: (chapterKey: string) => void;
  showTOC: boolean;
  setShowTOC: (open: boolean) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

interface TourProviderProps {
  tourId: string;
  steps: TourStep[];
  children: ReactNode;
}

function waitForElement(target: string, maxWait = 2000): Promise<boolean> {
  return new Promise(resolve => {
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (el) { resolve(true); return; }

    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      const found = document.querySelector(`[data-tour="${target}"]`);
      if (found || elapsed >= maxWait) {
        clearInterval(timer);
        resolve(!!found);
      }
    }, interval);
  });
}

export function TourProvider({ tourId, steps, children }: TourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const storageKey = `tour-${tourId}-completed`;
  const stepKey = `tour-${tourId}-step`;
  const navigatingRef = useRef(false);

  const chapters = extractChapters(steps);

  const step = steps[currentStep];
  const currentChapter = step?.chapter
    ? chapters.find(c => c.key === step.chapter) ?? null
    : null;
  const chapterIndex = currentChapter ? chapters.indexOf(currentChapter) : -1;

  const navigateToStep = useCallback(async (targetStep: TourStep) => {
    if (targetStep.page && targetStep.page !== pathname) {
      navigatingRef.current = true;
      setIsNavigating(true);
      router.push(targetStep.page);
      await new Promise(r => setTimeout(r, 600));
    }
    if (targetStep.target) {
      await waitForElement(targetStep.target);
    }
    navigatingRef.current = false;
    setIsNavigating(false);
  }, [pathname, router]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setShowTOC(false);
    if (typeof window !== "undefined") localStorage.removeItem(stepKey);
  }, [stepKey]);

  const nextStep = useCallback(async () => {
    if (navigatingRef.current) return;
    const next = currentStep + 1;
    if (next >= steps.length) {
      setIsActive(false);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "1");
        localStorage.removeItem(stepKey);
      }
      return;
    }
    const nextStepData = steps[next];
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (nextStepData.mobileSkip && isMobile) {
      setCurrentStep(next);
      return;
    }
    await navigateToStep(nextStepData);
    setCurrentStep(next);
    if (typeof window !== "undefined") localStorage.setItem(stepKey, String(next));
  }, [currentStep, steps, navigateToStep, storageKey, stepKey]);

  const prevStep = useCallback(async () => {
    if (navigatingRef.current) return;
    const prev = Math.max(0, currentStep - 1);
    if (prev !== currentStep) {
      await navigateToStep(steps[prev]);
      setCurrentStep(prev);
      if (typeof window !== "undefined") localStorage.setItem(stepKey, String(prev));
    }
  }, [currentStep, steps, navigateToStep, stepKey]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setShowTOC(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "1");
      localStorage.removeItem(stepKey);
    }
  }, [storageKey, stepKey]);

  const goToChapter = useCallback(async (chapterKey: string) => {
    if (navigatingRef.current) return;
    const chapter = chapters.find(c => c.key === chapterKey);
    if (!chapter) return;
    setShowTOC(false);
    const targetStep = steps[chapter.startIndex];
    await navigateToStep(targetStep);
    setCurrentStep(chapter.startIndex);
    if (typeof window !== "undefined") localStorage.setItem(stepKey, String(chapter.startIndex));
  }, [chapters, steps, navigateToStep, stepKey]);

  // Auto-skip mobile steps
  useEffect(() => {
    if (!isActive) return;
    const s = steps[currentStep];
    if (!s) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (s.mobileSkip && isMobile) {
      nextStep();
    }
  }, [isActive, currentStep, steps, nextStep]);

  return (
    <TourContext.Provider value={{
      isActive, currentStep, totalSteps: steps.length, steps,
      chapters, currentChapter, chapterIndex, isNavigating,
      startTour, nextStep, prevStep, skipTour, goToChapter,
      showTOC, setShowTOC,
    }}>
      {children}
    </TourContext.Provider>
  );
}

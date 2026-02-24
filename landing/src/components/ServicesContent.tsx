"use client";
import { useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import DesktopIcon from "@/components/DesktopIcon";
import MacWindow from "@/components/MacWindow";

const services = [
  {
    id: "a",
    letter: "א",
    title: "ליווי ניהולי וארגוני",
    desc: "ליווי הנהלת הארגון בהקמת תשתית ניהולית סדורה וברורה וביישור קו ניהולי.",
  },
  {
    id: "b",
    letter: "ב",
    title: "ניהול תקין וליווי רגולטורי",
    desc: "החזקת המעטפת הרגולטורית של הארגון וליווי מול רשויות הפיקוח.",
  },
  {
    id: "c",
    letter: "ג",
    title: "ליווי סעיף 46 ורשות המיסים",
    desc: "היערכות, יישור קו וליווי הנהלה בהליכים מול רשות המיסים.",
  },
  {
    id: "d",
    letter: "ד",
    title: "ניהול משברים ואירועים חריגים",
    desc: "ליווי הנהלה בהתמודדות עם אירועים רגולטוריים, משפטיים או מערכתיים.",
  },
  {
    id: "e",
    letter: "ה",
    title: "ליווי פרויקטים מול רשויות ציבוריות",
    desc: "ליווי הנהלות עמותות בפרויקטים מול רשויות מקומיות וממשלתיות.",
  },
  {
    id: "f",
    letter: "ו",
    title: "ניהול סיכונים ונהלים",
    desc: "מיפוי סיכונים ובניית תשתית נהלים לצמצום חשיפות ניהוליות ורגולטוריות.",
  },
  {
    id: "g",
    letter: "ז",
    title: "ליווי הנהלה שוטף - מעטפת חודשית",
    desc: "ליווי מתמשך כגורם ׳ניהול על׳ חיצוני, ללא תפקיד תפעולי וללא החלפת הנהלה.",
  },
  {
    id: "h",
    letter: "ח",
    title: "ליווי והקמת עמותה או חברה",
    desc: "ליווי הנהלה ויזמים בהקמת גוף משפטי עם תשתית ניהולית ורגולטורית נכונה.",
  },
];

// Stagger initial positions so windows don't overlap
function getInitialPosition(index: number) {
  const baseX = 120 + (index % 4) * 40;
  const baseY = 80 + Math.floor(index / 4) * 40 + (index % 4) * 30;
  return { x: baseX, y: baseY };
}

const BASE_Z = 100;

export default function ServicesContent() {
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [windowOrder, setWindowOrder] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [maximized, setMaximized] = useState<Set<string>>(new Set());

  const openWindow = useCallback((id: string) => {
    setOpenWindows((prev) => {
      if (prev.includes(id)) {
        // Already open — just bring to front
        setWindowOrder((order) => [...order.filter((w) => w !== id), id]);
        return prev;
      }
      return [...prev, id];
    });
    setWindowOrder((order) => [...order.filter((w) => w !== id), id]);

    // Set initial position if not already set
    setPositions((prev) => {
      if (prev[id]) return prev;
      const idx = services.findIndex((s) => s.id === id);
      return { ...prev, [id]: getInitialPosition(idx) };
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w !== id));
    setWindowOrder((order) => order.filter((w) => w !== id));
    setMaximized((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindowOrder((order) => [...order.filter((w) => w !== id), id]);
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setMaximized((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updatePosition = useCallback((id: string, pos: { x: number; y: number }) => {
    setPositions((prev) => ({ ...prev, [id]: pos }));
  }, []);

  return (
    <main className="min-h-screen bg-[#fafbfc]">
      {/* ── Desktop area ── */}
      <section className="relative min-h-screen pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[5%] w-[500px] h-[500px] rounded-full bg-[#2563eb]/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] rounded-full bg-violet-400/[0.04] blur-[100px]" />
        </div>

        {/* BSH */}
        <div className="relative z-10 text-center mb-6">
          <span className="text-xs text-[#c0c8d4] tracking-widest">
            בסיעתא דשמיא
          </span>
        </div>

        {/* Desktop title */}
        <div className="relative z-10 text-center mb-12 px-4">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1e293b] mb-3"
            style={{ fontFamily: "'Secular One', sans-serif" }}
          >
            תחומי שירות
          </h1>
          <p className="text-base sm:text-lg text-[#64748b] max-w-xl mx-auto">
            לחצו על שירות לפרטים נוספים
          </p>
        </div>

        {/* Desktop icons grid */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 justify-items-center">
            {services.map((s) => (
              <DesktopIcon
                key={s.id}
                letter={s.letter}
                title={s.title}
                isOpen={openWindows.includes(s.id)}
                onClick={() => openWindow(s.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Windows layer ── */}
        <AnimatePresence>
          {openWindows.map((id) => {
            const service = services.find((s) => s.id === id);
            if (!service) return null;
            const zIdx = BASE_Z + windowOrder.indexOf(id);
            const pos = positions[id] || getInitialPosition(services.indexOf(service));

            return (
              <MacWindow
                key={id}
                id={id}
                title={service.title}
                isMaximized={maximized.has(id)}
                position={pos}
                zIndex={zIdx}
                onClose={() => closeWindow(id)}
                onMinimize={() => closeWindow(id)}
                onMaximize={() => toggleMaximize(id)}
                onFocus={() => focusWindow(id)}
                onDragEnd={(newPos) => updatePosition(id, newPos)}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#2563eb]/5 flex items-center justify-center shrink-0">
                      <span
                        className="text-xl font-bold text-[#2563eb]"
                        style={{ fontFamily: "'Secular One', sans-serif" }}
                      >
                        {service.letter}
                      </span>
                    </div>
                    <h3
                      className="text-lg sm:text-xl font-bold text-[#1e293b]"
                      style={{ fontFamily: "'Secular One', sans-serif" }}
                    >
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-[#64748b] leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </MacWindow>
            );
          })}
        </AnimatePresence>
      </section>

      {/* ── Disclaimer ── */}
      <ScrollReveal>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
          <div className="relative rounded-[20px] border border-[#f59e0b]/20 bg-gradient-to-br from-[#fffbeb] to-[#fefce8] p-6 sm:p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/[0.05] rounded-full blur-[60px] pointer-events-none" />
            <h3 className="text-lg font-bold text-[#b45309] mb-3">הבהרה!</h3>
            <p className="text-sm sm:text-base text-[#92400e] leading-relaxed relative z-10">
              השירותים ניתנים כל אחד כיחידה עצמאית, ואינם כוללים שירותי משרד,
              מזכירות או תפעול שוטף.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ── About ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <ScrollReveal>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e293b] text-center mb-10"
            style={{ fontFamily: "'Secular One', sans-serif" }}
          >
            אודות
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="rounded-[20px] bg-white border border-[#e8ecf4] p-7 sm:p-10">
            <h3
              className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-6"
              style={{ fontFamily: "'Secular One', sans-serif" }}
            >
              ניהול תקין - מעטפת ניהולית בע״מ
            </h3>
            <div className="space-y-4 text-[#64748b] text-sm sm:text-base leading-[1.8]">
              <p>
                ניהול תקין - מעטפת ניהולית פועלת כגוף ליווי וניהול על לעמותות
                וארגונים.
              </p>
              <p>
                החברה אינה מספקת שירותי משרד, מזכירות או תפעול שוטף, ואינה
                מחליפה את הנהלת הארגון או את נושאי המשרה בו.
              </p>
              <p>
                פעילות החברה מתמקדת בהחזקת התשתית הניהולית, הרגולטורית
                והמערכתית של הארגון, בליווי הנהלה ובממשק שוטף מול רשויות,
                יועצים וגורמי פיקוח.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── BSH bottom + divider ── */}
      <div className="pb-10">
        <div className="max-w-xs mx-auto h-px bg-gradient-to-l from-transparent via-[#cbd5e1] to-transparent mb-8" />
        <div className="text-center text-xs text-[#c0c8d4] tracking-widest">
          בסיעתא דשמיא
        </div>
      </div>
    </main>
  );
}

"use client";
import { useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import DesktopIcon from "@/components/DesktopIcon";
import MacWindow from "@/components/MacWindow";

const v = process.env.NEXT_PUBLIC_BUILD_ID || "";

/* ── SVG icons for each service (macOS-style) ── */
const icons = {
  a: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="6" y="8" width="24" height="18" rx="3" stroke="white" strokeWidth="2" />
      <path d="M6 14h24" stroke="white" strokeWidth="1.5" />
      <circle cx="18" cy="22" r="2" fill="white" fillOpacity="0.7" />
      <path d="M12 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  b: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M10 6h16a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="white" strokeWidth="2" />
      <path d="M13 13h10M13 17h10M13 21h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 22l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="22" r="3" stroke="white" strokeWidth="1.5" />
    </svg>
  ),
  c: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="11" stroke="white" strokeWidth="2" />
      <path d="M18 11v7l5 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 26l-2 4M22 26l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  d: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 8l2.5 5 5.5.8-4 3.9.9 5.5L18 20.7l-4.9 2.5.9-5.5-4-3.9 5.5-.8L18 8z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 28h20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 25h14" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  e: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="6" y="10" width="24" height="16" rx="2" stroke="white" strokeWidth="2" />
      <path d="M6 16h24" stroke="white" strokeWidth="1.5" />
      <rect x="10" y="20" width="4" height="3" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="16" y="20" width="4" height="3" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="22" y="20" width="4" height="3" rx="0.5" fill="white" fillOpacity="0.6" />
      <path d="M14 7l4 3 4-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  f: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 6v24M6 18h24" stroke="white" strokeWidth="1.5" opacity="0.3" />
      <circle cx="18" cy="18" r="11" stroke="white" strokeWidth="2" />
      <circle cx="18" cy="18" r="5" stroke="white" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="1.5" fill="white" />
    </svg>
  ),
  g: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="8" y="8" width="20" height="20" rx="4" stroke="white" strokeWidth="2" />
      <path d="M14 14h8M14 18h8M14 22h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="10" r="4" fill="white" fillOpacity="0.9" stroke="white" strokeWidth="1" />
      <path d="M24.5 10h3M26 8.5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  h: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 8l10 6v12l-10 6-10-6V14l10-6z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 20v12M8 14l10 6 10-6" stroke="white" strokeWidth="1.5" />
      <circle cx="18" cy="16" r="2" fill="white" fillOpacity="0.7" />
    </svg>
  ),
};

const services = [
  {
    id: "a",
    letter: "א",
    title: "ליווי ניהולי",
    fullTitle: "ליווי ניהולי וארגוני",
    desc: "ליווי הנהלת הארגון בהקמת תשתית ניהולית סדורה וברורה וביישור קו ניהולי.",
    gradient: "bg-gradient-to-br from-[#007aff] to-[#0055d4]",
    icon: icons.a,
  },
  {
    id: "b",
    letter: "ב",
    title: "ליווי רגולטורי",
    fullTitle: "ניהול תקין וליווי רגולטורי",
    desc: "החזקת המעטפת הרגולטורית של הארגון וליווי מול רשויות הפיקוח.",
    gradient: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]",
    icon: icons.b,
  },
  {
    id: "c",
    letter: "ג",
    title: "סעיף 46",
    fullTitle: "ליווי סעיף 46 ורשות המיסים",
    desc: "היערכות, יישור קו וליווי הנהלה בהליכים מול רשות המיסים.",
    gradient: "bg-gradient-to-br from-[#10b981] to-[#059669]",
    icon: icons.c,
  },
  {
    id: "d",
    letter: "ד",
    title: "ניהול משברים",
    fullTitle: "ניהול משברים ואירועים חריגים",
    desc: "ליווי הנהלה בהתמודדות עם אירועים רגולטוריים, משפטיים או מערכתיים.",
    gradient: "bg-gradient-to-br from-[#f97316] to-[#ea580c]",
    icon: icons.d,
  },
  {
    id: "e",
    letter: "ה",
    title: "רשויות ציבוריות",
    fullTitle: "ליווי פרויקטים מול רשויות ציבוריות",
    desc: "ליווי הנהלות עמותות בפרויקטים מול רשויות מקומיות וממשלתיות.",
    gradient: "bg-gradient-to-br from-[#14b8a6] to-[#0d9488]",
    icon: icons.e,
  },
  {
    id: "f",
    letter: "ו",
    title: "סיכונים ונהלים",
    fullTitle: "ניהול סיכונים ונהלים",
    desc: "מיפוי סיכונים ובניית תשתית נהלים לצמצום חשיפות ניהוליות ורגולטוריות.",
    gradient: "bg-gradient-to-br from-[#f59e0b] to-[#d97706]",
    icon: icons.f,
  },
  {
    id: "g",
    letter: "ז",
    title: "מעטפת חודשית",
    fullTitle: "ליווי הנהלה שוטף - מעטפת חודשית",
    desc: "ליווי מתמשך כגורם ׳ניהול על׳ חיצוני, ללא תפקיד תפעולי וללא החלפת הנהלה.",
    gradient: "bg-gradient-to-br from-[#6366f1] to-[#4f46e5]",
    icon: icons.g,
  },
  {
    id: "h",
    letter: "ח",
    title: "הקמת עמותה",
    fullTitle: "ליווי והקמת עמותה או חברה",
    desc: "ליווי הנהלה ויזמים בהקמת גוף משפטי עם תשתית ניהולית ורגולטורית נכונה.",
    gradient: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]",
    icon: icons.h,
  },
];

function getInitialPosition(index: number) {
  const baseX = 120 + (index % 4) * 40;
  const baseY = 80 + Math.floor(index / 4) * 40 + (index % 4) * 30;
  return { x: baseX, y: baseY };
}

const BASE_Z = 100;

export default function ServicesContent() {
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [windowOrder, setWindowOrder] = useState<string[]>([]);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [maximized, setMaximized] = useState<Set<string>>(new Set());

  const openWindow = useCallback((id: string) => {
    setOpenWindows((prev) => {
      if (prev.includes(id)) {
        setWindowOrder((order) => [...order.filter((w) => w !== id), id]);
        return prev;
      }
      return [...prev, id];
    });
    setWindowOrder((order) => [...order.filter((w) => w !== id), id]);
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

  const updatePosition = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setPositions((prev) => ({ ...prev, [id]: pos }));
    },
    []
  );

  return (
    <main className="min-h-screen">
      {/* ── Desktop area with office background ── */}
      <section className="relative min-h-screen pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        {/* Background image — light overlay */}
        <div className="absolute inset-0">
          <img
            src={`/office-bg.png?v=${v}`}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Light overlay to wash out the image */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </div>

        {/* Animated lighting effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Warm light from window */}
          <div className="desktop-light-1 absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-amber-200/20 blur-[120px]" />
          {/* Cool accent light */}
          <div className="desktop-light-2 absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-300/15 blur-[100px]" />
          {/* Soft pink highlight */}
          <div className="desktop-light-3 absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-rose-200/10 blur-[90px]" />
          {/* Shimmer overlay */}
          <div className="desktop-shimmer absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        {/* BSH */}
        <div className="relative z-10 text-center mb-6">
          <span className="text-xs text-white/60 tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            בסיעתא דשמיא
          </span>
        </div>

        {/* Desktop title */}
        <div className="relative z-10 text-center mb-14 px-4">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            style={{ fontFamily: "'Secular One', sans-serif" }}
          >
            תחומי שירות
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
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
                icon={s.icon}
                gradient={s.gradient}
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
            const pos =
              positions[id] ||
              getInitialPosition(services.indexOf(service));

            return (
              <MacWindow
                key={id}
                id={id}
                title={service.fullTitle}
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
                    <div
                      className={`w-12 h-12 mac-icon ${service.gradient} flex items-center justify-center shrink-0`}
                    >
                      {service.icon}
                    </div>
                    <h3
                      className="text-lg sm:text-xl font-bold text-[#1e293b]"
                      style={{ fontFamily: "'Secular One', sans-serif" }}
                    >
                      {service.fullTitle}
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
      <section className="bg-[#fafbfc]">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
            <div className="relative rounded-[20px] border border-[#f59e0b]/20 bg-gradient-to-br from-[#fffbeb] to-[#fefce8] p-6 sm:p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/[0.05] rounded-full blur-[60px] pointer-events-none" />
              <h3 className="text-lg font-bold text-[#b45309] mb-3">
                הבהרה!
              </h3>
              <p className="text-sm sm:text-base text-[#92400e] leading-relaxed relative z-10">
                השירותים ניתנים כל אחד כיחידה עצמאית, ואינם כוללים שירותי
                משרד, מזכירות או תפעול שוטף.
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
                  ניהול תקין - מעטפת ניהולית פועלת כגוף ליווי וניהול על
                  לעמותות וארגונים.
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
      </section>
    </main>
  );
}

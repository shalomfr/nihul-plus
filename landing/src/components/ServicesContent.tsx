"use client";
import { motion } from "motion/react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const v = process.env.NEXT_PUBLIC_BUILD_ID || "";

const services = [
  {
    letter: "א",
    title: "ליווי ניהולי וארגוני",
    desc: "ליווי הנהלת הארגון בהקמת תשתית ניהולית סדורה וברורה וביישור קו ניהולי.",
    span: "sm:col-span-2",
  },
  {
    letter: "ב",
    title: "ניהול תקין וליווי רגולטורי",
    desc: "החזקת המעטפת הרגולטורית של הארגון וליווי מול רשויות הפיקוח.",
    span: "",
  },
  {
    letter: "ג",
    title: "ליווי סעיף 46 ורשות המיסים",
    desc: "היערכות, יישור קו וליווי הנהלה בהליכים מול רשות המיסים.",
    span: "",
  },
  {
    letter: "ד",
    title: "ניהול משברים ואירועים חריגים",
    desc: "ליווי הנהלה בהתמודדות עם אירועים רגולטוריים, משפטיים או מערכתיים.",
    span: "",
  },
  {
    letter: "ה",
    title: "ליווי פרויקטים מול רשויות ציבוריות",
    desc: "ליווי הנהלות עמותות בפרויקטים מול רשויות מקומיות וממשלתיות.",
    span: "",
  },
  {
    letter: "ו",
    title: "ניהול סיכונים ונהלים",
    desc: "מיפוי סיכונים ובניית תשתית נהלים לצמצום חשיפות ניהוליות ורגולטוריות.",
    span: "",
  },
  {
    letter: "ז",
    title: "ליווי הנהלה שוטף - מעטפת חודשית",
    desc: "ליווי מתמשך כגורם ׳ניהול על׳ חיצוני, ללא תפקיד תפעולי וללא החלפת הנהלה.",
    span: "",
  },
  {
    letter: "ח",
    title: "ליווי והקמת עמותה או חברה",
    desc: "ליווי הנהלה ויזמים בהקמת גוף משפטי עם תשתית ניהולית ורגולטורית נכונה.",
    span: "sm:col-span-2",
  },
];

export default function ServicesContent() {
  return (
    <main className="min-h-screen bg-[#fafbfc]">
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[5%] w-[500px] h-[500px] rounded-full bg-[#2563eb]/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] rounded-full bg-violet-400/[0.04] blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* BSH */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-xs text-[#c0c8d4] tracking-widest mb-10"
          >
            בסיעתא דשמיא
          </motion.div>

          {/* Logo */}
          <motion.img
            src={`/logo-transparent.png?v=${v}`}
            alt="מעטפת ניהולית"
            className="h-24 sm:h-32 md:h-40 w-auto mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Title */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-[#1e293b] mb-6"
            style={{ fontFamily: "'Secular One', sans-serif" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            ניהול תקין
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-[#64748b] max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            מעטפת ניהולית המלווה הנהלות עמותות וארגונים, ואחראית ליציבות
            המערכתית והרגולטורית של הארגון.
          </motion.p>
        </div>

        {/* Divider line */}
        <motion.div
          className="mt-20 max-w-xs mx-auto h-px bg-gradient-to-l from-transparent via-[#cbd5e1] to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </section>

      {/* ── Services — Bento Grid ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <ScrollReveal>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e293b] text-center mb-14"
            style={{ fontFamily: "'Secular One', sans-serif" }}
          >
            תחומי שירות
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {services.map((s, i) => (
            <ScrollReveal key={s.letter} delay={i * 0.05}>
              <div
                className={`group relative rounded-[20px] bg-white border border-[#e8ecf4] p-6 sm:p-7 transition-all duration-300 hover:border-[#2563eb]/20 hover:shadow-xl hover:shadow-[#2563eb]/[0.06] hover:-translate-y-0.5 h-full ${s.span}`}
              >
                {/* Letter badge */}
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#2563eb]/5 flex items-center justify-center mb-5 transition-colors duration-300 group-hover:from-[#2563eb]/20 group-hover:to-[#2563eb]/10">
                  <span className="text-lg font-bold text-[#2563eb]">{s.letter}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#1e293b] mb-2">
                  {s.title}
                </h3>
                <p className="text-sm sm:text-base text-[#64748b] leading-relaxed">
                  {s.desc}
                </p>

                {/* Subtle corner accent on hover */}
                <div className="absolute top-0 left-0 w-20 h-20 rounded-tl-[20px] bg-gradient-to-br from-[#2563eb]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </ScrollReveal>
          ))}
        </div>
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

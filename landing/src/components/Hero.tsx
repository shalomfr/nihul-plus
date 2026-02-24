"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Play } from "lucide-react";
import { APP_URL } from "@/lib/constants";

const v = process.env.NEXT_PUBLIC_BUILD_ID || "";

export default function Hero() {
  const [isHeroReady, setIsHeroReady] = useState(false);
  const [showText, setShowText] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [videoHidden, setVideoHidden] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let started = false;
    const handleReady = () => {
      if (started) return;
      started = true;
      video.play().catch(() => setShowText(true));
    };
    const handleEnded = () => setShowText(true);

    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("ended", handleEnded);

    // If already loaded (cached), play immediately
    if (video.readyState >= 2) handleReady();

    // Fallback: if video doesn't start within 3s, skip to text
    const timeout = setTimeout(() => {
      if (!started) {
        started = true;
        setShowText(true);
      }
    }, 3000);

    return () => {
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("ended", handleEnded);
      clearTimeout(timeout);
    };
  }, []);

  /* No auto-fade — overlay stays until user clicks CTA */

  /* Once fading done, remove overlay from DOM */
  useEffect(() => {
    if (!videoFading) return;
    const timer = setTimeout(() => setVideoHidden(true), 2000);
    return () => clearTimeout(timer);
  }, [videoFading]);

  return (
    <>
      {/* ── Full-screen video overlay – blocks entire page ── */}
      {!videoHidden && (
        <div
          className="fixed inset-0 z-[9999] transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: videoFading ? 0 : 1 }}
        >
          {/* Office background behind video */}
          <img
            src={`/office-bg.jpg?v=${v}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(1.15) blur(3px)" }}
          />
          {/* Warm overlay on office bg */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,251,235,0.4), rgba(255,255,255,0.3), rgba(255,247,237,0.2))",
            }}
          />
          {/* Cinematic sun lighting */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Bright sun source — pulsing bloom */}
            <motion.div
              className="absolute"
              style={{
                top: "-2%",
                left: "-5%",
                width: 500,
                height: 500,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,245,180,0.9) 0%, rgba(255,220,100,0.5) 25%, rgba(255,200,50,0.15) 50%, transparent 70%)",
              }}
              animate={{
                opacity: [0.6, 1, 0.7, 1, 0.6],
                scale: [1, 1.2, 1.05, 1.15, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Lens flare streak — horizontal */}
            <motion.div
              className="absolute"
              style={{
                top: "12%",
                left: "-10%",
                width: "80%",
                height: 3,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,240,200,0.8) 30%, rgba(255,255,255,0.9) 50%, rgba(255,240,200,0.8) 70%, transparent 100%)",
                filter: "blur(2px)",
              }}
              animate={{
                opacity: [0, 0.6, 0.9, 0.6, 0],
                scaleX: [0.5, 1, 1.2, 1, 0.5],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* Sweeping god rays that slowly rotate */}
            {[
              { from: -20, to: -5, h: 120, dur: 14, delay: 0 },
              { from: 0, to: 18, h: 150, dur: 18, delay: 1 },
              { from: 15, to: 35, h: 100, dur: 16, delay: 0.5 },
              { from: 30, to: 50, h: 130, dur: 20, delay: 2 },
              { from: 45, to: 62, h: 90, dur: 15, delay: 1.5 },
              { from: 55, to: 75, h: 110, dur: 17, delay: 0.8 },
              { from: 68, to: 82, h: 80, dur: 19, delay: 2.5 },
            ].map((ray, i) => (
              <motion.div
                key={`hray-${i}`}
                className="absolute"
                style={{
                  top: "8%",
                  left: 0,
                  width: "140%",
                  height: ray.h,
                  transformOrigin: "0% 50%",
                  background:
                    "linear-gradient(90deg, rgba(255,225,120,0.6) 0%, rgba(255,240,180,0.25) 25%, rgba(255,250,220,0.08) 55%, transparent 85%)",
                  filter: "blur(15px)",
                }}
                animate={{
                  rotate: [ray.from, ray.to, ray.from],
                  opacity: [0.15, 0.55, 0.3, 0.55, 0.15],
                }}
                transition={{
                  duration: ray.dur,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: ray.delay,
                }}
              />
            ))}

            {/* Moving light patch on the floor */}
            <motion.div
              className="absolute"
              style={{
                bottom: "0%",
                width: "50%",
                height: 250,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(255,235,160,0.4) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                left: ["15%", "35%", "20%", "40%", "15%"],
                opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
                scaleX: [1, 1.1, 0.95, 1.15, 1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating dust particles — cinematic */}
            {[
              { x: "12%", y: "20%", s: 5, dur: 16, d: 0 },
              { x: "25%", y: "35%", s: 4, dur: 20, d: 2 },
              { x: "8%",  y: "55%", s: 6, dur: 14, d: 1 },
              { x: "40%", y: "15%", s: 3, dur: 22, d: 3 },
              { x: "18%", y: "65%", s: 5, dur: 15, d: 0.5 },
              { x: "35%", y: "45%", s: 4, dur: 18, d: 2.5 },
              { x: "50%", y: "30%", s: 3, dur: 19, d: 4 },
              { x: "28%", y: "75%", s: 4, dur: 17, d: 1.5 },
              { x: "45%", y: "55%", s: 3, dur: 21, d: 3.5 },
              { x: "15%", y: "40%", s: 5, dur: 16, d: 0.8 },
            ].map((p, i) => (
              <motion.div
                key={`hdust-${i}`}
                className="absolute rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.s,
                  height: p.s,
                  background: "rgba(255,248,220,0.95)",
                  boxShadow: "0 0 8px 2px rgba(255,235,160,0.5)",
                }}
                animate={{
                  y: [0, -40, 15, -30, 5, -20, 0],
                  x: [0, 20, -12, 8, -5, 15, 0],
                  opacity: [0, 0.9, 0.4, 1, 0.3, 0.8, 0],
                  scale: [0.3, 1, 0.7, 1.2, 0.5, 1, 0.3],
                }}
                transition={{
                  duration: p.dur,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: p.d,
                }}
              />
            ))}
          </div>

          {/* Video — radial mask: documents visible in center, office peeks at edges */}
          <video
            ref={videoRef}
            src={`/hero-video.mp4?v=${v}`}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 65% at 50% 45%, black 50%, transparent 85%)",
              maskImage:
                "radial-gradient(ellipse 70% 65% at 50% 45%, black 50%, transparent 85%)",
            }}
          />

          {/* Falling letters + logo + CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 -translate-y-[15%]">
            <h2
              className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-[#1e293b] text-center"
              style={{ fontFamily: "'Secular One', sans-serif" }}
            >
              {"מבול של מסמכים?".split("").map((char, i) => {
                const rot = ((i * 7 + 3) % 30) - 15;
                return (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: -80, rotate: rot }}
                    animate={
                      showText
                        ? { opacity: 1, y: 0, rotate: 0 }
                        : { opacity: 0, y: -80 }
                    }
                    transition={{
                      duration: 0.6,
                      delay: i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ display: char === " " ? "inline" : undefined }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                );
              })}
            </h2>

            {/* Logo pops up — large */}
            <motion.img
              src={`/logo-transparent.png?v=${v}`}
              alt="מעטפת"
              className="h-32 sm:h-40 md:h-56 lg:h-64 w-auto"
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={showText ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* CTA button — navigates to services landing page */}
            <motion.a
              href="/services"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-10 py-4 rounded-xl text-xl transition-all shadow-xl shadow-blue-500/25 cursor-pointer inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={showText ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
            >
              מעוניין לשמוע
            </motion.a>
          </div>
        </div>
      )}

    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-10 overflow-hidden bg-grid">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 watermark whitespace-nowrap">
        מעטפת
      </div>

      {/* Decorative blurs */}
      <div className="absolute top-20 right-[10%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full bg-blue-400/10 blur-[100px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] rounded-full bg-violet-400/8 blur-[80px] md:blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isHeroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.38, delay: 0.08 }}
          className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#e2e8f0] rounded-full px-3 sm:px-4 py-1.5 mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-medium text-[#64748b]">
            למעלה מ-100 עמותות כבר מלוות על ידינו
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.14 }}
        >
          <span className="text-[#1e293b]">ניהול תקין.</span>{" "}
          <span className="gradient-text">ליווי מקצועי.</span>
          <br />
          <span className="text-[#1e293b]">שקט נפשי.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base sm:text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={isHeroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.42, delay: 0.2 }}
        >
          מעטפת מלווה עמותות בישראל בכל היבטי הניהול התקין —
          עם צוות מקצועי שדואג שהכל יהיה בסדר.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isHeroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.42, delay: 0.24 }}
        >
          <a
            href={APP_URL}
            className="glow-btn bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all flex items-center gap-2 shadow-xl shadow-blue-500/25 w-full sm:w-auto justify-center"
          >
            התחילו עכשיו
            <ArrowLeft size={18} />
          </a>
          <button className="flex items-center gap-2.5 text-[#64748b] hover:text-[#1e293b] font-medium transition-colors group">
            <div className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:shadow-xl transition-shadow">
              <Play size={16} className="text-[#2563eb] mr-[-2px]" />
            </div>
            צפו בהדגמה
          </button>
        </motion.div>
      </div>

      {/* Floating Dashboard Cards */}
      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16"
        initial={{ opacity: 0, y: 60 }}
        animate={isHeroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 0.58, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative">
          {/* Main dashboard card */}
          <div className="glass-card-strong rounded-2xl p-4 sm:p-6 md:p-8 mockup-3d-desktop mx-auto max-w-4xl">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="flex gap-1.5">
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#ef4444]/60" />
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#f59e0b]/60" />
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#22c55e]/60" />
              </div>
              <div className="flex-1 bg-[#f1f5f9] rounded-lg h-6 sm:h-7 mx-2 sm:mx-4 flex items-center px-3">
                <span className="text-[9px] sm:text-[10px] text-[#94a3b8]">matefet.co.il/portal</span>
              </div>
            </div>

            {/* Dashboard content mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="bg-[#eff6ff] rounded-xl p-3 sm:p-4">
                <div className="text-[10px] text-[#64748b] mb-1">ציון ניהול תקין</div>
                <div className="text-xl sm:text-2xl font-bold text-[#2563eb]">98%</div>
                <div className="mt-2 h-2 bg-[#dbeafe] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563eb] rounded-full" style={{ width: "98%" }} />
                </div>
              </div>
              <div className="bg-[#f0fdf4] rounded-xl p-3 sm:p-4">
                <div className="text-[10px] text-[#64748b] mb-1">יתרת בנק</div>
                <div className="text-xl sm:text-2xl font-bold text-[#16a34a]">₪142,850</div>
                <div className="text-[10px] text-[#16a34a] mt-2">+12.5% מהחודש שעבר</div>
              </div>
              <div className="bg-[#fefce8] rounded-xl p-3 sm:p-4">
                <div className="text-[10px] text-[#64748b] mb-1">משימות פתוחות</div>
                <div className="text-xl sm:text-2xl font-bold text-[#d97706]">3</div>
                <div className="text-[10px] text-[#d97706] mt-2">2 דחופות</div>
              </div>
            </div>

            {/* Chart area */}
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#e8ecf4]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#1e293b]">תנועות בנק</span>
                <span className="text-[10px] text-[#94a3b8]">6 חודשים אחרונים</span>
              </div>
              <svg viewBox="0 0 400 80" className="w-full h-16 sm:h-20">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,60 C30,55 60,40 100,45 C140,50 170,20 200,25 C230,30 260,15 300,20 C340,25 370,10 400,15 L400,80 L0,80 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,60 C30,55 60,40 100,45 C140,50 170,20 200,25 C230,30 260,15 300,20 C340,25 370,10 400,15"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Floating side card — left */}
          <div className="hidden md:block absolute -left-4 top-1/3 float-slow">
            <div className="glass-card rounded-xl p-4 w-48 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-xs font-semibold text-[#1e293b]">דיווח שנתי</span>
              </div>
              <div className="text-[10px] text-[#16a34a] font-medium">הוגש בהצלחה</div>
            </div>
          </div>

          {/* Floating side card — right */}
          <div className="hidden md:block absolute -right-4 top-1/2 float-medium float-delay-1">
            <div className="glass-card rounded-xl p-4 w-52 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                  <span className="text-xs">📊</span>
                </div>
                <span className="text-xs font-semibold text-[#1e293b]">ישיבת ועד</span>
              </div>
              <div className="text-[10px] text-[#64748b]">הקרובה: 28 פברואר</div>
              <div className="text-[10px] text-[#2563eb] font-medium">3 נושאים על סדר היום</div>
            </div>
          </div>

          {/* Floating badges — desktop only */}
          <div className="hidden lg:block absolute -right-8 top-8 float-slow float-delay-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border border-white/80 -rotate-6">
              <span className="text-xs font-bold text-[#64748b] tracking-wider">SaaS</span>
            </div>
          </div>

          <div className="hidden lg:block absolute -left-6 bottom-8 float-medium float-delay-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border border-white/80 rotate-3">
              <span className="text-xs font-bold text-[#64748b] tracking-wider">ניהול תקין</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
    </>
  );
}

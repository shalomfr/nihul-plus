"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Play } from "lucide-react";
import { APP_URL } from "@/lib/constants";

export default function Hero() {
  const [isHeroReady, setIsHeroReady] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [videoHidden, setVideoHidden] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      video.play().catch(() => {
        // Autoplay blocked — fade out immediately
        setVideoFading(true);
        setIsHeroReady(true);
      });
    };

    const handleEnded = () => {
      setVideoFading(true);
      setIsHeroReady(true);
    };

    video.addEventListener("canplaythrough", handleCanPlay);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("canplaythrough", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  /* Once fading starts, remove video from DOM after transition */
  useEffect(() => {
    if (!videoFading) return;
    const timer = setTimeout(() => setVideoHidden(true), 2000);
    return () => clearTimeout(timer);
  }, [videoFading]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-10 overflow-hidden bg-grid">
      {/* ── Full-cover video ── */}
      {!videoHidden && (
        <div
          className="absolute inset-0 z-20 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: videoFading ? 0 : 1 }}
        >
          <video
            ref={videoRef}
            src="/hero-video.mp4"
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />
        </div>
      )}

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
  );
}

"use client";
import { motion } from "motion/react";
import { ArrowLeft, Play } from "lucide-react";
import { APP_URL } from "@/lib/constants";
import EnvelopeAnimation from "@/components/EnvelopeAnimation";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden bg-grid">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 watermark whitespace-nowrap">
        מעטפת
      </div>

      {/* Decorative blurs */}
      <div className="absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-[300px] h-[300px] rounded-full bg-violet-400/8 blur-[100px] pointer-events-none" />

      {/* Envelope Animation — top right */}
      <div className="absolute top-20 right-6 md:right-12 lg:right-[8%] z-20">
        <EnvelopeAnimation />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#e2e8f0] rounded-full px-4 py-1.5 mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-xs font-medium text-[#64748b]">
            למעלה מ-100 עמותות כבר מלוות על ידינו
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <span className="text-[#1e293b]">ניהול תקין.</span>{" "}
          <span className="gradient-text">ליווי מקצועי.</span>
          <br />
          <span className="text-[#1e293b]">שקט נפשי.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          מעטפת מלווה עמותות בישראל בכל היבטי הניהול התקין —
          עם צוות מקצועי שדואג שהכל יהיה בסדר.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
        >
          <a
            href={APP_URL}
            className="glow-btn bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all flex items-center gap-2 shadow-xl shadow-blue-500/25"
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
        className="relative z-10 w-full max-w-6xl mx-auto px-6 mt-16"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative">
          {/* Main dashboard card */}
          <div className="glass-card-strong rounded-2xl p-6 md:p-8 mockup-3d mx-auto max-w-4xl">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]/60" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]/60" />
                <div className="w-3 h-3 rounded-full bg-[#22c55e]/60" />
              </div>
              <div className="flex-1 bg-[#f1f5f9] rounded-lg h-7 mx-4 flex items-center px-3">
                <span className="text-[10px] text-[#94a3b8]">matefet.co.il/portal</span>
              </div>
            </div>

            {/* Dashboard content mockup */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-[#eff6ff] rounded-xl p-4">
                <div className="text-[10px] text-[#64748b] mb-1">ציון ניהול תקין</div>
                <div className="text-2xl font-bold text-[#2563eb]">98%</div>
                <div className="mt-2 h-2 bg-[#dbeafe] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563eb] rounded-full" style={{ width: "98%" }} />
                </div>
              </div>
              <div className="bg-[#f0fdf4] rounded-xl p-4">
                <div className="text-[10px] text-[#64748b] mb-1">יתרת בנק</div>
                <div className="text-2xl font-bold text-[#16a34a]">₪142,850</div>
                <div className="text-[10px] text-[#16a34a] mt-2">+12.5% מהחודש שעבר</div>
              </div>
              <div className="bg-[#fefce8] rounded-xl p-4">
                <div className="text-[10px] text-[#64748b] mb-1">משימות פתוחות</div>
                <div className="text-2xl font-bold text-[#d97706]">3</div>
                <div className="text-[10px] text-[#d97706] mt-2">2 דחופות</div>
              </div>
            </div>

            {/* Chart area */}
            <div className="bg-white rounded-xl p-4 border border-[#e8ecf4]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#1e293b]">תנועות בנק</span>
                <span className="text-[10px] text-[#94a3b8]">6 חודשים אחרונים</span>
              </div>
              {/* Fake chart */}
              <svg viewBox="0 0 400 80" className="w-full h-20">
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

          {/* Floating badge — SAAS style */}
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

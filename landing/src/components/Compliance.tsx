"use client";
import { motion } from "motion/react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { ShieldCheck, Check } from "lucide-react";
import { COMPLIANCE_ITEMS } from "@/lib/constants";

function ScoreRing() {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - 0.98);

  return (
    <div className="relative w-40 h-40 mx-auto lg:mx-0">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        {/* Progress ring */}
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#2563eb"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-[#2563eb]">98%</span>
        <span className="text-[10px] text-[#64748b] font-medium">ציון תקינות</span>
      </div>
    </div>
  );
}

export default function Compliance() {
  return (
    <section id="compliance" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="glass-card-strong rounded-3xl p-8 md:p-14 flex flex-col lg:flex-row items-center gap-12">
          {/* Left — Score + Icon */}
          <ScrollReveal direction="right" className="flex-shrink-0">
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-[#eff6ff] rounded-full px-4 py-1.5 mb-6">
                <ShieldCheck size={16} className="text-[#2563eb]" />
                <span className="text-xs font-semibold text-[#2563eb]">ניהול תקין</span>
              </div>
              <ScoreRing />
            </div>
          </ScrollReveal>

          {/* Right — Content */}
          <div className="flex-1">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1e293b] mb-3">
                ניהול תקין — בלי לפספס שום דבר
              </h2>
              <p className="text-[#64748b] mb-8 leading-relaxed">
                רשם העמותות דורש עשרות מסמכים ודיווחים. הצוות שלנו עוקב אחרי כולם
                ומוודא שלא מפספסים אף דדליין.
              </p>
            </ScrollReveal>

            <div className="space-y-3">
              {COMPLIANCE_ITEMS.map((item, i) => (
                <ScrollReveal key={i} delay={0.1 + i * 0.08}>
                  <div className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3 border border-white/80">
                    <div className="w-6 h-6 rounded-full bg-[#d1fae5] flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-[#16a34a]" />
                    </div>
                    <span className="text-sm font-medium text-[#1e293b]">{item}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

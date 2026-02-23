"use client";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { STEPS } from "@/lib/constants";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#1e293b] mb-4">
            איך זה עובד?
          </h2>
          <p className="text-lg text-[#64748b]">
            שלושה צעדים פשוטים לניהול תקין מושלם
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[2px] bg-gradient-to-l from-[#2563eb]/20 via-[#2563eb]/40 to-[#2563eb]/20" />

          {STEPS.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="text-center relative">
                {/* Step number */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1e40af] mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>

                <h3 className="text-xl font-bold text-[#1e293b] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[#64748b] leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

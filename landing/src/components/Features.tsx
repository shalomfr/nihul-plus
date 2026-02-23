"use client";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { FEATURES } from "@/lib/constants";

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#1e293b] mb-4">
            הכל מה שעמותה צריכה
          </h2>
          <p className="text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto">
            ליווי מקצועי בכל היבטי הניהול התקין — מרגולציה ועד דוחות כספיים
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 0.06}>
              <div className="glass-card hover-lift rounded-xl sm:rounded-2xl p-4 sm:p-6 h-full cursor-default">
                <div
                  className="icon-circle mb-4"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon size={24} style={{ color: feature.color }} />
                </div>
                <h3 className="text-base font-bold text-[#1e293b] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#64748b] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

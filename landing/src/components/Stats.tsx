"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { STATS } from "@/lib/constants";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  const display = value >= 1000
    ? count.toLocaleString("he-IL")
    : count;

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="glass-card-strong rounded-2xl py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          {STATS.map((stat, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-extrabold text-[#2563eb]">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-[#64748b] mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

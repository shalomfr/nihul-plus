"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { NAV_LINKS, APP_URL } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-card-strong shadow-lg"
          : "bg-transparent"
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <img src="/logo.png" alt="מעטפת" className="h-10 w-auto" />
          <span className="text-lg font-bold text-[#1e293b]">מעטפת</span>
        </a>

        {/* Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#64748b] hover:text-[#2563eb] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href={APP_URL}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
        >
          כניסה למערכת
        </a>
      </div>
    </motion.nav>
  );
}

"use client";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { ArrowLeft } from "lucide-react";
import { APP_URL } from "@/lib/constants";

export default function CTA() {
  return (
    <section id="contact" className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] to-[#1e40af]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2240%22%20r%3D%2280%22%20fill%3D%22rgba(255%2C255%2C255%2C0.05)%22%2F%3E%3Ccircle%20cx%3D%22160%22%20cy%3D%22160%22%20r%3D%2260%22%20fill%3D%22rgba(255%2C255%2C255%2C0.03)%22%2F%3E%3C%2Fsvg%3E')] bg-cover" />

            <div className="relative z-10 text-center py-16 md:py-20 px-8">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                מוכנים לנהל את העמותה כמו שצריך?
              </h2>
              <p className="text-blue-100 text-lg mb-10 max-w-lg mx-auto">
                הצטרפו למאות עמותות שכבר עברו לניהול תקין אוטומטי
              </p>
              <a
                href={APP_URL}
                className="inline-flex items-center gap-2 bg-white text-[#2563eb] font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-2xl shadow-black/20"
              >
                התחילו עכשיו — בחינם
                <ArrowLeft size={20} />
              </a>
              <p className="text-blue-200/70 text-sm mt-4">
                ללא כרטיס אשראי · הקמה תוך 2 דקות
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

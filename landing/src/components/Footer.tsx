const v = process.env.NEXT_PUBLIC_BUILD_ID || "";

export default function Footer() {
  return (
    <footer className="py-8 sm:py-12 border-t border-[#e2e8f0]/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5 sm:gap-6 md:flex-row md:justify-between">
          {/* Logo */}
          <a href="#">
            <img src={`/logo.png?v=${v}`} alt="מעטפת" className="h-12 sm:h-14 w-auto" />
          </a>

          {/* Links */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <a href="#" className="text-xs sm:text-sm text-[#64748b] hover:text-[#2563eb] transition-colors">
              תנאי שימוש
            </a>
            <a href="#" className="text-xs sm:text-sm text-[#64748b] hover:text-[#2563eb] transition-colors">
              מדיניות פרטיות
            </a>
            <a href="#contact" className="text-xs sm:text-sm text-[#64748b] hover:text-[#2563eb] transition-colors">
              צור קשר
            </a>
          </div>

          {/* BSH */}
          <div className="text-xs text-[#c0c8d4]">
            בסיעתא דשמיא
          </div>
        </div>
      </div>
    </footer>
  );
}

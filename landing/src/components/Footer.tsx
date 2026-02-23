export default function Footer() {
  return (
    <footer className="py-12 border-t border-[#e2e8f0]/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1e40af] flex items-center justify-center">
              <span className="text-white font-bold text-sm">מ</span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1e293b]">מעטפת</span>
              <span className="text-xs text-[#94a3b8] block">ניהול תקין לעמותות</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-[#64748b] hover:text-[#2563eb] transition-colors">
              תנאי שימוש
            </a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#2563eb] transition-colors">
              מדיניות פרטיות
            </a>
            <a href="#contact" className="text-sm text-[#64748b] hover:text-[#2563eb] transition-colors">
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

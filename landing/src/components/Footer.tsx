export default function Footer() {
  return (
    <footer className="py-12 border-t border-[#e2e8f0]/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <a href="#">
            <img src="/logo.jpg" alt="מעטפת — ניהולית בע״מ" className="h-12 w-auto" />
          </a>

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

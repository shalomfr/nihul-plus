"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";

const pathLabels: Record<string, string> = {
  "portal": "הפורטל שלי",
  "org-file": "תיק עמותה",
  "procedures": "נהלים",
  "institutions": "מוסדות העמותה",
  "advisor": "מלווה אישי",
  "status": "המצב שלי",
  "calendar": "מה מתקרב",
  "documents": "המסמכים שלי",
  "board": "הועד שלי",
  "banking": "בנק והוצאות",
  "bank-sync": "סנכרון בנק",
  "reports": "דוחות ותקציב",
  "contact": "פנה למלווה",
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Split path and filter empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on home page
  if (segments.length <= 1) return null;

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = pathLabels[segment] || segment;
    const isLast = index === segments.length - 1;

    return {
      path,
      label,
      isLast,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] mb-4 overflow-x-auto">
      <Link
        href="/portal"
        className="flex items-center gap-1.5 text-[#64748b] hover:text-[#2563eb] transition-colors flex-shrink-0"
        aria-label="חזרה לפורטל"
      >
        <Home size={14} />
        <span className="hidden sm:inline">בית</span>
      </Link>

      {breadcrumbs.map((crumb) => (
        <div key={crumb.path} className="flex items-center gap-2 flex-shrink-0">
          <ChevronLeft size={14} className="text-[#cbd5e1]" />
          {crumb.isLast ? (
            <span className="text-[#1e293b] font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.path}
              className="text-[#64748b] hover:text-[#2563eb] transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

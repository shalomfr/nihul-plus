"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, CheckCircle, Calendar, FileText, BarChart2, MessageCircle, Users, LogOut, Menu, X, Compass, Landmark, RefreshCw } from "lucide-react";
import { useTour } from "@/components/tour/TourContext";

const roleLabels: Record<string, string> = {
  ADMIN: "מנהל מערכת",
  MANAGER: "מנהל עמותה",
  USER: "משתמש",
};

const navItems = [
  { href: "/portal", icon: Home, label: "המצב שלי" },
  { href: "/portal/status", icon: CheckCircle, label: "האם אני בסדר?" },
  { href: "/portal/calendar", icon: Calendar, label: "מה מתקרב?" },
  { href: "/portal/documents", icon: FileText, label: "המסמכים שלי" },
  { href: "/portal/board", icon: Users, label: "הועד שלי" },
  { href: "/portal/banking", icon: Landmark, label: "בנק והוצאות" },
  { href: "/portal/bank-sync", icon: RefreshCw, label: "סנכרון בנק" },
  { href: "/portal/reports", icon: BarChart2, label: "דוחות ותקציב" },
  { href: "/portal/contact", icon: MessageCircle, label: "פנה למלווה" },
];

export default function PortalSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { startTour } = useTour();
  const { data: session } = useSession();

  // Org info from portal stats
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgNumber, setOrgNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgInfo = async () => {
      try {
        const res = await fetch("/api/stats/portal");
        if (res.ok) {
          const json = await res.json();
          // The portal stats response includes compliance.items which have organizationId
          // but we need to get the org name from the organization itself.
          // Since the stats API doesn't return org name directly, we'll try to get it
          // from a dedicated endpoint or just leave a fallback.
          // For now let's check if there's org info in the response.
          if (json.data?.organization) {
            setOrgName(json.data.organization.name);
            setOrgNumber(json.data.organization.number);
          }
        }
      } catch {
        // silently fail
      }
    };

    if (session) {
      fetchOrgInfo();
    }
  }, [session]);

  const userName = session?.user?.name ?? "משתמש";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "MANAGER";
  const roleLabel = roleLabels[userRole] ?? userRole;
  const userInitials = userName.slice(0, 2);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden w-10 h-10 rounded-xl bg-white border border-[#e8ecf4] flex items-center justify-center shadow-md"
      >
        <Menu size={20} className="text-[#1e293b]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        data-tour="portal-sidebar"
        className={`w-60 h-screen fixed right-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0`}
        style={{
          background: "#ffffff",
          borderLeft: "1px solid #e8ecf4",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.03)",
        }}
      >
        {/* Logo / Brand */}
        <div className="px-6 pt-7 pb-5 border-b border-[#e8ecf4]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[15px] font-bold"
                style={{ background: "linear-gradient(135deg, #2563eb, #1e40af)" }}
              >
                מ
              </div>
              <div>
                <h1 className="text-[18px] font-bold text-[#1e293b] leading-tight">
                  מעטפת
                </h1>
                <p className="text-[10px] text-[#94a3b8] font-medium">בסיעתא דשמיא</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Organization Info */}
        <div className="px-4 py-3">
          <Link href="/portal" className="block">
            <div className="bg-[#f8f9fc] border border-[#e8ecf4] rounded-xl p-3 hover:bg-[#eff6ff] hover:border-[#bfdbfe] transition-all">
              <div className="text-[10px] text-[#94a3b8] mb-0.5">הארגון שלי</div>
              <div className="text-[13px] font-semibold text-[#1e293b]">
                {orgName ?? "הארגון שלי"}
              </div>
              {orgNumber && (
                <div className="text-[10px] text-[#94a3b8] mt-0.5">מס׳ עמותה: {orgNumber}</div>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto py-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-1 text-[14px] transition-all ${
                  isActive
                    ? "bg-[#eff6ff] text-[#1e40af] border-r-[3px] border-[#2563eb] font-semibold"
                    : "text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8f9fc] font-medium"
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={isActive ? "text-[#2563eb]" : ""}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Tour button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => { setMobileOpen(false); startTour(); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-all"
          >
            <Compass size={16} />
            <span>סיור מודרך</span>
          </button>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#e8ecf4]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2563eb, #1e40af)" }}
            >
              {userInitials}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-[#1e293b]">{userName}</div>
              <div className="text-[10px] text-[#94a3b8]">{roleLabel}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg hover:bg-[#fef2f2] text-[#94a3b8] hover:text-[#ef4444] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

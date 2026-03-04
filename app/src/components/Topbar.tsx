"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

function getHebrewDate() {
  const now = new Date();
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayOfWeek = dayNames[now.getDay()];
  const formatted = now.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { dayOfWeek, formatted };
}

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { dayOfWeek, formatted } = getHebrewDate();
  const { data: session } = useSession();
  const pathname = usePathname();

  // Show back button on all pages except portal home
  const showBackButton = pathname !== "/portal";


  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // User dropdown state
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?limit=10");
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data?.notifications ?? []);
          setUnreadCount(json.data?.unreadCount ?? 0);
        }
      } catch {
        // silently fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Click-outside for notifications
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Click-outside for user dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const userName = session?.user?.name ?? "משתמש";
  const userInitials = userName.slice(0, 2);

  return (
    <header className="mb-6 md:mb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            {showBackButton && <BackButton className="flex-shrink-0" />}
            <h2 className="text-[22px] md:text-[28px] font-bold text-[#1e293b] leading-tight truncate">{title}</h2>
          </div>
          {subtitle && <p className="text-[12px] md:text-[13px] text-[#64748b] mt-1 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <div className="hidden lg:block text-left text-[12px] text-[#64748b] leading-relaxed ml-3">
          <div className="text-[13px] text-[#1e293b]">יום {dayOfWeek}</div>
          <div>{formatted}</div>
        </div>

        {/* Notifications bell */}
        <div className="relative" ref={notifRef}>
          <button
            data-tour="notifications-bell"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="w-9 h-9 rounded-xl bg-white border border-[#e8ecf4] flex items-center justify-center relative hover:border-[#2563eb]/40 transition-colors shadow-sm"
          >
            <Bell size={16} className="text-[#64748b]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-[#ef4444] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notifOpen && (
            <div className="absolute left-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-xl border border-[#e8ecf4] shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8ecf4]">
                <span className="text-[14px] font-semibold text-[#1e293b]">התראות</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#2563eb] hover:underline font-medium"
                  >
                    סמן הכל כנקרא
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#94a3b8]">
                    אין התראות
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) handleMarkOneRead(n.id);
                      }}
                      className={`w-full text-right px-4 py-3 border-b border-[#f1f5f9] hover:bg-[#f8f9fc] transition-colors ${
                        !n.isRead ? "bg-[#eff6ff]/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[#1e293b] truncate">
                            {n.title}
                          </div>
                          {n.message && (
                            <div className="text-[11px] text-[#64748b] mt-0.5 line-clamp-2">
                              {n.message}
                            </div>
                          )}
                          <div className="text-[10px] text-[#94a3b8] mt-1">
                            {new Date(n.createdAt).toLocaleDateString("he-IL")}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((prev) => !prev)}
            className="hidden sm:flex w-9 h-9 rounded-xl bg-white border border-[#e8ecf4] items-center justify-center shadow-sm overflow-hidden hover:border-[#2563eb]/40 transition-colors cursor-pointer"
          >
            <User size={16} className="text-[#64748b]" />
          </button>

          {userOpen && (
            <div className="absolute left-0 top-full mt-2 w-[min(13rem,calc(100vw-2rem))] bg-white rounded-xl border border-[#e8ecf4] shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8ecf4]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #2563eb, #1e40af)" }}
                  >
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#1e293b] truncate">
                      {userName}
                    </div>
                    <div className="text-[10px] text-[#94a3b8] truncate">
                      {session?.user?.email ?? ""}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
              >
                <LogOut size={15} />
                <span>התנתק</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

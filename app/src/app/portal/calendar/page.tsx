"use client";
import { useState, useEffect, useMemo } from "react";
import Topbar from "@/components/Topbar";
import { Calendar, ChevronRight, ChevronLeft, X } from "lucide-react";
import { type ComplianceItem } from "@/lib/smart-actions";
import HandleNowButton from "@/components/HandleNowButton";
import SmartActionsModal from "@/components/SmartActionsModal";

type BoardMeeting = {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
};

type CalendarEvent = {
  day: number;
  month: number; // 0-indexed
  year: number;
  timestamp: number;
  title: string;
  sub: string;
  tag: string;
  color: string;
  fullDate: string; // localized date string
  time?: string;
  complianceItemId?: string;
};

const hebrewMonths: Record<number, string> = {
  0: "ינואר", 1: "פברואר", 2: "מרץ", 3: "אפריל", 4: "מאי", 5: "יוני",
  6: "יולי", 7: "אוגוסט", 8: "ספטמבר", 9: "אוקטובר", 10: "נובמבר", 11: "דצמבר",
};

const hebrewDayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function PortalCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [actionItem, setActionItem] = useState<ComplianceItem | null>(null);

  // Mini calendar navigation
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    Promise.all([
      fetch("/api/board/meetings").then(r => r.json()),
      fetch("/api/compliance").then(r => r.json()),
    ])
      .then(([meetingsRes, complianceRes]) => {
        const now = Date.now();
        const allEvents: CalendarEvent[] = [];

        // Add meetings as calendar events
        if (meetingsRes.success) {
          const meetings: BoardMeeting[] = meetingsRes.data;
          meetings
            .filter(m => new Date(m.date).getTime() >= now)
            .forEach(m => {
              const d = new Date(m.date);
              const daysUntil = Math.max(0, Math.ceil((d.getTime() - now) / (1000 * 60 * 60 * 24)));
              let tag = "בסדר";
              let color = "#16a34a";
              if (daysUntil <= 7) { tag = "דחוף"; color = "#ef4444"; }
              else if (daysUntil <= 30) { tag = "בקרוב"; color = "#d97706"; }
              allEvents.push({
                day: d.getDate(),
                month: d.getMonth(),
                year: d.getFullYear(),
                timestamp: d.getTime(),
                title: m.title,
                sub: m.location ?? "ישיבה מתוכננת",
                tag,
                color,
                fullDate: d.toLocaleDateString("he-IL"),
                time: d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
              });
            });
        }

        // Add compliance deadlines
        if (complianceRes.success) {
          const items: ComplianceItem[] = complianceRes.data.items ?? [];
          setComplianceItems(items.filter(i => i.status !== "OK"));
          items
            .filter(item => item.dueDate && new Date(item.dueDate).getTime() >= now && item.status !== "OK")
            .forEach(item => {
              const d = new Date(item.dueDate!);
              const daysUntil = Math.max(0, Math.ceil((d.getTime() - now) / (1000 * 60 * 60 * 24)));
              let tag = "בסדר";
              let color = "#16a34a";
              if (daysUntil <= 14) { tag = "דחוף"; color = "#ef4444"; }
              else if (daysUntil <= 30) { tag = "בקרוב"; color = "#d97706"; }
              allEvents.push({
                day: d.getDate(),
                month: d.getMonth(),
                year: d.getFullYear(),
                timestamp: d.getTime(),
                title: item.name,
                sub: item.description ?? "דדליין ציות",
                tag,
                color,
                fullDate: d.toLocaleDateString("he-IL"),
                complianceItemId: item.id,
              });
            });
        }

        // Sort by actual timestamp (fixes year boundary bug)
        allEvents.sort((a, b) => a.timestamp - b.timestamp);

        setEvents(allEvents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Mini Calendar Grid Data ──
  const miniCalData = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Day of week of the first day (0=Sunday in JS, which matches Hebrew calendar starting from Sunday)
    const startDow = firstDay.getDay();

    // Create grid cells: leading blanks + day numbers
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return { cells, daysInMonth };
  }, [calMonth, calYear]);

  // Set of days in current cal month that have events
  const eventDaysInMonth = useMemo(() => {
    const days = new Set<number>();
    for (const ev of events) {
      if (ev.month === calMonth && ev.year === calYear) {
        days.add(ev.day);
      }
    }
    return days;
  }, [events, calMonth, calYear]);

  const goToPrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  if (loading) {
    return (
      <div className="px-4 md:px-8 pb-6 md:pb-8">
        <Topbar title="מה מתקרב?" subtitle="לוח שנה רגולטורי – דדליינים ואירועים" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-6 md:pb-8">
      <Topbar title="מה מתקרב?" subtitle="לוח שנה רגולטורי – דדליינים ואירועים" />

      <div className="max-w-[800px]">
        {/* ─── MINI MONTH CALENDAR ─── */}
        <div data-tour="calendar-mini" className="anim-fade-down bg-white rounded-2xl border border-[#e8ecf4] p-5 mb-6 hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors">
              <ChevronRight size={18} />
            </button>
            <h3 className="text-[15px] font-bold text-[#1e293b]">
              {hebrewMonths[calMonth]} {calYear}
            </h3>
            <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors">
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {hebrewDayNames.map(name => (
              <div key={name} className="text-center text-[11px] font-semibold text-[#64748b] py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Day cells grid */}
          <div className="grid grid-cols-7 gap-1">
            {miniCalData.cells.map((day, i) => {
              if (day === null) {
                return <div key={`blank-${i}`} className="h-9" />;
              }
              const hasEvent = eventDaysInMonth.has(day);
              const isTodayCell = isToday(day);

              return (
                <div
                  key={`day-${day}`}
                  className={`h-9 flex flex-col items-center justify-center rounded-lg text-[12px] font-medium relative transition-colors ${
                    isTodayCell
                      ? "bg-[#2563eb] text-white"
                      : hasEvent
                      ? "bg-[#eff6ff] text-[#2563eb] font-bold"
                      : "text-[#1e293b] hover:bg-[#f8f9fc]"
                  }`}
                >
                  {day}
                  {hasEvent && (
                    <div
                      className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        isTodayCell ? "bg-white" : "bg-[#2563eb]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── EVENTS LIST ─── */}
        <div data-tour="calendar-events" className="anim-fade-up delay-2 bg-white rounded-2xl border border-[#e8ecf4] overflow-hidden hover-lift" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="p-5 border-b border-[#e8ecf4] flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <Calendar size={16} className="text-[#2563eb]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1e293b]">אירועים קרובים ({events.length})</h3>
          </div>
          <div className="divide-y divide-[#e8ecf4]">
            {events.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-[#64748b]">אין אירועים קרובים</div>
            ) : (
              events.map((ev, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEvent(selectedEvent?.timestamp === ev.timestamp && selectedEvent?.title === ev.title ? null : ev)}
                  className={`anim-fade-right delay-${(i % 5) + 1} w-full flex items-center gap-4 p-5 hover:bg-[#f8f9fc] transition-colors text-right`}
                >
                  <div className="text-center flex-shrink-0 w-14">
                    <div className="text-2xl font-bold" style={{ color: ev.color }}>
                      {ev.day}
                    </div>
                    <div className="text-[11px] text-[#64748b]">{hebrewMonths[ev.month]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#1e293b]">{ev.title}</div>
                    <div className="text-[12px] text-[#64748b]">{ev.sub}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                      style={{
                        background: ev.tag === "דחוף" ? "#fef2f2" : ev.tag === "בקרוב" ? "#fffbeb" : "#f0fdf4",
                        color: ev.color,
                        border: `1px solid ${ev.tag === "דחוף" ? "#fecaca" : ev.tag === "בקרוב" ? "#fde68a" : "#bbf7d0"}`,
                      }}
                    >
                      {ev.tag}
                    </span>
                    {ev.complianceItemId && (() => {
                      const ci = complianceItems.find(c => c.id === ev.complianceItemId);
                      return ci ? <HandleNowButton item={ci} onClick={setActionItem} size="sm" /> : null;
                    })()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── EVENT DETAIL POPUP ─── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 border border-[#e8ecf4]"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#1e293b]">פרטי אירוע</h3>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg hover:bg-[#f8f9fc] text-[#64748b] hover:text-[#1e293b] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-[#64748b] mb-1">כותרת</div>
                <div className="text-[14px] font-semibold text-[#1e293b]">{selectedEvent.title}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#64748b] mb-1">תאריך</div>
                <div className="text-[14px] font-semibold text-[#2563eb]">{selectedEvent.fullDate}</div>
              </div>
              {selectedEvent.time && (
                <div>
                  <div className="text-[11px] text-[#64748b] mb-1">שעה</div>
                  <div className="text-[14px] font-semibold text-[#1e293b]">{selectedEvent.time}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] text-[#64748b] mb-1">פרטים</div>
                <div className="text-[13px] text-[#1e293b]">{selectedEvent.sub}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg inline-block"
                  style={{
                    background: selectedEvent.tag === "דחוף" ? "#fef2f2" : selectedEvent.tag === "בקרוב" ? "#fffbeb" : "#f0fdf4",
                    color: selectedEvent.color,
                    border: `1px solid ${selectedEvent.tag === "דחוף" ? "#fecaca" : selectedEvent.tag === "בקרוב" ? "#fde68a" : "#bbf7d0"}`,
                  }}
                >
                  {selectedEvent.tag}
                </span>
                {selectedEvent.complianceItemId && (() => {
                  const ci = complianceItems.find(c => c.id === selectedEvent.complianceItemId);
                  return ci ? (
                    <HandleNowButton
                      item={ci}
                      onClick={(item) => { setSelectedEvent(null); setActionItem(item); }}
                      size="sm"
                    />
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <SmartActionsModal item={actionItem} onClose={() => setActionItem(null)} onHandled={() => window.location.reload()} />
    </div>
  );
}

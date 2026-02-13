"use client";

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import type { DaySummary } from "@/lib/get-it-done/types";

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed (0=Jan)
  summaries: Record<string, DaySummary>;
  onSelectDate: (date: string) => void;
  weekStart?: 0 | 1; // 0=Sunday, 1=Monday
}

const DAY_HEADERS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_HEADERS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({
  year,
  month,
  summaries,
  onSelectDate,
  weekStart = 0,
}: CalendarGridProps) {
  const monthDate = new Date(year, month, 1);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  const today = startOfDay(new Date());

  const dayHeaders = weekStart === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN;

  // Calculate leading empty cells
  let firstDayOfWeek = getDay(start); // 0=Sun
  if (weekStart === 1) {
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  }

  // Dot indicators: 1 dot for 1-2 tasks, 2 dots for 3-4, 3 dots for 5+
  function getDotCount(dateStr: string): number {
    const summary = summaries[dateStr];
    if (!summary || summary.total === 0) return 0;
    if (summary.total <= 2) return 1;
    if (summary.total <= 4) return 2;
    return 3;
  }

  function isAllComplete(dateStr: string): boolean {
    const summary = summaries[dateStr];
    if (!summary || summary.total === 0) return false;
    return summary.completed === summary.total;
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayIsToday = isToday(day);
          const isPast = isBefore(day, today) && !dayIsToday;
          const dotCount = getDotCount(dateStr);
          const allDone = isAllComplete(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 ${
                dayIsToday
                  ? "bg-[#2563EB] text-white font-bold"
                  : isPast
                    ? "text-[#1A1A1A]/50 hover:bg-[#F3F4F6]"
                    : "text-[#1A1A1A] hover:bg-[#F3F4F6]"
              }`}
              aria-label={`${format(day, "MMMM d, yyyy")}${dotCount > 0 ? `, ${summaries[dateStr]?.total} tasks` : ""}`}
            >
              <span className="text-sm font-medium leading-none">
                {format(day, "d")}
              </span>
              {dotCount > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 w-1 rounded-full ${
                        dayIsToday
                          ? "bg-white/80"
                          : allDone
                            ? "bg-[#6B9E78]"
                            : "bg-[#2563EB]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

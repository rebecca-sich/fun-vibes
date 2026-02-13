"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import type { DaySummary } from "@/lib/get-it-done/types";
import { CalendarGrid } from "@/components/get-it-done/CalendarGrid";

export default function CalendarPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});
  const [loading, setLoading] = useState(true);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/get-it-done/api/tasks/month?slug=${slug}&year=${year}&month=${month + 1}`
      );
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.summaries);
      }
    } catch (err) {
      console.error("Failed to fetch month summaries:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, year, month]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  function handlePrevMonth() {
    const prev = subMonths(new Date(year, month, 1), 1);
    setYear(prev.getFullYear());
    setMonth(prev.getMonth());
  }

  function handleNextMonth() {
    const next = addMonths(new Date(year, month, 1), 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function handleGoToCurrentMonth() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  function handleSelectDate(date: string) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (date === todayStr) {
      router.push(`/get-it-done/${slug}/today`);
    } else {
      router.push(`/get-it-done/${slug}/today?date=${date}`);
    }
  }

  const monthLabel = format(new Date(year, month, 1), "MMMM yyyy");

  return (
    <div className="py-4 space-y-5">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          aria-label="Previous month"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h2 className="text-lg font-bold text-[#1A1A1A]">{monthLabel}</h2>

        <button
          onClick={handleNextMonth}
          className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          aria-label="Next month"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* "Today" quick return */}
      {!isCurrentMonth && (
        <div className="flex justify-center">
          <button
            onClick={handleGoToCurrentMonth}
            className="rounded-full border-2 border-[#2563EB] px-4 py-1.5 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[38px]"
          >
            Today
          </button>
        </div>
      )}

      {/* Calendar grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl bg-[#F3F4F6]"
            />
          ))}
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          summaries={summaries}
          onSelectDate={handleSelectDate}
        />
      )}
    </div>
  );
}

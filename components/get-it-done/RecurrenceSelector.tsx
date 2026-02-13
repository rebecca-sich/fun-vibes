"use client";

import type { RecurrenceFrequency } from "@/lib/get-it-done/types";

interface RecurrenceSelectorProps {
  frequency: RecurrenceFrequency | "none";
  interval: number;
  daysOfWeek: number[];
  endDate: string;
  onChange: (data: {
    frequency: RecurrenceFrequency | "none";
    interval: number;
    daysOfWeek: number[];
    endDate: string;
  }) => void;
}

const FREQUENCY_OPTIONS: { label: string; value: RecurrenceFrequency | "none" }[] = [
  { label: "None", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getSummary(
  frequency: RecurrenceFrequency | "none",
  interval: number,
  daysOfWeek: number[]
): string {
  if (frequency === "none") return "";

  const fullDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (frequency === "daily") {
    return interval === 1 ? "Repeats every day" : `Repeats every ${interval} days`;
  }

  if (frequency === "weekly") {
    const dayNames = daysOfWeek.sort().map((d) => fullDays[d]);
    const dayStr = dayNames.length > 0 ? ` on ${dayNames.join(", ")}` : "";
    return interval === 1
      ? `Repeats every week${dayStr}`
      : `Repeats every ${interval} weeks${dayStr}`;
  }

  if (frequency === "monthly") {
    return interval === 1
      ? "Repeats every month"
      : `Repeats every ${interval} months`;
  }

  return "";
}

export function RecurrenceSelector({
  frequency,
  interval,
  daysOfWeek,
  endDate,
  onChange,
}: RecurrenceSelectorProps) {
  function setFrequency(f: RecurrenceFrequency | "none") {
    onChange({ frequency: f, interval, daysOfWeek, endDate });
  }

  function setInterval(n: number) {
    onChange({ frequency, interval: n, daysOfWeek, endDate });
  }

  function toggleDay(day: number) {
    const next = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day];
    onChange({ frequency, interval, daysOfWeek: next, endDate });
  }

  function setEndDate(d: string) {
    onChange({ frequency, interval, daysOfWeek, endDate: d });
  }

  const summary = getSummary(frequency, interval, daysOfWeek);

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-[#6B7280]">
        Repeats?
      </span>

      {/* Frequency pills */}
      <div className="flex flex-wrap gap-2">
        {FREQUENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFrequency(opt.value)}
            className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
              frequency === opt.value
                ? "border-[#2563EB] bg-[#2563EB] text-white"
                : "border-[#E5E7EB] bg-white text-[#6B7280]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {frequency !== "none" && (
        <>
          {/* Day-of-week selector (weekly only) */}
          {frequency === "weekly" && (
            <div>
              <span className="block text-xs font-medium text-[#9CA3AF] mb-2">
                Which days?
              </span>
              <div className="flex gap-2 justify-center">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                      daysOfWeek.includes(i)
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-[#E5E7EB] bg-white text-[#6B7280]"
                    }`}
                    aria-label={
                      ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i]
                    }
                    aria-pressed={daysOfWeek.includes(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interval */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="recurrence-interval"
              className="text-sm font-medium text-[#6B7280] whitespace-nowrap"
            >
              Every
            </label>
            <input
              id="recurrence-interval"
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 rounded-xl border-2 border-[#E5E7EB] bg-white px-3 py-2 text-center text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[42px]"
            />
            <span className="text-sm font-medium text-[#6B7280]">
              {frequency === "daily"
                ? interval === 1 ? "day" : "days"
                : frequency === "weekly"
                  ? interval === 1 ? "week" : "weeks"
                  : interval === 1 ? "month" : "months"}
            </span>
          </div>

          {/* End date (optional) */}
          <div>
            <label
              htmlFor="recurrence-end"
              className="block text-xs font-medium text-[#9CA3AF] mb-1.5"
            >
              End date (optional — blank = repeats forever)
            </label>
            <input
              id="recurrence-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-2.5 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[42px]"
            />
          </div>

          {/* Summary */}
          {summary && (
            <p className="text-sm font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg px-3 py-2">
              {summary}
              {endDate ? ` until ${endDate}` : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}

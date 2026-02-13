"use client";

import { useState } from "react";
import type { TaskInstance } from "@/lib/get-it-done/types";

interface TaskCardProps {
  instance: TaskInstance;
  onToggleComplete: (instance: TaskInstance) => void;
  onEdit: (instance: TaskInstance) => void;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export function TaskCard({ instance, onToggleComplete, onEdit }: TaskCardProps) {
  const [animating, setAnimating] = useState(false);

  function handleToggle() {
    setAnimating(true);
    onToggleComplete(instance);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm border border-[#F3F4F6]">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`mt-0.5 flex h-[26px] w-[26px] min-h-[46px] min-w-[46px] items-center justify-center rounded-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
          instance.completed
            ? "border-[#6B9E78] bg-[#6B9E78]"
            : "border-[#D1D5DB] bg-white"
        }`}
        aria-label={
          instance.completed
            ? `Mark "${instance.title}" as incomplete`
            : `Mark "${instance.title}" as complete`
        }
      >
        {instance.completed && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Title + time — tappable for edit */}
      <button
        onClick={() => onEdit(instance)}
        className="flex flex-1 flex-col items-start text-left min-h-[46px] justify-center focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 rounded-lg -ml-1 pl-1"
        aria-label={`Edit task: ${instance.title}`}
      >
        <span
          className={`text-lg font-semibold leading-snug transition-all duration-300 ${
            instance.completed
              ? "line-through text-[#9CA3AF]"
              : "text-[#1A1A1A]"
          } ${animating ? "opacity-70" : ""}`}
        >
          {instance.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          {instance.time && (
            <span
              className={`text-sm ${
                instance.completed ? "text-[#D1D5DB]" : "text-[#6B7280]"
              }`}
            >
              {formatTime(instance.time)}
            </span>
          )}
          {instance.is_recurring && (
            <span className="inline-flex items-center rounded-full bg-[#EFF6FF] px-2 py-0.5 text-xs font-medium text-[#2563EB]">
              Repeats
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import type { TaskInstance, RecurrenceFrequency } from "@/lib/get-it-done/types";
import { RecurrenceSelector } from "./RecurrenceSelector";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData, scope?: "all" | "this") => void;
  onDelete?: (scope: "all" | "this") => void;
  editingTask?: TaskInstance | null;
  defaultDate: string;
}

export interface TaskFormData {
  title: string;
  notes: string;
  date: string;
  time: string;
  hasTime: boolean;
  reminder_enabled: boolean;
  reminder_offset_minutes: number;
  recurrence_frequency: RecurrenceFrequency | "none";
  recurrence_interval: number;
  recurrence_days_of_week: number[];
  recurrence_end_date: string;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingTask,
  defaultDate,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [hasTime, setHasTime] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffset, setReminderOffset] = useState(15);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Recurrence state
  const [recFrequency, setRecFrequency] = useState<RecurrenceFrequency | "none">("none");
  const [recInterval, setRecInterval] = useState(1);
  const [recDaysOfWeek, setRecDaysOfWeek] = useState<number[]>([]);
  const [recEndDate, setRecEndDate] = useState("");

  // Edit scope state — shown when saving changes to a recurring task
  const [showEditScope, setShowEditScope] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<TaskFormData | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  // Populate form when editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || "");
      setDate(editingTask.instance_date);
      setHasTime(!!editingTask.time);
      setTime(editingTask.time || "09:00");
      setReminderEnabled(editingTask.reminder?.enabled ?? false);
      setReminderOffset(editingTask.reminder?.offset_minutes ?? 15);
      // Don't show recurrence options when editing — scope chooser handles it
      setRecFrequency("none");
      setRecInterval(1);
      setRecDaysOfWeek([]);
      setRecEndDate("");
    } else {
      setTitle("");
      setNotes("");
      setDate(defaultDate);
      setTime("09:00");
      setHasTime(false);
      setReminderEnabled(false);
      setReminderOffset(15);
      setRecFrequency("none");
      setRecInterval(1);
      setRecDaysOfWeek([]);
      setRecEndDate("");
    }
    setShowDeleteConfirm(false);
    setShowEditScope(false);
    setPendingFormData(null);
  }, [editingTask, defaultDate, isOpen]);

  // Auto-focus title
  useEffect(() => {
    if (isOpen && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isEditing = !!editingTask;
  const isRecurring = editingTask?.is_recurring ?? false;

  function buildFormData(): TaskFormData {
    return {
      title: title.trim(),
      notes: notes.trim(),
      date,
      time: hasTime ? time : "",
      hasTime,
      reminder_enabled: reminderEnabled,
      reminder_offset_minutes: reminderOffset,
      recurrence_frequency: recFrequency,
      recurrence_interval: recInterval,
      recurrence_days_of_week: recDaysOfWeek,
      recurrence_end_date: recEndDate,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const data = buildFormData();

    if (isEditing && isRecurring) {
      // Show scope chooser for recurring task edits
      setPendingFormData(data);
      setShowEditScope(true);
      return;
    }

    onSave(data);
  }

  function handleScopeChoice(scope: "all" | "this") {
    if (pendingFormData) {
      onSave(pendingFormData, scope);
    }
    setShowEditScope(false);
    setPendingFormData(null);
  }

  const reminderOptions = [
    { label: "At the time", value: 0 },
    { label: "15 min before", value: 15 },
    { label: "30 min before", value: 30 },
    { label: "1 hour before", value: 60 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div
        className="fixed z-40 inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit task" : "Add a task"}
      >
        <div className="rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {isEditing ? "Edit Task" : "Add a Task"}
            </h2>
            <button
              onClick={onClose}
              className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl text-[#9CA3AF] transition-colors hover:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              aria-label="Close"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Edit scope chooser overlay */}
          {showEditScope && (
            <div className="p-5 space-y-4">
              <p className="text-center text-base font-semibold text-[#1A1A1A]">
                Apply changes to...
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleScopeChoice("this")}
                  className="flex-1 rounded-xl border-2 border-[#E5E7EB] px-4 py-4 text-base font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[54px]"
                >
                  Just this one
                </button>
                <button
                  type="button"
                  onClick={() => handleScopeChoice("all")}
                  className="flex-1 rounded-xl bg-[#2563EB] px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[54px]"
                >
                  All occurrences
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditScope(false);
                  setPendingFormData(null);
                }}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[46px]"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Form */}
          {!showEditScope && (
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="task-title"
                  className="block text-sm font-medium text-[#6B7280] mb-1.5"
                >
                  What do you need to do?
                </label>
                <input
                  ref={titleRef}
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Pick up prescription"
                  maxLength={200}
                  required
                  className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-lg text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[54px]"
                />
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="task-date"
                  className="block text-sm font-medium text-[#6B7280] mb-1.5"
                >
                  {isEditing && isRecurring ? "This instance date" : "Date"}
                </label>
                <input
                  id="task-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isEditing && isRecurring}
                  className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Time toggle */}
              <div>
                <span className="block text-sm font-medium text-[#6B7280] mb-2">
                  Add a time?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasTime(false)}
                    className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                      !hasTime
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-[#E5E7EB] bg-white text-[#6B7280]"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasTime(true)}
                    className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                      hasTime
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-[#E5E7EB] bg-white text-[#6B7280]"
                    }`}
                  >
                    Yes
                  </button>
                </div>
                {hasTime && (
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-2 block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
                  />
                )}
              </div>

              {/* Recurrence selector — only for new tasks (not when editing) */}
              {!isEditing && (
                <RecurrenceSelector
                  frequency={recFrequency}
                  interval={recInterval}
                  daysOfWeek={recDaysOfWeek}
                  endDate={recEndDate}
                  onChange={(data) => {
                    setRecFrequency(data.frequency);
                    setRecInterval(data.interval);
                    setRecDaysOfWeek(data.daysOfWeek);
                    setRecEndDate(data.endDate);
                  }}
                />
              )}

              {/* Recurring task info badge when editing */}
              {isEditing && isRecurring && (
                <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3">
                  <p className="text-sm font-medium text-[#2563EB]">
                    This is a recurring task. When you save, you&apos;ll choose
                    whether to update just this instance or all occurrences.
                  </p>
                </div>
              )}

              {/* Reminder (UI only, not wired to sending) */}
              {hasTime && (
                <div>
                  <span className="block text-sm font-medium text-[#6B7280] mb-2">
                    Remind me?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReminderEnabled(false)}
                      className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                        !reminderEnabled
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-[#E5E7EB] bg-white text-[#6B7280]"
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderEnabled(true)}
                      className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                        reminderEnabled
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-[#E5E7EB] bg-white text-[#6B7280]"
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                  {reminderEnabled && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reminderOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setReminderOffset(opt.value)}
                          className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                            reminderOffset === opt.value
                              ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                              : "border-[#E5E7EB] bg-white text-[#6B7280]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label
                  htmlFor="task-notes"
                  className="block text-sm font-medium text-[#6B7280] mb-1.5"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="task-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
                />
              </div>

              {/* Save button */}
              <button
                type="submit"
                disabled={!title.trim()}
                className="w-full rounded-xl bg-[#2563EB] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:bg-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed min-h-[54px]"
              >
                {isEditing ? "Save Changes" : "Save Task"}
              </button>

              {/* Delete button (edit mode only) */}
              {isEditing && onDelete && (
                <div className="pt-2 border-t border-[#F3F4F6]">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full rounded-xl px-4 py-3 text-base font-semibold text-[#DC4F4F] transition-colors hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-[#DC4F4F] focus:ring-offset-2 min-h-[50px]"
                    >
                      Delete Task
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-center text-sm font-medium text-[#6B7280]">
                        {isRecurring
                          ? "Delete this task?"
                          : "Are you sure?"}
                      </p>
                      {isRecurring ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onDelete("this")}
                            className="flex-1 rounded-xl border-2 border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px]"
                          >
                            Just this one
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete("all")}
                            className="flex-1 rounded-xl bg-[#DC4F4F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C53030] focus:outline-none focus:ring-2 focus:ring-[#DC4F4F] focus:ring-offset-2 min-h-[50px]"
                          >
                            All occurrences
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 rounded-xl border-2 border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete("all")}
                            className="flex-1 rounded-xl bg-[#DC4F4F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C53030] focus:outline-none focus:ring-2 focus:ring-[#DC4F4F] focus:ring-offset-2 min-h-[50px]"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}

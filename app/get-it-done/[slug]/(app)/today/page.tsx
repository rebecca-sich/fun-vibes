"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import type { TaskInstance, TimeSlot } from "@/lib/get-it-done/types";
import { TimeSlotGroup } from "@/components/get-it-done/TimeSlotGroup";
import { TaskModal, type TaskFormData } from "@/components/get-it-done/TaskModal";
import { UndoToast } from "@/components/get-it-done/UndoToast";

function getTimeSlot(time?: string): TimeSlot {
  if (!time) return "anytime";
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function groupBySlot(tasks: TaskInstance[]) {
  const groups: Record<TimeSlot, TaskInstance[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    anytime: [],
  };

  for (const task of tasks) {
    groups[getTimeSlot(task.time)].push(task);
  }

  // Sort timed tasks chronologically within each group
  for (const slot of ["morning", "afternoon", "evening"] as TimeSlot[]) {
    groups[slot].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }

  return groups;
}

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

export default function TodayPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug;

  const dateParam = searchParams.get("date");
  const currentDate = dateParam || format(new Date(), "yyyy-MM-dd");
  const parsedDate = parseISO(currentDate);
  const isCurrentDateToday = isToday(parsedDate);

  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskInstance | null>(null);

  // Undo state
  const [undoToast, setUndoToast] = useState<{
    message: string;
    undoAction: () => void;
  } | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/get-it-done/api/tasks?slug=${slug}&date=${currentDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, currentDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function navigateToDate(date: string) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (date === todayStr) {
      router.push(`/get-it-done/${slug}/today`);
    } else {
      router.push(`/get-it-done/${slug}/today?date=${date}`);
    }
  }

  function handlePrevDay() {
    navigateToDate(format(subDays(parsedDate, 1), "yyyy-MM-dd"));
  }

  function handleNextDay() {
    navigateToDate(format(addDays(parsedDate, 1), "yyyy-MM-dd"));
  }

  function handleGoToToday() {
    router.push(`/get-it-done/${slug}/today`);
  }

  async function handleToggleComplete(instance: TaskInstance) {
    const newCompleted = !instance.completed;
    const prevTasks = [...tasks];

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.task_id === instance.task_id &&
        t.instance_date === instance.instance_date
          ? { ...t, completed: newCompleted }
          : t
      )
    );

    try {
      const res = await fetch(
        `/get-it-done/api/tasks/${instance.task_id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: instance.instance_date,
            completed: newCompleted,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to toggle");

      if (newCompleted) {
        setUndoToast({
          message: "Task completed",
          undoAction: () => {
            // Revert optimistic + call API
            setTasks(prevTasks);
            fetch(`/get-it-done/api/tasks/${instance.task_id}/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: instance.instance_date,
                completed: false,
              }),
            });
          },
        });
      }
    } catch {
      // Revert on failure
      setTasks(prevTasks);
    }
  }

  function handleEditTask(instance: TaskInstance) {
    setEditingTask(instance);
    setModalOpen(true);
  }

  function handleAddTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  async function handleSaveTask(data: TaskFormData, scope?: "all" | "this") {
    setModalOpen(false);

    if (editingTask) {
      // Editing a recurring task — "just this one" creates a modify exception
      if (editingTask.is_recurring && scope === "this") {
        try {
          await fetch(
            `/get-it-done/api/tasks/${editingTask.task_id}/exceptions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: editingTask.instance_date,
                type: "modify",
                title: data.title,
                notes: data.notes || null,
                time: data.hasTime ? data.time : null,
                reminder_enabled: data.reminder_enabled,
                reminder_offset_minutes: data.reminder_offset_minutes,
              }),
            }
          );
          await fetchTasks();
        } catch (err) {
          console.error("Failed to create exception:", err);
        }
      } else {
        // Update the base task (scope="all" or non-recurring)
        try {
          await fetch(`/get-it-done/api/tasks/${editingTask.task_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: data.title,
              notes: data.notes || null,
              date: editingTask.is_recurring ? undefined : data.date,
              time: data.hasTime ? data.time : null,
              reminder_enabled: data.reminder_enabled,
              reminder_offset_minutes: data.reminder_offset_minutes,
            }),
          });
          await fetchTasks();
        } catch (err) {
          console.error("Failed to update task:", err);
        }
      }
    } else {
      // Create new task (with optional recurrence)
      const recurrence =
        data.recurrence_frequency !== "none"
          ? {
              frequency: data.recurrence_frequency,
              interval: data.recurrence_interval,
              days_of_week:
                data.recurrence_frequency === "weekly" &&
                data.recurrence_days_of_week.length > 0
                  ? data.recurrence_days_of_week
                  : undefined,
              end_date: data.recurrence_end_date || undefined,
            }
          : undefined;

      try {
        await fetch("/get-it-done/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_slug: slug,
            title: data.title,
            notes: data.notes || undefined,
            date: data.date,
            time: data.hasTime ? data.time : undefined,
            recurrence,
            reminder: data.reminder_enabled
              ? {
                  enabled: true,
                  offset_minutes: data.reminder_offset_minutes,
                }
              : undefined,
          }),
        });
        await fetchTasks();
      } catch (err) {
        console.error("Failed to create task:", err);
      }
    }

    setEditingTask(null);
  }

  async function handleDeleteTask(scope: "all" | "this") {
    if (!editingTask) return;

    const taskId = editingTask.task_id;
    const instanceDate = editingTask.instance_date;
    const taskTitle = editingTask.title;

    setModalOpen(false);
    setEditingTask(null);

    try {
      const params = new URLSearchParams({ scope });
      if (scope === "this") {
        params.set("date", instanceDate);
      }

      const res = await fetch(
        `/get-it-done/api/tasks/${taskId}?${params.toString()}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setUndoToast({
          message: `"${taskTitle}" deleted`,
          undoAction: async () => {
            // For simple deletes, re-fetch will show the task is gone
            // Real undo would need server-side soft delete — for now just re-fetch
            await fetchTasks();
          },
        });
        await fetchTasks();
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  const groups = groupBySlot(tasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const allComplete = totalTasks > 0 && completedTasks === totalTasks;
  const slotOrder: TimeSlot[] = ["morning", "afternoon", "evening", "anytime"];
  const hasAnyTasks = slotOrder.some((s) => groups[s].length > 0);

  return (
    <div className="py-4 space-y-5">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevDay}
          className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          aria-label="Previous day"
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

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {isCurrentDateToday
              ? "Today"
              : format(parsedDate, "EEEE")}
          </h2>
          <p className="text-sm text-[#6B7280]">
            {format(parsedDate, "MMMM d, yyyy")}
          </p>
        </div>

        <button
          onClick={handleNextDay}
          className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          aria-label="Next day"
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

      {/* "Today" quick return button */}
      {!isCurrentDateToday && (
        <div className="flex justify-center">
          <button
            onClick={handleGoToToday}
            className="rounded-full border-2 border-[#2563EB] px-4 py-1.5 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[38px]"
          >
            Back to Today
          </button>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl bg-[#F3F4F6]"
            />
          ))}
        </div>
      ) : !hasAnyTasks ? (
        <div className="py-12 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">
            ☀️
          </div>
          <p className="text-lg font-semibold text-[#1A1A1A]">
            Nothing planned for {isCurrentDateToday ? "today" : "this day"}
          </p>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Enjoy your day, or add a task below!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {allComplete && (
            <div className="rounded-xl bg-[#F0FDF4] p-4 text-center border border-[#BBF7D0]">
              <p className="text-lg font-semibold text-[#166534]">
                All done! Nice work.
              </p>
            </div>
          )}

          {slotOrder.map((slot) => (
            <TimeSlotGroup
              key={slot}
              label={SLOT_LABELS[slot]}
              tasks={groups[slot]}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
            />
          ))}
        </div>
      )}

      {/* Add Task button */}
      <button
        onClick={handleAddTask}
        className="w-full rounded-xl border-2 border-dashed border-[#D1D5DB] bg-white px-8 py-4 text-lg font-semibold text-[#6B7280] transition-colors hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#EFF6FF] active:bg-[#DBEAFE] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[54px]"
      >
        + Add a Task
      </button>

      {/* Task modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
        editingTask={editingTask}
        defaultDate={currentDate}
      />

      {/* Undo toast */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={() => {
            undoToast.undoAction();
            setUndoToast(null);
          }}
          onDismiss={() => setUndoToast(null)}
        />
      )}
    </div>
  );
}

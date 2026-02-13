"use client";

import type { TaskInstance } from "@/lib/get-it-done/types";
import { TaskCard } from "./TaskCard";

interface TimeSlotGroupProps {
  label: string;
  tasks: TaskInstance[];
  onToggleComplete: (instance: TaskInstance) => void;
  onEdit: (instance: TaskInstance) => void;
}

export function TimeSlotGroup({
  label,
  tasks,
  onToggleComplete,
  onEdit,
}: TimeSlotGroupProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
        {label}
      </h2>
      <div className="space-y-2.5">
        {tasks.map((instance) => (
          <TaskCard
            key={`${instance.task_id}-${instance.instance_date}`}
            instance={instance}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

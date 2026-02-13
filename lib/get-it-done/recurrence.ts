import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  getDay,
  getDate,
  lastDayOfMonth,
  parseISO,
  format,
  isBefore,
  isAfter,
  isSameDay,
  eachDayOfInterval,
  addDays,
} from "date-fns";
import type {
  Task,
  TaskException,
  TaskCompletion,
  TaskInstance,
  RecurrenceRule,
} from "./types";

/**
 * Compute all task instances (one-off + recurring) for a single date.
 */
export function getTaskInstancesForDate(
  oneOffTasks: Task[],
  recurringTasks: Task[],
  exceptions: TaskException[],
  completions: TaskCompletion[],
  date: string
): TaskInstance[] {
  const instances: TaskInstance[] = [];

  // One-off tasks for this date
  for (const task of oneOffTasks) {
    instances.push({
      task_id: task.id,
      user_slug: task.user_slug,
      instance_date: date,
      title: task.title,
      notes: task.notes,
      time: task.time,
      completed: task.completed,
      completed_at: task.completed_at,
      is_recurring: false,
      is_exception: false,
      reminder: task.reminder,
    });
  }

  // Recurring task instances for this date
  const targetDate = parseISO(date);
  for (const task of recurringTasks) {
    if (!task.recurrence) continue;
    if (!matchesRecurrence(task.recurrence, task.date, date)) continue;

    // Check for exceptions
    const exception = exceptions.find(
      (e) => e.task_id === task.id && e.exception_date === date
    );
    if (exception?.type === "skip") continue;

    // Check for completion
    const completion = completions.find(
      (c) => c.task_id === task.id && c.date === date
    );

    instances.push({
      task_id: task.id,
      user_slug: task.user_slug,
      instance_date: date,
      title: exception?.title ?? task.title,
      notes: exception?.notes ?? task.notes,
      time: exception?.time ?? task.time,
      completed: completion?.completed ?? false,
      completed_at: completion?.completed_at,
      is_recurring: true,
      is_exception: !!exception,
      reminder:
        exception?.reminder_enabled != null
          ? {
              enabled: exception.reminder_enabled,
              offset_minutes: exception.reminder_offset_minutes ?? 15,
            }
          : task.reminder,
    });
  }

  return instances;
}

/**
 * Compute task instance counts for each day in a date range.
 * Returns a map of { [YYYY-MM-DD]: { total, completed } }.
 */
export function getTaskSummariesForRange(
  oneOffTasks: Task[],
  recurringTasks: Task[],
  exceptions: TaskException[],
  completions: TaskCompletion[],
  startDate: string,
  endDate: string
): Record<string, { total: number; completed: number }> {
  const summaries: Record<string, { total: number; completed: number }> = {};
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const days = eachDayOfInterval({ start, end });

  // Index one-off tasks by date
  const oneOffByDate = new Map<string, Task[]>();
  for (const task of oneOffTasks) {
    const existing = oneOffByDate.get(task.date) || [];
    existing.push(task);
    oneOffByDate.set(task.date, existing);
  }

  // Index exceptions by task_id + date
  const exceptionMap = new Map<string, TaskException>();
  for (const ex of exceptions) {
    exceptionMap.set(`${ex.task_id}:${ex.exception_date}`, ex);
  }

  // Index completions by task_id + date
  const completionSet = new Set<string>();
  for (const c of completions) {
    completionSet.add(`${c.task_id}:${c.date}`);
  }

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    let total = 0;
    let completed = 0;

    // Count one-off tasks
    const dayTasks = oneOffByDate.get(dateStr) || [];
    for (const task of dayTasks) {
      total++;
      if (task.completed) completed++;
    }

    // Count recurring instances
    for (const task of recurringTasks) {
      if (!task.recurrence) continue;
      if (!matchesRecurrence(task.recurrence, task.date, dateStr)) continue;

      const key = `${task.id}:${dateStr}`;
      const exception = exceptionMap.get(key);
      if (exception?.type === "skip") continue;

      total++;
      if (completionSet.has(key)) completed++;
    }

    if (total > 0) {
      summaries[dateStr] = { total, completed };
    }
  }

  return summaries;
}

/**
 * Check if a recurring task should appear on a given target date.
 */
export function matchesRecurrence(
  rule: RecurrenceRule,
  startDateStr: string,
  targetDateStr: string
): boolean {
  const startDate = parseISO(startDateStr);
  const targetDate = parseISO(targetDateStr);

  // Can't occur before start date
  if (isBefore(targetDate, startDate)) return false;

  // Check end date
  if (rule.end_date && isAfter(targetDate, parseISO(rule.end_date))) {
    return false;
  }

  // Same day always matches
  if (isSameDay(startDate, targetDate)) return true;

  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case "daily": {
      const daysDiff = differenceInCalendarDays(targetDate, startDate);
      return daysDiff >= 0 && daysDiff % interval === 0;
    }

    case "weekly": {
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        // Match specific days of the week
        const targetDay = getDay(targetDate);
        if (!rule.days_of_week.includes(targetDay)) return false;

        if (interval === 1) return true;

        // For interval > 1, check week alignment
        const daysDiff = differenceInCalendarDays(targetDate, startDate);
        const weeksDiff = Math.floor(daysDiff / 7);
        return weeksDiff % interval === 0;
      } else {
        // Same day of week as start date
        const daysDiff = differenceInCalendarDays(targetDate, startDate);
        return daysDiff % (7 * interval) === 0;
      }
    }

    case "monthly": {
      const monthsDiff = differenceInCalendarMonths(targetDate, startDate);
      if (monthsDiff < 0 || monthsDiff % interval !== 0) return false;

      // Handle months where date doesn't exist (e.g., 31st in Feb)
      const startDay = getDate(startDate);
      const lastDay = getDate(lastDayOfMonth(targetDate));
      const effectiveDay = Math.min(startDay, lastDay);
      return getDate(targetDate) === effectiveDay;
    }

    case "custom": {
      // Custom uses the same logic as daily with the interval
      const daysDiff = differenceInCalendarDays(targetDate, startDate);
      return daysDiff >= 0 && daysDiff % interval === 0;
    }

    default:
      return false;
  }
}

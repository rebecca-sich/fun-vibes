import { getSupabase } from "./supabase";
import type {
  User,
  Task,
  TaskException,
  TaskCompletion,
} from "./types";

// ── Users ─────────────────────────────────────────────

export async function createUser(
  user: Omit<User, "created_at" | "updated_at">
): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .insert(user)
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return data;
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select()
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") return null; // not found
  if (error) throw new Error(`Failed to get user: ${error.message}`);
  return data;
}

export async function updateUser(
  slug: string,
  updates: Partial<Omit<User, "slug" | "created_at">>
): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select()
    .single();

  if (error) throw new Error(`Failed to update user: ${error.message}`);
  return data;
}

export async function deleteUser(slug: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from("users").delete().eq("slug", slug);

  if (error) throw new Error(`Failed to delete user: ${error.message}`);
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") return true; // not found = available
  if (error) throw new Error(`Failed to check slug: ${error.message}`);
  return !data;
}

// ── Tasks ─────────────────────────────────────────────

export async function createTask(
  task: Omit<Task, "id" | "created_at" | "updated_at">
): Promise<Task> {
  const db = getSupabase();
  const { data, error } = await db
    .from("tasks")
    .insert({
      user_slug: task.user_slug,
      title: task.title,
      notes: task.notes || null,
      date: task.date,
      time: task.time || null,
      completed: task.completed ?? false,
      completed_at: task.completed_at || null,
      recurrence_frequency: task.recurrence?.frequency || null,
      recurrence_interval: task.recurrence?.interval ?? 1,
      recurrence_days_of_week: task.recurrence?.days_of_week || null,
      recurrence_end_date: task.recurrence?.end_date || null,
      reminder_enabled: task.reminder?.enabled ?? false,
      reminder_offset_minutes: task.reminder?.offset_minutes ?? 15,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return dbRowToTask(data);
}

export async function getTasksByDate(
  userSlug: string,
  date: string
): Promise<Task[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("tasks")
    .select()
    .eq("user_slug", userSlug)
    .eq("date", date)
    .is("recurrence_frequency", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get tasks: ${error.message}`);
  return (data || []).map(dbRowToTask);
}

export async function getTasksByDateRange(
  userSlug: string,
  startDate: string,
  endDate: string
): Promise<Task[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("tasks")
    .select()
    .eq("user_slug", userSlug)
    .gte("date", startDate)
    .lte("date", endDate)
    .is("recurrence_frequency", null)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get tasks: ${error.message}`);
  return (data || []).map(dbRowToTask);
}

export async function getRecurringTasks(userSlug: string): Promise<Task[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("tasks")
    .select()
    .eq("user_slug", userSlug)
    .not("recurrence_frequency", "is", null);

  if (error)
    throw new Error(`Failed to get recurring tasks: ${error.message}`);
  return (data || []).map(dbRowToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("tasks")
    .select()
    .eq("id", id)
    .single();

  if (error?.code === "PGRST116") return null;
  if (error) throw new Error(`Failed to get task: ${error.message}`);
  return dbRowToTask(data);
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    notes: string | null;
    date: string;
    time: string | null;
    completed: boolean;
    completed_at: string | null;
    recurrence_frequency: string | null;
    recurrence_interval: number;
    recurrence_days_of_week: number[] | null;
    recurrence_end_date: string | null;
    reminder_enabled: boolean;
    reminder_offset_minutes: number;
  }>
): Promise<Task> {
  const db = getSupabase();
  const { data, error } = await db
    .from("tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return dbRowToTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from("tasks").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete task: ${error.message}`);
}

// ── Task Exceptions ───────────────────────────────────

export async function createException(
  exception: Omit<TaskException, "id">
): Promise<TaskException> {
  const db = getSupabase();
  const { data, error } = await db
    .from("task_exceptions")
    .upsert(
      {
        task_id: exception.task_id,
        exception_date: exception.exception_date,
        type: exception.type,
        title: exception.title || null,
        notes: exception.notes || null,
        time: exception.time,
        reminder_enabled: exception.reminder_enabled ?? null,
        reminder_offset_minutes: exception.reminder_offset_minutes ?? null,
      },
      { onConflict: "task_id,exception_date" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to create exception: ${error.message}`);
  return data;
}

export async function getExceptionsForRange(
  taskId: string,
  startDate: string,
  endDate: string
): Promise<TaskException[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("task_exceptions")
    .select()
    .eq("task_id", taskId)
    .gte("exception_date", startDate)
    .lte("exception_date", endDate);

  if (error) throw new Error(`Failed to get exceptions: ${error.message}`);
  return data || [];
}

export async function getExceptionsForTasks(
  taskIds: string[],
  startDate: string,
  endDate: string
): Promise<TaskException[]> {
  if (taskIds.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("task_exceptions")
    .select()
    .in("task_id", taskIds)
    .gte("exception_date", startDate)
    .lte("exception_date", endDate);

  if (error) throw new Error(`Failed to get exceptions: ${error.message}`);
  return data || [];
}

export async function deleteException(
  taskId: string,
  exceptionDate: string
): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("task_exceptions")
    .delete()
    .eq("task_id", taskId)
    .eq("exception_date", exceptionDate);

  if (error) throw new Error(`Failed to delete exception: ${error.message}`);
}

// ── Task Completions ──────────────────────────────────

export async function createCompletion(
  taskId: string,
  date: string
): Promise<TaskCompletion> {
  const db = getSupabase();
  const { data, error } = await db
    .from("task_completions")
    .upsert(
      {
        task_id: taskId,
        date,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "task_id,date" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to create completion: ${error.message}`);
  return data;
}

export async function deleteCompletion(
  taskId: string,
  date: string
): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("task_completions")
    .delete()
    .eq("task_id", taskId)
    .eq("date", date);

  if (error) throw new Error(`Failed to delete completion: ${error.message}`);
}

export async function getCompletionsForRange(
  taskIds: string[],
  startDate: string,
  endDate: string
): Promise<TaskCompletion[]> {
  if (taskIds.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("task_completions")
    .select()
    .in("task_id", taskIds)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw new Error(`Failed to get completions: ${error.message}`);
  return data || [];
}

// ── Helpers ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToTask(row: any): Task {
  return {
    id: row.id,
    user_slug: row.user_slug,
    title: row.title,
    notes: row.notes || undefined,
    date: row.date,
    time: row.time ? row.time.slice(0, 5) : undefined, // "HH:MM:SS" → "HH:MM"
    completed: row.completed ?? false,
    completed_at: row.completed_at || undefined,
    recurrence: row.recurrence_frequency
      ? {
          frequency: row.recurrence_frequency,
          interval: row.recurrence_interval ?? 1,
          days_of_week: row.recurrence_days_of_week || undefined,
          end_date: row.recurrence_end_date || undefined,
        }
      : undefined,
    reminder:
      row.reminder_enabled != null
        ? {
            enabled: row.reminder_enabled,
            offset_minutes: row.reminder_offset_minutes ?? 15,
          }
        : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

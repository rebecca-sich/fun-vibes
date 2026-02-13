// ── User ──────────────────────────────────────────────

export interface User {
  slug: string;                   // PK, 3-30 chars, lowercase alphanumeric + hyphens
  name: string;                   // Display name, max 50 chars
  email?: string;                 // For daily digest (future)
  phone_number?: string;          // For SMS reminders (future)
  pin_hash?: string;              // bcrypt hash, null if unprotected
  is_protected: boolean;

  // Notification preferences (stored for future reminder phase)
  sms_enabled: boolean;
  email_enabled: boolean;
  daily_digest_time: string;      // "08:00" format
  default_reminder_offset: number; // minutes: 0, 15, 30, 60
  timezone: string;               // IANA timezone, e.g. "America/New_York"
  week_start: 0 | 1;             // 0 = Sunday, 1 = Monday

  created_at: string;             // ISO timestamp
  updated_at: string;
}

// ── Task ──────────────────────────────────────────────

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "custom";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;               // Every N days/weeks/months (default 1)
  days_of_week?: number[];        // For weekly: 0=Sun, 1=Mon, ..., 6=Sat
  end_date?: string;              // ISO date, null = repeats forever
}

export interface Task {
  id: string;                     // UUID
  user_slug: string;              // FK → users.slug
  title: string;                  // Max 200 chars
  notes?: string;                 // Max 1000 chars
  date: string;                   // ISO date "YYYY-MM-DD"
  time?: string;                  // "HH:MM" or null (anytime)
  completed: boolean;
  completed_at?: string;          // ISO timestamp

  // Recurrence (null = one-off task)
  recurrence?: RecurrenceRule;

  // Reminder (UI stored, sending deferred to future phase)
  reminder?: {
    enabled: boolean;
    offset_minutes: number;       // 0, 15, 30, 60
  };

  created_at: string;
  updated_at: string;
}

// ── Task Exception (recurring task modifications) ─────

export type ExceptionType = "skip" | "modify";

export interface TaskException {
  id: string;                     // UUID
  task_id: string;                // FK → tasks.id
  exception_date: string;         // ISO date this exception applies to
  type: ExceptionType;

  // Override fields (only used when type = "modify")
  title?: string;
  notes?: string;
  time?: string;
  reminder_enabled?: boolean;
  reminder_offset_minutes?: number;
}

// ── Task Completion (recurring task instance tracking) ─

export interface TaskCompletion {
  id: string;                     // UUID
  task_id: string;                // FK → tasks.id
  date: string;                   // ISO date
  completed: boolean;
  completed_at?: string;          // ISO timestamp
}

// ── Reminder Log (future phase, schema included) ──────

export interface ReminderLog {
  id: string;
  user_slug: string;
  task_id: string;
  date: string;
  type: "sms" | "email";
  sent_at: string;
  status: "sent" | "failed";
  error?: string;
}

// ── Virtual Task Instance (computed, never stored) ────

export interface TaskInstance {
  task_id: string;
  user_slug: string;
  instance_date: string;          // The specific date of this occurrence
  title: string;                  // Effective title (may be overridden by exception)
  notes?: string;
  time?: string;                  // Effective time
  completed: boolean;
  completed_at?: string;
  is_recurring: boolean;
  is_exception: boolean;          // True if modified by an exception
  reminder?: {
    enabled: boolean;
    offset_minutes: number;
  };
}

// ── Time Slot Grouping ────────────────────────────────

export type TimeSlot = "morning" | "afternoon" | "evening" | "anytime";

// ── Calendar Day Summary ──────────────────────────────

export interface DaySummary {
  total: number;
  completed: number;
}

// ── Reserved slugs ────────────────────────────────────

export const RESERVED_SLUGS = [
  "get-it-done",
  "new",
  "api",
  "admin",
  "settings",
] as const;

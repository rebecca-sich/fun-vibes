-- Get It Done — Database Schema
-- Run this in the Supabase SQL editor to create all tables.

-- ── Users ─────────────────────────────────────────────

CREATE TABLE users (
  slug TEXT PRIMARY KEY CHECK (char_length(slug) BETWEEN 3 AND 30),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  email TEXT,
  phone_number TEXT,
  pin_hash TEXT,
  is_protected BOOLEAN DEFAULT FALSE,

  -- Notification preferences
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  daily_digest_time TIME DEFAULT '08:00',
  default_reminder_offset INTEGER DEFAULT 15,
  timezone TEXT DEFAULT 'America/New_York',
  week_start INTEGER DEFAULT 0 CHECK (week_start IN (0, 1)),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slug format: lowercase, alphanumeric + hyphens, no leading/trailing hyphens
ALTER TABLE users ADD CONSTRAINT slug_format
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR char_length(slug) = 3);

-- ── Tasks ─────────────────────────────────────────────

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_slug TEXT NOT NULL REFERENCES users(slug) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  notes TEXT CHECK (char_length(notes) <= 1000),
  date DATE NOT NULL,
  time TIME,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Recurrence (null = one-off task)
  recurrence_frequency TEXT CHECK (
    recurrence_frequency IN ('daily', 'weekly', 'monthly', 'custom')
  ),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days_of_week INTEGER[],
  recurrence_end_date DATE,

  -- Reminder
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_offset_minutes INTEGER DEFAULT 15,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_date ON tasks(user_slug, date);
CREATE INDEX idx_tasks_user_recurring ON tasks(user_slug)
  WHERE recurrence_frequency IS NOT NULL;

-- ── Task Exceptions ───────────────────────────────────

CREATE TABLE task_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('skip', 'modify')),
  title TEXT,
  notes TEXT,
  time TIME,
  reminder_enabled BOOLEAN,
  reminder_offset_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, exception_date)
);

CREATE INDEX idx_task_exceptions_lookup
  ON task_exceptions(task_id, exception_date);

-- ── Task Completions ──────────────────────────────────

CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, date)
);

CREATE INDEX idx_task_completions_lookup
  ON task_completions(task_id, date);

-- ── Reminder Log (future phase) ──────────────────────

CREATE TABLE reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_slug TEXT NOT NULL REFERENCES users(slug) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminder_log_lookup
  ON reminder_log(user_slug, task_id, date, type);

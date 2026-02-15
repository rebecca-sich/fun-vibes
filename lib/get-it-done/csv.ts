import type { RecurrenceFrequency } from "./types";

// ── Types ────────────────────────────────────────────

export interface CsvTaskRow {
  title: string;
  date: string;
  time?: string;
  notes?: string;
  recurrence?: {
    frequency: RecurrenceFrequency;
    interval: number;
    days_of_week?: number[];
    end_date?: string;
  };
  reminder?: {
    enabled: boolean;
    offset_minutes: number;
  };
}

export interface CsvValidationError {
  row: number;    // 1-indexed (row 1 = first data row after header)
  field: string;
  message: string;
}

export type CsvParseResult =
  | { ok: true; tasks: CsvTaskRow[] }
  | { ok: false; errors: CsvValidationError[] };

// ── Known columns ────────────────────────────────────

const REQUIRED_COLUMNS = ["title", "date"] as const;

const KNOWN_COLUMNS = [
  "title",
  "date",
  "time",
  "notes",
  "repeat",
  "repeat_interval",
  "repeat_days",
  "repeat_end",
  "reminder",
  "reminder_minutes",
] as const;

// ── Helpers ──────────────────────────────────────────

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Parse a single CSV line respecting quoted fields. */
function parseRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

const DAY_NAME_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function parseDaysOfWeek(value: string): number[] | null {
  const parts = value.split(",").map((s) => s.trim().toLowerCase());
  const days: number[] = [];
  for (const part of parts) {
    if (part === "") continue;
    const num = parseInt(part, 10);
    if (!isNaN(num) && num >= 0 && num <= 6) {
      days.push(num);
    } else if (DAY_NAME_MAP[part] !== undefined) {
      days.push(DAY_NAME_MAP[part]);
    } else {
      return null;
    }
  }
  return days.length > 0 ? Array.from(new Set(days)).sort() : null;
}

function parseBoolean(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === "yes" || v === "true" || v === "1";
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00");
  if (isNaN(d.getTime())) return false;
  // Check that the date components match (catches e.g. 2026-02-30)
  const [y, m, day] = value.split("-").map(Number);
  return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day;
}

function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

const VALID_FREQUENCIES = new Set(["daily", "weekly", "monthly"]);
const VALID_REMINDER_MINUTES = new Set([0, 15, 30, 60]);

// ── Header parsing ───────────────────────────────────

function parseHeader(
  row: string[]
): Map<string, number> | CsvValidationError[] {
  const columnMap = new Map<string, number>();
  for (let i = 0; i < row.length; i++) {
    const name = row[i].toLowerCase().trim();
    if ((KNOWN_COLUMNS as readonly string[]).includes(name)) {
      columnMap.set(name, i);
    }
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !columnMap.has(col));
  if (missing.length > 0) {
    return missing.map((col) => ({
      row: 0,
      field: col,
      message: `Required column "${col}" is missing from the header row`,
    }));
  }

  return columnMap;
}

// ── Row validation ───────────────────────────────────

function getField(
  row: string[],
  columnMap: Map<string, number>,
  field: string
): string {
  const idx = columnMap.get(field);
  if (idx === undefined || idx >= row.length) return "";
  return row[idx].trim();
}

function validateRow(
  row: string[],
  columnMap: Map<string, number>,
  rowIndex: number
): CsvTaskRow | CsvValidationError[] {
  const errors: CsvValidationError[] = [];

  // Required: title
  const title = getField(row, columnMap, "title");
  if (!title) {
    errors.push({ row: rowIndex, field: "title", message: "Title is required" });
  } else if (title.length > 200) {
    errors.push({
      row: rowIndex,
      field: "title",
      message: `Title exceeds 200 characters (${title.length})`,
    });
  }

  // Required: date
  const date = getField(row, columnMap, "date");
  if (!date) {
    errors.push({ row: rowIndex, field: "date", message: "Date is required" });
  } else if (!isValidDate(date)) {
    errors.push({
      row: rowIndex,
      field: "date",
      message: `Invalid date "${date}" — expected YYYY-MM-DD`,
    });
  }

  // Optional: time
  const time = getField(row, columnMap, "time");
  if (time && !isValidTime(time)) {
    errors.push({
      row: rowIndex,
      field: "time",
      message: `Invalid time "${time}" — expected HH:MM (24-hour)`,
    });
  }

  // Optional: notes
  const notes = getField(row, columnMap, "notes");
  if (notes.length > 1000) {
    errors.push({
      row: rowIndex,
      field: "notes",
      message: `Notes exceed 1000 characters (${notes.length})`,
    });
  }

  // Optional: repeat
  const repeat = getField(row, columnMap, "repeat").toLowerCase();
  if (repeat && !VALID_FREQUENCIES.has(repeat)) {
    errors.push({
      row: rowIndex,
      field: "repeat",
      message: `Invalid repeat value "${repeat}" — expected daily, weekly, or monthly`,
    });
  }

  // Optional: repeat_interval
  const intervalStr = getField(row, columnMap, "repeat_interval");
  let interval = 1;
  if (intervalStr) {
    interval = parseInt(intervalStr, 10);
    if (isNaN(interval) || interval < 1 || interval > 99) {
      errors.push({
        row: rowIndex,
        field: "repeat_interval",
        message: `Invalid interval "${intervalStr}" — expected a number 1-99`,
      });
    }
  }

  // Optional: repeat_days
  const daysStr = getField(row, columnMap, "repeat_days");
  let daysOfWeek: number[] | undefined;
  if (daysStr) {
    const parsed = parseDaysOfWeek(daysStr);
    if (parsed === null) {
      errors.push({
        row: rowIndex,
        field: "repeat_days",
        message: `Invalid days "${daysStr}" — use day names (Mon,Wed,Fri) or numbers (1,3,5)`,
      });
    } else {
      daysOfWeek = parsed;
    }
  }

  // Optional: repeat_end
  const repeatEnd = getField(row, columnMap, "repeat_end");
  if (repeatEnd && !isValidDate(repeatEnd)) {
    errors.push({
      row: rowIndex,
      field: "repeat_end",
      message: `Invalid end date "${repeatEnd}" — expected YYYY-MM-DD`,
    });
  }

  // Optional: reminder
  const reminderStr = getField(row, columnMap, "reminder");
  const reminderEnabled = reminderStr ? parseBoolean(reminderStr) : false;

  // Optional: reminder_minutes
  const reminderMinStr = getField(row, columnMap, "reminder_minutes");
  let reminderMinutes = 15;
  if (reminderMinStr) {
    reminderMinutes = parseInt(reminderMinStr, 10);
    if (!VALID_REMINDER_MINUTES.has(reminderMinutes)) {
      errors.push({
        row: rowIndex,
        field: "reminder_minutes",
        message: `Invalid reminder minutes "${reminderMinStr}" — expected 0, 15, 30, or 60`,
      });
    }
  }

  if (errors.length > 0) return errors;

  // Build task row
  const task: CsvTaskRow = { title, date };

  if (time) task.time = time;
  if (notes) task.notes = notes;

  if (repeat && VALID_FREQUENCIES.has(repeat)) {
    task.recurrence = {
      frequency: repeat as RecurrenceFrequency,
      interval,
      ...(daysOfWeek ? { days_of_week: daysOfWeek } : {}),
      ...(repeatEnd ? { end_date: repeatEnd } : {}),
    };
  }

  if (reminderEnabled || reminderStr) {
    task.reminder = {
      enabled: reminderEnabled,
      offset_minutes: reminderMinutes,
    };
  }

  return task;
}

// ── Main entry point ─────────────────────────────────

export function parseCsvTasks(csvText: string): CsvParseResult {
  const text = normalizeLineEndings(stripBom(csvText)).trim();

  if (!text) {
    return { ok: false, errors: [{ row: 0, field: "", message: "CSV file is empty" }] };
  }

  const lines = text.split("\n");
  const headerRow = parseRow(lines[0]);
  const columnMap = parseHeader(headerRow);

  if (Array.isArray(columnMap)) {
    return { ok: false, errors: columnMap };
  }

  if (lines.length < 2) {
    return {
      ok: false,
      errors: [{ row: 0, field: "", message: "CSV file contains no data rows" }],
    };
  }

  const allErrors: CsvValidationError[] = [];
  const tasks: CsvTaskRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip blank lines

    const row = parseRow(line);
    const result = validateRow(row, columnMap, i);

    if (Array.isArray(result)) {
      allErrors.push(...result);
    } else {
      tasks.push(result);
    }
  }

  if (allErrors.length > 0) {
    return { ok: false, errors: allErrors };
  }

  if (tasks.length === 0) {
    return {
      ok: false,
      errors: [{ row: 0, field: "", message: "CSV file contains no data rows" }],
    };
  }

  return { ok: true, tasks };
}

import { NextRequest, NextResponse } from "next/server";
import {
  getTasksByDateRange,
  getRecurringTasks,
  getExceptionsForTasks,
  getCompletionsForRange,
} from "@/lib/get-it-done/db";
import { getTaskSummariesForRange } from "@/lib/get-it-done/recurrence";
import {
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const year = request.nextUrl.searchParams.get("year");
  const month = request.nextUrl.searchParams.get("month");

  if (!slug || !year || !month) {
    return NextResponse.json(
      { error: "slug, year, and month are required" },
      { status: 400 }
    );
  }

  try {
    // month param is 1-based (1=Jan)
    const monthDate = new Date(Number(year), Number(month) - 1, 1);
    const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

    // Fetch one-off tasks in the range
    const oneOffTasks = await getTasksByDateRange(slug, startDate, endDate);

    // Fetch all recurring tasks
    const recurringTasks = await getRecurringTasks(slug);

    // Fetch exceptions and completions for recurring tasks in the range
    const recurringIds = recurringTasks.map((t) => t.id);
    const exceptions = await getExceptionsForTasks(recurringIds, startDate, endDate);
    const completions = await getCompletionsForRange(recurringIds, startDate, endDate);

    // Compute day summaries
    const summaries = getTaskSummariesForRange(
      oneOffTasks,
      recurringTasks,
      exceptions,
      completions,
      startDate,
      endDate
    );

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("Failed to get month summaries:", error);
    return NextResponse.json(
      { error: "Failed to get month summaries" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getTasksByDate,
  getRecurringTasks,
  getExceptionsForTasks,
  getCompletionsForRange,
  createTask,
} from "@/lib/get-it-done/db";
import { getTaskInstancesForDate } from "@/lib/get-it-done/recurrence";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const date = request.nextUrl.searchParams.get("date");

  if (!slug || !date) {
    return NextResponse.json(
      { error: "slug and date are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch one-off tasks for this date
    const oneOffTasks = await getTasksByDate(slug, date);

    // Fetch all recurring tasks for this user
    const recurringTasks = await getRecurringTasks(slug);

    // Fetch exceptions and completions for recurring tasks on this date
    const recurringIds = recurringTasks.map((t) => t.id);
    const exceptions = await getExceptionsForTasks(recurringIds, date, date);
    const completions = await getCompletionsForRange(recurringIds, date, date);

    // Compute all instances for this date
    const instances = getTaskInstancesForDate(
      oneOffTasks,
      recurringTasks,
      exceptions,
      completions,
      date
    );

    return NextResponse.json({ tasks: instances });
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return NextResponse.json(
      { error: "Failed to get tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_slug, title, notes, date, time, recurrence, reminder } = body;

    if (!user_slug || !title || !date) {
      return NextResponse.json(
        { error: "user_slug, title, and date are required" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    const task = await createTask({
      user_slug,
      title: title.trim(),
      notes: notes?.trim() || undefined,
      date,
      time: time || undefined,
      completed: false,
      recurrence: recurrence || undefined,
      reminder: reminder || undefined,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

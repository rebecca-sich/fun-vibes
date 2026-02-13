import { NextRequest, NextResponse } from "next/server";
import {
  getTaskById,
  createException,
  deleteException,
} from "@/lib/get-it-done/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    const body = await request.json();
    const { date, type, title, notes, time, reminder_enabled, reminder_offset_minutes } = body;

    if (!date || !type) {
      return NextResponse.json(
        { error: "date and type are required" },
        { status: 400 }
      );
    }

    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!task.recurrence) {
      return NextResponse.json(
        { error: "Exceptions only apply to recurring tasks" },
        { status: 400 }
      );
    }

    const exception = await createException({
      task_id: taskId,
      exception_date: date,
      type,
      title: title || undefined,
      notes: notes !== undefined ? notes : undefined,
      time: time !== undefined ? time : undefined,
      reminder_enabled: reminder_enabled ?? undefined,
      reminder_offset_minutes: reminder_offset_minutes ?? undefined,
    });

    return NextResponse.json({ exception }, { status: 201 });
  } catch (error) {
    console.error("Failed to create exception:", error);
    return NextResponse.json(
      { error: "Failed to create exception" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "date is required" },
      { status: 400 }
    );
  }

  try {
    await deleteException(taskId, date);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete exception:", error);
    return NextResponse.json(
      { error: "Failed to delete exception" },
      { status: 500 }
    );
  }
}

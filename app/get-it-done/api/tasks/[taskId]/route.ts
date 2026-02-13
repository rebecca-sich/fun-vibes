import { NextRequest, NextResponse } from "next/server";
import {
  getTaskById,
  updateTask,
  deleteTask,
  createException,
} from "@/lib/get-it-done/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    const body = await request.json();

    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
    if (body.date !== undefined) updates.date = body.date;
    if (body.time !== undefined) updates.time = body.time || null;
    if (body.recurrence_frequency !== undefined)
      updates.recurrence_frequency = body.recurrence_frequency || null;
    if (body.recurrence_interval !== undefined)
      updates.recurrence_interval = body.recurrence_interval;
    if (body.recurrence_days_of_week !== undefined)
      updates.recurrence_days_of_week = body.recurrence_days_of_week || null;
    if (body.recurrence_end_date !== undefined)
      updates.recurrence_end_date = body.recurrence_end_date || null;
    if (body.reminder_enabled !== undefined)
      updates.reminder_enabled = body.reminder_enabled;
    if (body.reminder_offset_minutes !== undefined)
      updates.reminder_offset_minutes = body.reminder_offset_minutes;

    const updated = await updateTask(taskId, updates);
    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const scope = request.nextUrl.searchParams.get("scope") || "all";
  const date = request.nextUrl.searchParams.get("date");

  try {
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (scope === "this" && date && task.recurrence) {
      // Skip just this occurrence by creating a skip exception
      await createException({
        task_id: taskId,
        exception_date: date,
        type: "skip",
      });
      return NextResponse.json({ success: true, action: "skipped" });
    }

    // Delete the entire task (cascades exceptions + completions)
    await deleteTask(taskId);
    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

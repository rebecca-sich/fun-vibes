import { NextRequest, NextResponse } from "next/server";
import {
  getTaskById,
  updateTask,
  createCompletion,
  deleteCompletion,
} from "@/lib/get-it-done/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    const { date, completed } = await request.json();

    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.recurrence) {
      // Recurring task — use completions table
      if (!date) {
        return NextResponse.json(
          { error: "date is required for recurring tasks" },
          { status: 400 }
        );
      }

      if (completed) {
        await createCompletion(taskId, date);
      } else {
        await deleteCompletion(taskId, date);
      }
    } else {
      // One-off task — update the task directly
      await updateTask(taskId, {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      });
    }

    return NextResponse.json({ success: true, completed });
  } catch (error) {
    console.error("Failed to toggle completion:", error);
    return NextResponse.json(
      { error: "Failed to toggle completion" },
      { status: 500 }
    );
  }
}

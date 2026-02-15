import { NextRequest, NextResponse } from "next/server";
import { parseCsvTasks } from "@/lib/get-it-done/csv";
import { createTasksBulk } from "@/lib/get-it-done/db";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { error: "slug query parameter is required" },
      { status: 400 }
    );
  }

  const csvText = await request.text();
  const result = parseCsvTasks(csvText);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Validation failed", errors: result.errors },
      { status: 400 }
    );
  }

  if (result.tasks.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 tasks per upload" },
      { status: 400 }
    );
  }

  try {
    const tasks = await createTasksBulk(slug, result.tasks);
    return NextResponse.json({ created: tasks.length }, { status: 201 });
  } catch (error) {
    console.error("Failed to bulk create tasks:", error);
    return NextResponse.json(
      { error: "Failed to create tasks" },
      { status: 500 }
    );
  }
}

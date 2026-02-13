import { NextRequest, NextResponse } from "next/server";
import { checkSlugAvailable, getUserBySlug } from "@/lib/get-it-done/db";
import { RESERVED_SLUGS } from "@/lib/get-it-done/types";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Slug parameter is required" },
      { status: 400 }
    );
  }

  const normalized = slug.toLowerCase().trim();

  // Check reserved slugs
  if (RESERVED_SLUGS.includes(normalized as (typeof RESERVED_SLUGS)[number])) {
    return NextResponse.json({ available: false });
  }

  // Check format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized) && normalized.length > 3) {
    return NextResponse.json({ available: false });
  }

  if (normalized.length < 3 || normalized.length > 30) {
    return NextResponse.json({ available: false });
  }

  try {
    const available = await checkSlugAvailable(normalized);
    // If slug exists, also return the user's name (used by PIN entry page)
    let name: string | undefined;
    if (!available) {
      const user = await getUserBySlug(normalized);
      name = user?.name;
    }
    return NextResponse.json({ available, name });
  } catch {
    return NextResponse.json(
      { error: "Failed to check slug" },
      { status: 500 }
    );
  }
}

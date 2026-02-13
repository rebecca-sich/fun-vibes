import { NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/get-it-done/session";

export async function GET() {
  try {
    const slug = await getSessionSlug();

    if (slug) {
      return NextResponse.json({ authenticated: true, slug });
    }

    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

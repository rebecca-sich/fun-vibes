import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserBySlug } from "@/lib/get-it-done/db";
import { createSession, sessionCookieHeader } from "@/lib/get-it-done/session";

export async function POST(request: NextRequest) {
  try {
    const { slug, pin } = await request.json();

    if (!slug || !pin) {
      return NextResponse.json(
        { error: "Slug and PIN are required" },
        { status: 400 }
      );
    }

    const user = await getUserBySlug(slug);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.pin_hash) {
      return NextResponse.json(
        { error: "This account does not have a PIN" },
        { status: 400 }
      );
    }

    const match = await bcrypt.compare(pin, user.pin_hash);
    if (!match) {
      return NextResponse.json(
        { error: "Incorrect PIN" },
        { status: 401 }
      );
    }

    const token = await createSession(user.slug);

    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", sessionCookieHeader(token));

    return response;
  } catch (error) {
    console.error("PIN verification failed:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

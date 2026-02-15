import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, checkSlugAvailable } from "@/lib/get-it-done/db";
import { createSession, sessionCookieHeader } from "@/lib/get-it-done/session";
import { RESERVED_SLUGS } from "@/lib/get-it-done/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, email, phone_number, pin, is_protected } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.toLowerCase().trim();

    // Validate slug format
    if (normalizedSlug.length < 3 || normalizedSlug.length > 30) {
      return NextResponse.json(
        { error: "Slug must be 3-30 characters" },
        { status: 400 }
      );
    }

    if (
      !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalizedSlug) &&
      normalizedSlug.length > 3
    ) {
      return NextResponse.json(
        { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Check reserved slugs
    if (
      RESERVED_SLUGS.includes(
        normalizedSlug as (typeof RESERVED_SLUGS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "This name is reserved" },
        { status: 400 }
      );
    }

    // Check availability
    const available = await checkSlugAvailable(normalizedSlug);
    if (!available) {
      return NextResponse.json(
        { error: "This name is already taken" },
        { status: 409 }
      );
    }

    // Validate name length
    if (name.trim().length < 1 || name.trim().length > 50) {
      return NextResponse.json(
        { error: "Name must be 1-50 characters" },
        { status: 400 }
      );
    }

    // Hash PIN if provided
    let pinHash: string | undefined;
    if (is_protected && pin) {
      if (!/^\d{6}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 6 digits" },
          { status: 400 }
        );
      }
      pinHash = await bcrypt.hash(pin, 10);
    }

    // Create user
    const user = await createUser({
      slug: normalizedSlug,
      name: name.trim(),
      email: email?.trim() || undefined,
      phone_number: phone_number?.trim() || undefined,
      pin_hash: pinHash,
      is_protected: !!is_protected && !!pin,
      sms_enabled: false,
      email_enabled: false,
      daily_digest_time: "08:00",
      default_reminder_offset: 15,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      week_start: 0,
    });

    // Create session
    const token = await createSession(user.slug);

    const response = NextResponse.json(
      {
        slug: user.slug,
        redirectUrl: `/get-it-done/${user.slug}/today`,
      },
      { status: 201 }
    );

    response.headers.set("Set-Cookie", sessionCookieHeader(token));

    return response;
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

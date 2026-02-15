import { NextRequest, NextResponse } from "next/server";
import { getUserBySlug, updateUser } from "@/lib/get-it-done/db";
import bcrypt from "bcryptjs";

// PUT: Set or change PIN
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const user = await getUserBySlug(slug);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { pin, current_pin } = await request.json();

    if (!pin || pin.length !== 6) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits" },
        { status: 400 }
      );
    }

    // If user already has a PIN, verify current PIN first
    if (user.pin_hash && current_pin) {
      const valid = await bcrypt.compare(current_pin, user.pin_hash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 403 }
        );
      }
    }

    const pin_hash = await bcrypt.hash(pin, 10);
    await updateUser(slug, { pin_hash, is_protected: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set PIN:", error);
    return NextResponse.json(
      { error: "Failed to set PIN" },
      { status: 500 }
    );
  }
}

// DELETE: Remove PIN
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const user = await getUserBySlug(slug);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await updateUser(slug, { pin_hash: null, is_protected: false } as Record<string, unknown>);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove PIN:", error);
    return NextResponse.json(
      { error: "Failed to remove PIN" },
      { status: 500 }
    );
  }
}

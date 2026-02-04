import { NextRequest, NextResponse } from "next/server";
import { getGame } from "@/lib/baby-bets/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await getGame(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Don't expose admin token or password
    const { adminToken, password, ...safeGame } = game;

    return NextResponse.json({
      ...safeGame,
      hasPassword: !!password,
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getGame, getGameByAdminToken, updateGame, deleteGame, getSubmissions, getVotes } from "@/lib/baby-bets/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; adminToken: string }> }
) {
  try {
    const { gameId, adminToken } = await params;

    // Verify admin token
    const gameByToken = await getGameByAdminToken(adminToken);
    if (!gameByToken || gameByToken.id !== gameId) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 404 }
      );
    }

    // Get the full game data (including sensitive fields for admin)
    const game = await getGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Get submissions and votes
    const [submissions, votes] = await Promise.all([
      getSubmissions(gameId),
      getVotes(gameId),
    ]);

    return NextResponse.json({
      game,
      submissions,
      votes,
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; adminToken: string }> }
) {
  try {
    const { gameId, adminToken } = await params;
    const body = await request.json();

    // Verify admin token
    const gameByToken = await getGameByAdminToken(adminToken);
    if (!gameByToken || gameByToken.id !== gameId) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 404 }
      );
    }

    const game = await getGame(gameId);
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const { action } = body;

    if (action === "reveal") {
      const { actualName } = body;

      if (!actualName?.first) {
        return NextResponse.json(
          { error: "First name is required" },
          { status: 400 }
        );
      }

      // Update game with actual name and mark as revealed
      const updatedGame = {
        ...game,
        actualName: {
          first: actualName.first,
          middle: actualName.middle || undefined,
          nickname: actualName.nickname || undefined,
        },
        isRevealed: true,
      };

      await updateGame(updatedGame);

      return NextResponse.json({ game: updatedGame });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing admin action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; adminToken: string }> }
) {
  try {
    const { gameId, adminToken } = await params;

    // Verify admin token
    const gameByToken = await getGameByAdminToken(adminToken);
    if (!gameByToken || gameByToken.id !== gameId) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 404 }
      );
    }

    // Delete the game and all associated data
    await deleteGame(gameId, adminToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}

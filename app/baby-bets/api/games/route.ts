import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createGame, getAllGames } from "@/lib/baby-bets/db";
import { Game } from "@/lib/baby-bets/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      gender,
      password,
      submissionStart,
      submissionEnd,
      votingStart,
      votingEnd,
      revealDate,
    } = body;

    // Validate required fields
    if (!name || !gender || !submissionStart || !submissionEnd || !votingStart || !votingEnd || !revealDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const game: Game = {
      id: nanoid(10),
      adminToken: nanoid(20),
      name,
      gender,
      password: password || undefined,
      submissionStart,
      submissionEnd,
      votingStart,
      votingEnd,
      revealDate,
      createdAt: new Date().toISOString(),
      isRevealed: false,
    };

    await createGame(game);

    return NextResponse.json({
      gameId: game.id,
      adminToken: game.adminToken,
      adminUrl: `/baby-bets/${game.id}/admin/${game.adminToken}`,
      playerUrl: `/baby-bets/${game.id}`,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const games = await getAllGames();
    // Don't expose admin tokens or passwords
    const safeGames = games.map(({ adminToken, password, ...game }) => ({
      ...game,
      hasPassword: !!password,
    }));
    return NextResponse.json(safeGames);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

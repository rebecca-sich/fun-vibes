import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  getGame,
  getSubmissions,
  addSubmission,
  checkDuplicateName,
} from "@/lib/baby-bets/db";
import { Submission } from "@/lib/baby-bets/types";

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

    const submissions = await getSubmissions(gameId);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await getGame(gameId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if we're in submission phase
    const now = new Date();
    const submissionStart = new Date(game.submissionStart);
    const votingStart = new Date(game.votingStart);

    if (now < submissionStart) {
      return NextResponse.json(
        { error: "Submissions haven't opened yet" },
        { status: 400 }
      );
    }

    if (now >= votingStart) {
      return NextResponse.json(
        { error: "Submissions are closed" },
        { status: 400 }
      );
    }

    const { playerName, firstName, middleName, nickname } = await request.json();

    if (!playerName || !firstName) {
      return NextResponse.json(
        { error: "Player name and first name are required" },
        { status: 400 }
      );
    }

    // Check for duplicate name guess
    const isDuplicate = await checkDuplicateName(gameId, firstName, middleName);
    if (isDuplicate) {
      return NextResponse.json(
        { error: "This name has already been guessed!", duplicate: true },
        { status: 400 }
      );
    }

    const submission: Submission = {
      id: nanoid(10),
      gameId,
      playerName,
      firstName,
      middleName: middleName || undefined,
      nickname: nickname || undefined,
      createdAt: new Date().toISOString(),
    };

    await addSubmission(submission);

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getGame, getVotes, addVote, hasVoted, getVoterTotalVotes } from "@/lib/baby-bets/db";
import { Vote } from "@/lib/baby-bets/types";

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

    const votes = await getVotes(gameId);

    // During voting phase, only return if user has voted (not counts)
    // After reveal, return full vote counts
    if (!game.isRevealed) {
      // Group by submission to get counts, but don't expose who voted
      const voteCounts: Record<string, number> = {};
      votes.forEach((vote) => {
        voteCounts[vote.submissionId] = (voteCounts[vote.submissionId] || 0) + 1;
      });
      const voters = Array.from(new Set(votes.map((v) => v.voterName)));
      return NextResponse.json({ voteCounts, voters });
    }

    return NextResponse.json({ votes });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
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

    // Check if we're in voting phase
    const now = new Date();
    const votingStart = new Date(game.votingStart);
    const revealDate = new Date(game.revealDate);

    if (now < votingStart) {
      return NextResponse.json(
        { error: "Voting hasn't started yet" },
        { status: 400 }
      );
    }

    if (now >= revealDate || game.isRevealed) {
      return NextResponse.json(
        { error: "Voting is closed" },
        { status: 400 }
      );
    }

    const { submissionId, voterName } = await request.json();

    if (!submissionId || !voterName) {
      return NextResponse.json(
        { error: "Submission ID and voter name are required" },
        { status: 400 }
      );
    }

    // Check if already voted for this submission
    const alreadyVoted = await hasVoted(gameId, submissionId, voterName);
    if (alreadyVoted) {
      return NextResponse.json(
        { error: "You've already voted for this submission" },
        { status: 400 }
      );
    }

    // Check total vote limit
    const maxVotes = game.maxVotes ?? 2;
    if (maxVotes > 0) {
      const totalVotes = await getVoterTotalVotes(gameId, voterName);
      if (totalVotes >= maxVotes) {
        return NextResponse.json(
          { error: `You've used all ${maxVotes} of your votes` },
          { status: 400 }
        );
      }
    }

    const vote: Vote = {
      id: nanoid(10),
      gameId,
      submissionId,
      voterName,
      createdAt: new Date().toISOString(),
    };

    await addVote(vote);

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    console.error("Error creating vote:", error);
    return NextResponse.json(
      { error: "Failed to create vote" },
      { status: 500 }
    );
  }
}

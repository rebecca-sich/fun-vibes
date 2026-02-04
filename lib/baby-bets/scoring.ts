import { Game, Submission, Vote } from "./types";

export interface PlayerScore {
  playerName: string;
  submissions: SubmissionScore[];
  totalPoints: number;
}

export interface SubmissionScore {
  submission: Submission;
  points: number;
  isExactMatch: boolean;
  isExactWithMiddle: boolean;
  isFanFavorite: boolean;
  voteCount: number;
}

export interface GameResults {
  winners: PlayerScore[];
  allScores: PlayerScore[];
  fanFavoriteSubmission: Submission | null;
  exactMatchSubmission: Submission | null;
}

const POINTS = {
  EXACT_FIRST_NAME: 100,
  EXACT_FIRST_AND_MIDDLE: 150,
  FAN_FAVORITE: 50,
};

export function calculateResults(
  game: Game,
  submissions: Submission[],
  votes: Vote[]
): GameResults {
  if (!game.actualName || !game.isRevealed) {
    return {
      winners: [],
      allScores: [],
      fanFavoriteSubmission: null,
      exactMatchSubmission: null,
    };
  }

  const actualFirst = game.actualName.first.toLowerCase();
  const actualMiddle = game.actualName.middle?.toLowerCase();

  // Count votes per submission
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(
      vote.submissionId,
      (voteCounts.get(vote.submissionId) || 0) + 1
    );
  }

  // Find fan favorite (most votes)
  let maxVotes = 0;
  let fanFavoriteId: string | null = null;
  Array.from(voteCounts.entries()).forEach(([submissionId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      fanFavoriteId = submissionId;
    }
  });

  // Score each submission
  const submissionScores: SubmissionScore[] = submissions.map((submission) => {
    const submittedFirst = submission.firstName.toLowerCase();
    const submittedMiddle = submission.middleName?.toLowerCase();

    const isExactFirst = submittedFirst === actualFirst;
    const isExactMiddle = actualMiddle
      ? submittedMiddle === actualMiddle
      : !submittedMiddle;
    const isExactWithMiddle = isExactFirst && isExactMiddle && !!actualMiddle;
    const isFanFavorite = submission.id === fanFavoriteId;
    const voteCount = voteCounts.get(submission.id) || 0;

    let points = 0;
    if (isExactWithMiddle) {
      points += POINTS.EXACT_FIRST_AND_MIDDLE;
    } else if (isExactFirst) {
      points += POINTS.EXACT_FIRST_NAME;
    }
    if (isFanFavorite) {
      points += POINTS.FAN_FAVORITE;
    }

    return {
      submission,
      points,
      isExactMatch: isExactFirst,
      isExactWithMiddle,
      isFanFavorite,
      voteCount,
    };
  });

  // Group by player and calculate total scores
  const playerScoresMap = new Map<string, PlayerScore>();
  for (const score of submissionScores) {
    const playerName = score.submission.playerName;
    const existing = playerScoresMap.get(playerName);
    if (existing) {
      existing.submissions.push(score);
      existing.totalPoints += score.points;
    } else {
      playerScoresMap.set(playerName, {
        playerName,
        submissions: [score],
        totalPoints: score.points,
      });
    }
  }

  const allScores = Array.from(playerScoresMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  // Winners are those with points > 0, sorted by points
  const winners = allScores.filter((s) => s.totalPoints > 0);

  const fanFavoriteSubmission = fanFavoriteId
    ? submissions.find((s) => s.id === fanFavoriteId) || null
    : null;

  const exactMatchSubmission =
    submissionScores.find((s) => s.isExactMatch)?.submission || null;

  return {
    winners,
    allScores,
    fanFavoriteSubmission,
    exactMatchSubmission,
  };
}

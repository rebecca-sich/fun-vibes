import { Game, GamePhase } from "./types";

export function getGamePhase(game: Game): GamePhase {
  if (game.isRevealed) {
    return "revealed";
  }

  const now = new Date();
  const submissionStart = new Date(game.submissionStart);
  const submissionEnd = new Date(game.submissionEnd);
  const votingStart = new Date(game.votingStart);
  const votingEnd = new Date(game.votingEnd);

  if (now < submissionStart) {
    return "pre-game";
  }

  if (now >= submissionStart && now < submissionEnd) {
    return "submission";
  }

  if (now >= votingStart && now < votingEnd) {
    return "voting";
  }

  return "awaiting-reveal";
}

export function getPhaseLabel(phase: GamePhase): string {
  switch (phase) {
    case "pre-game":
      return "Starting Soon";
    case "submission":
      return "Submissions Open";
    case "voting":
      return "Voting Open";
    case "awaiting-reveal":
      return "Awaiting Reveal";
    case "revealed":
      return "Results";
  }
}

export function getPhaseDescription(phase: GamePhase): string {
  switch (phase) {
    case "pre-game":
      return "The game hasn't started yet. Check back when submissions open!";
    case "submission":
      return "Submit your baby name guesses!";
    case "voting":
      return "Vote for your favorite name guesses!";
    case "awaiting-reveal":
      return "Voting is closed. Waiting for the Game Master to reveal the actual name!";
    case "revealed":
      return "The results are in!";
  }
}

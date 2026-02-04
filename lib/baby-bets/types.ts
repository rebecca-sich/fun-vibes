// Baby Bets Types

export type BabyGender = "boy" | "girl" | "surprise";

export interface Game {
  id: string;
  adminToken: string;
  name: string;
  password?: string;
  gender: BabyGender;

  // Dates (ISO strings)
  submissionStart: string;
  submissionEnd: string;
  votingStart: string;
  votingEnd: string;
  revealDate: string;
  createdAt: string;

  // Reveal data (set by GM)
  actualName?: {
    first: string;
    middle?: string;
    nickname?: string;
  };
  isRevealed: boolean;
}

export interface Submission {
  id: string;
  gameId: string;
  playerName: string;
  firstName: string;
  middleName?: string;
  nickname?: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  gameId: string;
  submissionId: string;
  voterName: string;
  createdAt: string;
}

export type GamePhase =
  | "pre-game"
  | "submission"
  | "voting"
  | "awaiting-reveal"
  | "revealed";

export interface GameWithPhase extends Game {
  phase: GamePhase;
}

// Baby Bets Types

export interface Pool {
  id: string;
  parentNames: string;
  dueDate: string;
  createdAt: string;
  betsVisible: boolean;
  revealedName?: string;
  bets: Bet[];
}

export interface Bet {
  id: string;
  guesserName: string;
  firstName: string;
  middleName?: string;
  createdAt: string;
}

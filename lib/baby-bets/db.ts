import { Redis } from "@upstash/redis";
import { Game, Submission, Vote } from "./types";

// Initialize Redis client
// In production, these env vars are set by Vercel when you add Upstash integration
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Environment helper for dev/prod separation
const getEnv = () => process.env.NODE_ENV || "development";

// Key helpers - prefixed with environment to separate dev/prod data
const keys = {
  game: (id: string) => `game:${getEnv()}:${id}`,
  gameByAdmin: (adminToken: string) => `game:${getEnv()}:admin:${adminToken}`,
  submissions: (gameId: string) => `game:${getEnv()}:${gameId}:submissions`,
  votes: (gameId: string) => `game:${getEnv()}:${gameId}:votes`,
  allGames: () => `games:${getEnv()}:all`,
};

// Game operations
export async function createGame(game: Game): Promise<void> {
  await Promise.all([
    redis.set(keys.game(game.id), game),
    redis.set(keys.gameByAdmin(game.adminToken), game.id),
    redis.sadd(keys.allGames(), game.id),
  ]);
}

export async function getGame(id: string): Promise<Game | null> {
  return redis.get<Game>(keys.game(id));
}

export async function getGameByAdminToken(adminToken: string): Promise<Game | null> {
  const gameId = await redis.get<string>(keys.gameByAdmin(adminToken));
  if (!gameId) return null;
  return getGame(gameId);
}

export async function updateGame(game: Game): Promise<void> {
  await redis.set(keys.game(game.id), game);
}

export async function deleteGame(id: string, adminToken: string): Promise<void> {
  await Promise.all([
    redis.del(keys.game(id)),
    redis.del(keys.gameByAdmin(adminToken)),
    redis.del(keys.submissions(id)),
    redis.del(keys.votes(id)),
    redis.srem(keys.allGames(), id),
  ]);
}

export async function getAllGames(): Promise<Game[]> {
  const gameIds = await redis.smembers(keys.allGames());
  if (!gameIds.length) return [];

  const games = await Promise.all(gameIds.map((id) => getGame(id)));
  return games.filter((g): g is Game => g !== null);
}

// Submission operations
export async function getSubmissions(gameId: string): Promise<Submission[]> {
  const submissions = await redis.get<Submission[]>(keys.submissions(gameId));
  return submissions || [];
}

export async function addSubmission(submission: Submission): Promise<void> {
  const submissions = await getSubmissions(submission.gameId);
  submissions.push(submission);
  await redis.set(keys.submissions(submission.gameId), submissions);
}

export async function checkDuplicateName(
  gameId: string,
  firstName: string,
  middleName?: string
): Promise<boolean> {
  const submissions = await getSubmissions(gameId);
  return submissions.some(
    (s) =>
      s.firstName.toLowerCase() === firstName.toLowerCase() &&
      (s.middleName?.toLowerCase() || "") === (middleName?.toLowerCase() || "")
  );
}

// Vote operations
export async function getVotes(gameId: string): Promise<Vote[]> {
  const votes = await redis.get<Vote[]>(keys.votes(gameId));
  return votes || [];
}

export async function addVote(vote: Vote): Promise<void> {
  const votes = await getVotes(vote.gameId);
  votes.push(vote);
  await redis.set(keys.votes(vote.gameId), votes);
}

export async function hasVoted(
  gameId: string,
  submissionId: string,
  voterName: string
): Promise<boolean> {
  const votes = await getVotes(gameId);
  return votes.some(
    (v) =>
      v.submissionId === submissionId &&
      v.voterName.toLowerCase() === voterName.toLowerCase()
  );
}

export async function getVoteCount(
  gameId: string,
  submissionId: string
): Promise<number> {
  const votes = await getVotes(gameId);
  return votes.filter((v) => v.submissionId === submissionId).length;
}

export async function getVoterTotalVotes(
  gameId: string,
  voterName: string
): Promise<number> {
  const votes = await getVotes(gameId);
  return votes.filter(
    (v) => v.voterName.toLowerCase() === voterName.toLowerCase()
  ).length;
}

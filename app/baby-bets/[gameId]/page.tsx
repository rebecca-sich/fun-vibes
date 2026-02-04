"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Game, GamePhase, Submission } from "@/lib/baby-bets/types";
import { getTheme, GameTheme } from "@/lib/baby-bets/theme";

type GameWithMeta = Omit<Game, "adminToken" | "password"> & {
  hasPassword: boolean;
};

function getPhase(game: GameWithMeta): GamePhase {
  if (game.isRevealed) return "revealed";

  const now = new Date();
  const submissionStart = new Date(game.submissionStart);
  const votingStart = new Date(game.votingStart);
  const revealDate = new Date(game.revealDate);

  if (now < submissionStart) return "pre-game";
  if (now >= submissionStart && now < votingStart) return "submission";
  if (now >= votingStart && now < revealDate) return "voting";
  return "awaiting-reveal";
}

function getPhaseLabel(phase: GamePhase): string {
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<GameWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Submission state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionForm, setSubmissionForm] = useState({
    playerName: "",
    firstName: "",
    middleName: "",
    nickname: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Voting state
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [voterName, setVoterName] = useState("");
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/baby-bets/api/games/${gameId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Game not found");
          } else {
            setError("Failed to load game");
          }
          return;
        }
        const data = await res.json();
        setGame(data);

        // Check if already authenticated (from session storage)
        const storedAuth = sessionStorage.getItem(`game-auth-${gameId}`);
        if (!data.hasPassword || storedAuth === "true") {
          setIsAuthenticated(true);
        }
      } catch {
        setError("Failed to load game");
      } finally {
        setLoading(false);
      }
    }

    fetchGame();
  }, [gameId]);

  // Fetch submissions and votes when authenticated
  useEffect(() => {
    if (!isAuthenticated || !game) return;

    async function fetchData() {
      try {
        const [subsRes, votesRes] = await Promise.all([
          fetch(`/baby-bets/api/games/${gameId}/submissions`),
          fetch(`/baby-bets/api/games/${gameId}/votes`),
        ]);

        if (subsRes.ok) {
          const subsData = await subsRes.json();
          setSubmissions(subsData);
        }

        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setVoteCounts(votesData.voteCounts || {});
        }

        // Load saved voter name from session storage
        const savedVoterName = sessionStorage.getItem(`voter-name-${gameId}`);
        if (savedVoterName) {
          setVoterName(savedVoterName);
        }

        // Load my votes from session storage
        const savedVotes = sessionStorage.getItem(`my-votes-${gameId}`);
        if (savedVotes) {
          setMyVotes(new Set(JSON.parse(savedVotes)));
        }
      } catch {
        // Silently fail
      }
    }

    fetchData();
  }, [gameId, isAuthenticated, game]);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/baby-bets/api/games/${gameId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit");
        return;
      }

      setSubmissions([...submissions, data]);
      setSubmitSuccess(true);
      setSubmissionForm({ playerName: "", firstName: "", middleName: "", nickname: "" });
    } catch {
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!voterName.trim()) {
      alert("Please enter your name first!");
      return;
    }

    if (myVotes.has(submissionId)) {
      return; // Already voted
    }

    setVoting(true);

    try {
      const res = await fetch(`/baby-bets/api/games/${gameId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, voterName: voterName.trim() }),
      });

      if (res.ok) {
        // Update local state
        const newVotes = new Set(myVotes);
        newVotes.add(submissionId);
        setMyVotes(newVotes);
        sessionStorage.setItem(`my-votes-${gameId}`, JSON.stringify([...newVotes]));
        sessionStorage.setItem(`voter-name-${gameId}`, voterName.trim());

        // Update vote count
        setVoteCounts((prev) => ({
          ...prev,
          [submissionId]: (prev[submissionId] || 0) + 1,
        }));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to vote");
      }
    } catch {
      alert("Failed to vote. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/baby-bets/api/games/${gameId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (res.ok) {
        sessionStorage.setItem(`game-auth-${gameId}`, "true");
        setIsAuthenticated(true);
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch {
      setPasswordError(true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-rose-400">Loading...</div>
        </div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-rose-900">
            {error || "Game not found"}
          </h1>
          <Link
            href="/baby-bets"
            className="mt-4 inline-block text-rose-500 hover:text-rose-600"
          >
            Back to Baby Bets
          </Link>
        </div>
      </main>
    );
  }

  const theme = getTheme(game.gender);
  const phase = getPhase(game);
  const phaseLabel = getPhaseLabel(phase);

  // Password gate
  if (game.hasPassword && !isAuthenticated) {
    return (
      <main className={`min-h-screen bg-gradient-to-b ${theme.bgGradient}`}>
        <div className="mx-auto max-w-md px-6 py-16 sm:py-24">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {game.name}
            </h1>
            <p className={`mt-2 ${theme.textSecondary}`}>
              This game is password protected.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-6">
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full rounded-xl border ${theme.inputBorder} bg-white px-4 py-3 ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-2 ${theme.inputFocus}`}
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-500">
                  Incorrect password. Try again.
                </p>
              )}
              <button
                type="submit"
                className={`mt-4 w-full rounded-xl ${theme.accent} px-4 py-3 font-medium text-white transition-colors ${theme.accentHover}`}
              >
                Join Game
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex min-h-screen flex-col bg-gradient-to-b ${theme.bgGradient}`}>
      <div className="mx-auto max-w-2xl flex-1 px-6 py-16 sm:py-24">
        {/* Header */}
        <header className="text-center">
          <h1 className={`font-display text-4xl font-bold tracking-tight ${theme.textPrimary} sm:text-5xl`}>
            {game.name}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${theme.badgeBg} ${theme.badgeText}`}
            >
              {phaseLabel}
            </span>
          </div>
        </header>

        {/* Phase-specific content */}
        <div className="mt-12">
          {phase === "pre-game" && (
            <div className="rounded-3xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-black/5">
              <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Game Starting Soon
              </h2>
              <p className={`mt-2 ${theme.textSecondary}`}>
                Submissions open on {formatDate(game.submissionStart)}
              </p>
              <div className={`mt-6 rounded-xl ${theme.accentLight} p-4`}>
                <p className={`text-sm ${theme.textMuted}`}>
                  Come back then to submit your baby name guesses!
                </p>
              </div>
            </div>
          )}

          {phase === "submission" && (
            <div className="space-y-6">
              {/* Submission Form */}
              <div className="rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-black/5">
                <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
                  Submit Your Guess
                </h2>
                <p className={`mt-2 ${theme.textSecondary}`}>
                  Voting opens {formatDate(game.votingStart)}
                </p>

                {submitSuccess ? (
                  <div className={`mt-6 rounded-xl ${theme.accentLight} p-6 text-center`}>
                    <p className={`font-medium ${theme.textPrimary}`}>
                      Your guess has been submitted!
                    </p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className={`mt-4 ${theme.textSecondary} hover:opacity-80 text-sm`}
                    >
                      Submit another guess
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmission} className="mt-6 space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Who are you?"
                        value={submissionForm.playerName}
                        onChange={(e) =>
                          setSubmissionForm({ ...submissionForm, playerName: e.target.value })
                        }
                        className={`mt-1 w-full rounded-xl border ${theme.inputBorder} bg-white px-4 py-3 ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        First Name Guess
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="What's the baby's first name?"
                        value={submissionForm.firstName}
                        onChange={(e) =>
                          setSubmissionForm({ ...submissionForm, firstName: e.target.value })
                        }
                        className={`mt-1 w-full rounded-xl border ${theme.inputBorder} bg-white px-4 py-3 ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        Middle Name (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Middle name guess"
                        value={submissionForm.middleName}
                        onChange={(e) =>
                          setSubmissionForm({ ...submissionForm, middleName: e.target.value })
                        }
                        className={`mt-1 w-full rounded-xl border ${theme.inputBorder} bg-white px-4 py-3 ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                        Nickname (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Any nickname?"
                        value={submissionForm.nickname}
                        onChange={(e) =>
                          setSubmissionForm({ ...submissionForm, nickname: e.target.value })
                        }
                        className={`mt-1 w-full rounded-xl border ${theme.inputBorder} bg-white px-4 py-3 ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full rounded-xl ${theme.accent} px-4 py-3 font-medium text-white transition-colors ${theme.accentHover} disabled:opacity-50`}
                    >
                      {submitting ? "Submitting..." : "Submit Guess"}
                    </button>
                  </form>
                )}
              </div>

              {/* Existing Submissions */}
              {submissions.length > 0 && (
                <div className="rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-black/5">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                    Guesses So Far ({submissions.length})
                  </h3>
                  <div className="mt-4 space-y-3">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className={`rounded-xl ${theme.accentLight} p-4`}
                      >
                        <p className={`font-medium ${theme.textPrimary}`}>
                          {sub.firstName}
                          {sub.middleName && ` ${sub.middleName}`}
                          {sub.nickname && ` "${sub.nickname}"`}
                        </p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          Guessed by {sub.playerName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === "voting" && (
            <div className="space-y-6">
              {/* Voter Name */}
              <div className="rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-black/5">
                <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
                  Vote for Your Favorites
                </h2>
                <p className={`mt-2 ${theme.textSecondary}`}>
                  Voting closes {formatDate(game.revealDate)}
                </p>

                <div className="mt-6">
                  <label className={`block text-sm font-medium ${theme.textPrimary}`}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name to vote"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    className={`mt-1 w-full rounded-xl border ${theme.inputBorder} bg-white px-4 py-3 ${theme.textPrimary} placeholder:opacity-50 focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                  />
                  <p className={`mt-1 text-xs ${theme.textMuted}`}>
                    You can vote for multiple names. One vote per name.
                  </p>
                </div>
              </div>

              {/* Submissions to vote on */}
              {submissions.length > 0 ? (
                <div className="rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-black/5">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                    Name Guesses ({submissions.length})
                  </h3>
                  <div className="mt-4 space-y-3">
                    {submissions.map((sub) => {
                      const hasVoted = myVotes.has(sub.id);
                      const voteCount = voteCounts[sub.id] || 0;

                      return (
                        <div
                          key={sub.id}
                          className={`flex items-center justify-between rounded-xl ${theme.accentLight} p-4`}
                        >
                          <div>
                            <p className={`font-medium ${theme.textPrimary}`}>
                              {sub.firstName}
                              {sub.middleName && ` ${sub.middleName}`}
                              {sub.nickname && ` "${sub.nickname}"`}
                            </p>
                            <p className={`text-sm ${theme.textMuted}`}>
                              Guessed by {sub.playerName}
                            </p>
                          </div>
                          <button
                            onClick={() => handleVote(sub.id)}
                            disabled={hasVoted || voting || !voterName.trim()}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                              hasVoted
                                ? `${theme.accent} text-white`
                                : `bg-white ${theme.textPrimary} hover:opacity-80 disabled:opacity-50`
                            }`}
                          >
                            <svg
                              className="h-4 w-4"
                              fill={hasVoted ? "currentColor" : "none"}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            {hasVoted ? "Voted" : "Vote"}
                            {voteCount > 0 && ` (${voteCount})`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`rounded-3xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-black/5`}>
                  <p className={theme.textMuted}>No submissions to vote on yet.</p>
                </div>
              )}
            </div>
          )}

          {phase === "awaiting-reveal" && (
            <div className="rounded-3xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-black/5">
              <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
                Waiting for the Big Reveal
              </h2>
              <p className={`mt-2 ${theme.textSecondary}`}>
                The Game Master will reveal the actual baby name soon!
              </p>
              <div className={`mt-6 rounded-xl ${theme.accentLight} p-4`}>
                <p className={`text-sm ${theme.textMuted}`}>
                  Check back later for the results...
                </p>
              </div>
            </div>
          )}

          {phase === "revealed" && (
            <div className="rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-black/5">
              <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
                The Results Are In!
              </h2>
              {game.actualName && (
                <div className={`mt-6 rounded-xl ${theme.accentLight} p-6 text-center`}>
                  <p className={`text-sm uppercase tracking-wider ${theme.textMuted}`}>
                    The baby&apos;s name is
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${theme.textPrimary}`}>
                    {game.actualName.first}
                    {game.actualName.middle && ` ${game.actualName.middle}`}
                  </p>
                  {game.actualName.nickname && (
                    <p className={`mt-1 ${theme.textSecondary}`}>
                      &quot;{game.actualName.nickname}&quot;
                    </p>
                  )}
                </div>
              )}
              {/* Leaderboard will go here */}
              <div className={`mt-6 text-center`}>
                <p className={`text-sm ${theme.textMuted}`}>
                  Leaderboard coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="pb-8 text-center">
        <p className={`text-sm ${theme.textMuted}`}>
          Part of the{" "}
          <Link
            href="/"
            className={`font-medium ${theme.textSecondary} hover:opacity-80 transition-opacity`}
          >
            Good Vibes Projects
          </Link>
        </p>
      </footer>
    </main>
  );
}

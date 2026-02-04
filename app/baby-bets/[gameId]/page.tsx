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
        sessionStorage.setItem(`my-votes-${gameId}`, JSON.stringify(Array.from(newVotes)));
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
        <div className="mx-auto max-w-md px-6 py-12 sm:py-16">
          <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
            <div className={`border ${theme.borderInner} p-8`}>
              <h1 className={`font-display text-2xl font-bold tracking-tight ${theme.textPrimary}`}>
                {game.name}
              </h1>
              <p className={`mt-2 font-serif italic ${theme.textSecondary}`}>
                This game is password protected.
              </p>

              <div className={`my-6 border-t ${theme.borderInner}`} />

              <form onSubmit={handlePasswordSubmit}>
                <label className={`block font-serif text-base ${theme.textPrimary}`}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                />
                {passwordError && (
                  <p className="mt-2 border-l-4 border-red-400 bg-red-50 px-3 py-2 font-serif text-base text-red-700">
                    Incorrect password. Try again.
                  </p>
                )}
                <button
                  type="submit"
                  className={`mt-6 w-full border-2 ${theme.borderAccent} ${theme.accent} px-4 py-3 font-serif font-medium text-white transition-colors ${theme.accentHover}`}
                >
                  Join Game
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex min-h-screen flex-col bg-gradient-to-b ${theme.bgGradient}`}>
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 sm:py-12 lg:max-w-5xl xl:max-w-6xl">
        {/* Header */}
        <header className="text-center">
          <h1 className={`font-display text-4xl font-bold tracking-tight ${theme.textPrimary} sm:text-5xl`}>
            {game.name}
          </h1>
          {game.createdBy && (
            <p className={`mt-2 font-serif italic ${theme.textSecondary}`}>
              Managed by {game.createdBy}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className={`border ${theme.borderAccent} px-3 py-1 font-serif text-sm ${theme.badgeText}`}
            >
              {phaseLabel}
            </span>
          </div>
        </header>

        {/* Phase-specific content */}
        <div className="mt-12">
          {phase === "pre-game" && (
            <div className={`mx-auto max-w-xl border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
              <div className={`border ${theme.borderInner} p-8 text-center`}>
                <h2 className={`font-serif text-2xl ${theme.textPrimary}`}>
                  Game Starting Soon
                </h2>
                <p className={`mt-2 font-serif text-base italic ${theme.textSecondary}`}>
                  Submissions open on {formatDate(game.submissionStart)}
                </p>
                <div className={`mt-6 border-t ${theme.borderInner} pt-6`}>
                  <p className={`font-serif italic ${theme.textMuted}`}>
                    Come back then to submit your baby name guesses!
                  </p>
                </div>
              </div>
            </div>
          )}

          {phase === "submission" && (
            <div className="flex flex-col gap-8 md:flex-row">
              {/* Submission Form - Double Border Frame */}
              <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5 md:w-2/3`}>
                <div className={`flex h-full flex-col border ${theme.borderInner} p-6 sm:p-8`}>
                  <h2 className={`font-serif text-2xl ${theme.textPrimary}`}>
                    Submit Your Guess
                  </h2>
                  <p className={`mt-2 font-serif text-base italic ${theme.textSecondary}`}>
                    Voting opens {formatDate(game.votingStart)}
                  </p>

                  <div className={`my-6 border-t ${theme.borderInner}`} />

                  {submitSuccess ? (
                    <div className="space-y-4">
                      <div className={`flex items-center gap-3 border-l-4 ${theme.borderAccent} bg-white px-4 py-3 ${theme.textPrimary}`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-serif">Your guess has been submitted!</span>
                      </div>
                      <button
                        onClick={() => setSubmitSuccess(false)}
                        className={`w-full border-2 border-dashed ${theme.borderOuter} px-4 py-3 font-serif ${theme.textSecondary} transition-colors hover:bg-white`}
                      >
                        + Submit another guess
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmission} className="space-y-5">
                      <div>
                        <label className={`block font-serif text-base ${theme.textPrimary}`}>
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
                          className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                        />
                      </div>

                      <div>
                        <label className={`block font-serif text-base ${theme.textPrimary}`}>
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
                          className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                        />
                      </div>

                      <div>
                        <label className={`block font-serif text-base ${theme.textPrimary}`}>
                          Middle Name <span className="italic">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Have a middle name guess?"
                          value={submissionForm.middleName}
                          onChange={(e) =>
                            setSubmissionForm({ ...submissionForm, middleName: e.target.value })
                          }
                          className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                        />
                      </div>

                      <div>
                        <label className={`block font-serif text-base ${theme.textPrimary}`}>
                          Nickname <span className="italic">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Any nickname?"
                          value={submissionForm.nickname}
                          onChange={(e) =>
                            setSubmissionForm({ ...submissionForm, nickname: e.target.value })
                          }
                          className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                        />
                      </div>

                      {submitError && (
                        <div className={`border-l-4 border-red-400 bg-red-50 px-4 py-3 text-base text-red-700`}>
                          {submitError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full border-2 ${theme.borderAccent} ${theme.accent} px-4 py-3 font-serif font-medium text-white transition-colors ${theme.accentHover} disabled:opacity-50`}
                      >
                        {submitting ? "Submitting..." : "Submit Guess"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Existing Submissions - Double Border Frame */}
              <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5 md:w-1/3`}>
                <div className={`flex h-full flex-col border ${theme.borderInner} p-6 sm:p-8`}>
                  <h3 className={`font-serif text-xl ${theme.textPrimary}`}>
                    Guesses So Far
                    {submissions.length > 0 && (
                      <span className={`ml-2 text-base ${theme.textMuted}`}>
                        ({submissions.length})
                      </span>
                    )}
                  </h3>

                  <div className={`my-4 border-t ${theme.borderInner}`} />

                  {submissions.length > 0 ? (
                    <div className="space-y-4">
                      {submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className={`border-l-2 ${theme.borderAccent} py-1 pl-4`}
                        >
                          <p className={`font-serif text-lg ${theme.textPrimary}`}>
                            {sub.firstName}
                            {sub.middleName && ` ${sub.middleName}`}
                          </p>
                          {sub.nickname && (
                            <p className={`font-serif italic ${theme.textSecondary}`}>
                              called &ldquo;{sub.nickname}&rdquo;
                            </p>
                          )}
                          <p className={`mt-1 font-serif text-base ${theme.textMuted}`}>
                            Guessed by {sub.playerName}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`font-serif italic ${theme.textMuted}`}>
                      No guesses yet. Be the first!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === "voting" && (
            <div className="flex flex-col gap-8 md:flex-row">
              {/* Voter Name Card */}
              <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5 md:w-1/3`}>
                <div className={`flex h-full flex-col border ${theme.borderInner} p-6 sm:p-8`}>
                  <h2 className={`font-serif text-2xl ${theme.textPrimary}`}>
                    Vote for Your Favorites
                  </h2>
                  <p className={`mt-2 font-serif text-base italic ${theme.textSecondary}`}>
                    Voting closes {formatDate(game.revealDate)}
                  </p>

                  <div className={`my-6 border-t ${theme.borderInner}`} />

                  <div>
                    <label className={`block font-serif text-base ${theme.textPrimary}`}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name to vote"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                    />
                    <p className={`mt-2 font-serif text-base italic ${theme.textMuted}`}>
                      You can vote for multiple names. One vote per name.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submissions to vote on */}
              <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5 md:w-2/3`}>
                <div className={`flex h-full flex-col border ${theme.borderInner} p-6 sm:p-8`}>
                  <h3 className={`font-serif text-xl ${theme.textPrimary}`}>
                    Name Guesses
                    {submissions.length > 0 && (
                      <span className={`ml-2 text-base ${theme.textMuted}`}>
                        ({submissions.length})
                      </span>
                    )}
                  </h3>

                  <div className={`my-4 border-t ${theme.borderInner}`} />

                  {submissions.length > 0 ? (
                    <div className="space-y-4">
                      {submissions.map((sub) => {
                        const hasVoted = myVotes.has(sub.id);
                        const voteCount = voteCounts[sub.id] || 0;

                        return (
                          <div
                            key={sub.id}
                            className={`flex items-center justify-between border-l-2 ${theme.borderAccent} py-2 pl-4`}
                          >
                            <div>
                              <p className={`font-serif text-lg ${theme.textPrimary}`}>
                                {sub.firstName}
                                {sub.middleName && ` ${sub.middleName}`}
                              </p>
                              {sub.nickname && (
                                <p className={`font-serif italic ${theme.textSecondary}`}>
                                  called &ldquo;{sub.nickname}&rdquo;
                                </p>
                              )}
                              <p className={`mt-1 font-serif text-base ${theme.textMuted}`}>
                                guessed by {sub.playerName}
                              </p>
                            </div>
                            <button
                              onClick={() => handleVote(sub.id)}
                              disabled={hasVoted || voting || !voterName.trim()}
                              className={`flex items-center gap-2 border-2 px-4 py-2 font-serif text-sm transition-colors ${
                                hasVoted
                                  ? `${theme.borderAccent} ${theme.accent} text-white`
                                  : `${theme.borderOuter} bg-white ${theme.textPrimary} hover:bg-gray-50 disabled:opacity-50`
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
                  ) : (
                    <p className={`font-serif italic ${theme.textMuted}`}>
                      No submissions to vote on yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === "awaiting-reveal" && (
            <div className={`mx-auto max-w-xl border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
              <div className={`border ${theme.borderInner} p-8 text-center`}>
                <h2 className={`font-serif text-2xl ${theme.textPrimary}`}>
                  Waiting for the Big Reveal
                </h2>
                <p className={`mt-2 font-serif text-base italic ${theme.textSecondary}`}>
                  The Game Master will reveal the actual baby name soon!
                </p>
                <div className={`mt-6 border-t ${theme.borderInner} pt-6`}>
                  <p className={`font-serif italic ${theme.textMuted}`}>
                    Check back later for the results...
                  </p>
                </div>
              </div>
            </div>
          )}

          {phase === "revealed" && (
            <div className={`mx-auto max-w-xl border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
              <div className={`border ${theme.borderInner} p-8 text-center`}>
                <h2 className={`font-serif text-2xl ${theme.textPrimary}`}>
                  The Results Are In!
                </h2>
                {game.actualName && (
                  <div className={`mt-6 border-2 ${theme.borderAccent} p-6`}>
                    <p className={`font-serif text-base uppercase tracking-wider ${theme.textMuted}`}>
                      The baby&apos;s name is
                    </p>
                    <p className={`mt-2 font-serif text-3xl ${theme.textPrimary}`}>
                      {game.actualName.first}
                      {game.actualName.middle && ` ${game.actualName.middle}`}
                    </p>
                    {game.actualName.nickname && (
                      <p className={`mt-1 font-serif italic ${theme.textSecondary}`}>
                        called &ldquo;{game.actualName.nickname}&rdquo;
                      </p>
                    )}
                  </div>
                )}
                <div className={`mt-6 border-t ${theme.borderInner} pt-6`}>
                  <p className={`font-serif italic ${theme.textMuted}`}>
                    Leaderboard coming soon...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="pb-8 text-center">
        <p className={`text-base ${theme.textMuted}`}>
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

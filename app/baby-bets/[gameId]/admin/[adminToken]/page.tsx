"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Game, Submission, Vote } from "@/lib/baby-bets/types";
import { getTheme } from "@/lib/baby-bets/theme";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getPhase(game: Game): string {
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

export default function AdminPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const adminToken = params.adminToken as string;

  const [game, setGame] = useState<Game | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reveal form state
  const [revealForm, setRevealForm] = useState({
    firstName: "",
    middleName: "",
    nickname: "",
  });
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/baby-bets/api/games/${gameId}/admin/${adminToken}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Game not found or invalid admin token");
          } else {
            setError("Failed to load game");
          }
          return;
        }
        const data = await res.json();
        setGame(data.game);
        setSubmissions(data.submissions || []);
        setVotes(data.votes || []);
      } catch {
        setError("Failed to load game");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [gameId, adminToken]);

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revealForm.firstName.trim()) {
      setRevealError("Please enter the baby's first name");
      return;
    }

    setRevealing(true);
    setRevealError(null);

    try {
      const res = await fetch(`/baby-bets/api/games/${gameId}/admin/${adminToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reveal",
          actualName: {
            first: revealForm.firstName.trim(),
            middle: revealForm.middleName.trim() || undefined,
            nickname: revealForm.nickname.trim() || undefined,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRevealError(data.error || "Failed to reveal");
        return;
      }

      const data = await res.json();
      setGame(data.game);
    } catch {
      setRevealError("Failed to reveal. Please try again.");
    } finally {
      setRevealing(false);
    }
  };

  const copyPlayerLink = () => {
    const url = `${window.location.origin}/baby-bets/${gameId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Calculate vote counts per submission
  const voteCounts: Record<string, number> = {};
  votes.forEach((v) => {
    voteCounts[v.submissionId] = (voteCounts[v.submissionId] || 0) + 1;
  });

  // Sort submissions by vote count
  const sortedSubmissions = [...submissions].sort(
    (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
  );

  const playerUrl = typeof window !== "undefined"
    ? `${window.location.origin}/baby-bets/${gameId}`
    : `/baby-bets/${gameId}`;

  return (
    <main className={`min-h-screen bg-gradient-to-b ${theme.bgGradient}`}>
      <div className="mx-auto max-w-4xl px-6 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href={`/baby-bets/${gameId}`}
          className={`inline-flex items-center font-serif text-sm ${theme.textMuted} transition-colors hover:${theme.textSecondary}`}
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          View as Player
        </Link>

        {/* Header */}
        <header className="mt-6">
          <div className="flex items-center gap-3">
            <h1 className={`font-display text-3xl font-bold tracking-tight ${theme.textPrimary} sm:text-4xl`}>
              {game.name}
            </h1>
            <span className={`border ${theme.borderAccent} px-2 py-0.5 font-serif text-xs ${theme.badgeText}`}>
              Admin
            </span>
          </div>
          <p className={`mt-2 font-serif italic ${theme.textSecondary}`}>
            Game Master Dashboard
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Share Link Card */}
          <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
            <div className={`border ${theme.borderInner} p-6`}>
              <h2 className={`font-serif text-xl ${theme.textPrimary}`}>
                Share with Players
              </h2>
              <div className={`my-4 border-t ${theme.borderInner}`} />

              <div className={`border-2 ${theme.borderInner} bg-gray-50 p-3`}>
                <p className="break-all font-mono text-sm text-gray-700">
                  {playerUrl}
                </p>
              </div>

              <button
                onClick={copyPlayerLink}
                className={`mt-4 w-full border-2 px-4 py-2.5 font-serif font-medium transition-colors ${
                  copied
                    ? "border-green-500 bg-green-500 text-white"
                    : `${theme.borderAccent} bg-white ${theme.textPrimary} hover:bg-gray-50`
                }`}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>

              {game.password && (
                <p className={`mt-3 font-serif text-sm italic ${theme.textMuted}`}>
                  Password: <span className="font-medium">{game.password}</span>
                </p>
              )}
            </div>
          </div>

          {/* Game Status Card */}
          <div className={`border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
            <div className={`border ${theme.borderInner} p-6`}>
              <h2 className={`font-serif text-xl ${theme.textPrimary}`}>
                Game Status
              </h2>
              <div className={`my-4 border-t ${theme.borderInner}`} />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`font-serif ${theme.textMuted}`}>Current Phase</span>
                  <span className={`border ${theme.borderAccent} px-2 py-0.5 font-serif text-sm ${theme.badgeText}`}>
                    {phase === "pre-game" && "Starting Soon"}
                    {phase === "submission" && "Submissions Open"}
                    {phase === "voting" && "Voting Open"}
                    {phase === "awaiting-reveal" && "Awaiting Reveal"}
                    {phase === "revealed" && "Revealed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-serif ${theme.textMuted}`}>Submissions</span>
                  <span className={`font-serif font-medium ${theme.textPrimary}`}>{submissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-serif ${theme.textMuted}`}>Total Votes</span>
                  <span className={`font-serif font-medium ${theme.textPrimary}`}>{votes.length}</span>
                </div>
              </div>

              <div className={`mt-4 border-t ${theme.borderInner} pt-4`}>
                <div className="space-y-2 text-sm">
                  <p className={`font-serif ${theme.textMuted}`}>
                    <span className="font-medium">Submissions:</span> {formatDate(game.submissionStart)}
                  </p>
                  <p className={`font-serif ${theme.textMuted}`}>
                    <span className="font-medium">Voting:</span> {formatDate(game.votingStart)}
                  </p>
                  <p className={`font-serif ${theme.textMuted}`}>
                    <span className="font-medium">Reveal:</span> {formatDate(game.revealDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reveal Section - Only show if not revealed */}
        {!game.isRevealed && (
          <div className={`mt-6 border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
            <div className={`border ${theme.borderInner} p-6`}>
              <h2 className={`font-serif text-xl ${theme.textPrimary}`}>
                Reveal the Baby&apos;s Name
              </h2>
              <p className={`mt-1 font-serif italic ${theme.textSecondary}`}>
                Enter the actual name to reveal results to all players
              </p>
              <div className={`my-4 border-t ${theme.borderInner}`} />

              <form onSubmit={handleReveal} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={`block font-serif text-base ${theme.textPrimary}`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Baby's first name"
                      value={revealForm.firstName}
                      onChange={(e) => setRevealForm({ ...revealForm, firstName: e.target.value })}
                      className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                    />
                  </div>
                  <div>
                    <label className={`block font-serif text-base ${theme.textPrimary}`}>
                      Middle Name <span className="italic">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Middle name"
                      value={revealForm.middleName}
                      onChange={(e) => setRevealForm({ ...revealForm, middleName: e.target.value })}
                      className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                    />
                  </div>
                  <div>
                    <label className={`block font-serif text-base ${theme.textPrimary}`}>
                      Nickname <span className="italic">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nickname"
                      value={revealForm.nickname}
                      onChange={(e) => setRevealForm({ ...revealForm, nickname: e.target.value })}
                      className={`mt-1.5 w-full border-2 ${theme.inputBorder} bg-white px-4 py-2.5 font-serif ${theme.textPrimary} placeholder:${theme.textMuted} focus:outline-none ${theme.inputFocus}`}
                    />
                  </div>
                </div>

                {revealError && (
                  <div className="border-l-4 border-red-400 bg-red-50 px-4 py-3 font-serif text-sm text-red-700">
                    {revealError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={revealing}
                  className={`w-full border-2 ${theme.borderAccent} ${theme.accent} px-4 py-3 font-serif font-medium text-white transition-colors ${theme.accentHover} disabled:opacity-50 sm:w-auto`}
                >
                  {revealing ? "Revealing..." : "Reveal Name & Show Results"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Revealed Name - Show if revealed */}
        {game.isRevealed && game.actualName && (
          <div className={`mt-6 border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
            <div className={`border ${theme.borderInner} p-6 text-center`}>
              <p className={`font-serif text-sm uppercase tracking-wider ${theme.textMuted}`}>
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
          </div>
        )}

        {/* Submissions List */}
        <div className={`mt-6 border-2 ${theme.borderOuter} bg-white/90 p-1.5`}>
          <div className={`border ${theme.borderInner} p-6`}>
            <h2 className={`font-serif text-xl ${theme.textPrimary}`}>
              All Guesses
              {submissions.length > 0 && (
                <span className={`ml-2 text-base ${theme.textMuted}`}>
                  ({submissions.length})
                </span>
              )}
            </h2>
            <div className={`my-4 border-t ${theme.borderInner}`} />

            {sortedSubmissions.length > 0 ? (
              <div className="space-y-4">
                {sortedSubmissions.map((sub, index) => {
                  const voteCount = voteCounts[sub.id] || 0;
                  const isWinner = game.isRevealed && game.actualName &&
                    sub.firstName.toLowerCase() === game.actualName.first.toLowerCase();

                  return (
                    <div
                      key={sub.id}
                      className={`flex items-center justify-between border-l-2 py-2 pl-4 ${
                        isWinner ? "border-green-500 bg-green-50" : theme.borderAccent
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-serif text-sm ${theme.textMuted}`}>
                            #{index + 1}
                          </span>
                          <p className={`font-serif text-lg ${theme.textPrimary}`}>
                            {sub.firstName}
                            {sub.middleName && ` ${sub.middleName}`}
                          </p>
                          {isWinner && (
                            <span className="border border-green-500 bg-green-100 px-2 py-0.5 font-serif text-xs text-green-700">
                              Winner!
                            </span>
                          )}
                        </div>
                        {sub.nickname && (
                          <p className={`font-serif italic ${theme.textSecondary}`}>
                            called &ldquo;{sub.nickname}&rdquo;
                          </p>
                        )}
                        <p className={`mt-1 font-serif text-sm ${theme.textMuted}`}>
                          Guessed by {sub.playerName}
                        </p>
                      </div>
                      <div className={`border ${theme.borderOuter} px-3 py-1.5 text-center`}>
                        <p className={`font-serif text-lg font-medium ${theme.textPrimary}`}>
                          {voteCount}
                        </p>
                        <p className={`font-serif text-xs ${theme.textMuted}`}>
                          {voteCount === 1 ? "vote" : "votes"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`font-serif italic ${theme.textMuted}`}>
                No guesses yet.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <p className={`font-serif text-sm ${theme.textMuted}`}>
            Part of the{" "}
            <Link
              href="/"
              className={`font-medium ${theme.textSecondary} transition-opacity hover:opacity-80`}
            >
              Good Vibes Projects
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

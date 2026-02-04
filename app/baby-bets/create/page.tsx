"use client";

import { useState } from "react";
import Link from "next/link";
import { BabyGender } from "@/lib/baby-bets/types";

export default function CreateGamePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminUrl, setAdminUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Default dates: start now, voting in 2 weeks, reveal in 3 weeks
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  const formatDateForInput = (date: Date) => date.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    name: "",
    createdBy: "",
    gender: "surprise" as BabyGender,
    password: "",
    hideGuesses: false,
    submissionStart: formatDateForInput(now),
    votingStart: formatDateForInput(twoWeeks),
    revealDate: formatDateForInput(threeWeeks),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/baby-bets/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          submissionStart: new Date(formData.submissionStart).toISOString(),
          votingStart: new Date(formData.votingStart).toISOString(),
          revealDate: new Date(formData.revealDate).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();
      setAdminUrl(data.adminUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adminUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
        <div className="mx-auto max-w-xl px-6 py-8 sm:py-12">
          <div className="border-2 border-rose-300 bg-white/90 p-1.5">
            <div className="border border-rose-200 p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-green-400 bg-green-50">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-rose-900">Game Created!</h1>
                <p className="mt-2 font-serif italic text-rose-700/70">
                  Save this admin link — you&apos;ll need it to manage the game and reveal the winner.
                </p>
              </div>

              <div className="mt-6 border-2 border-rose-300 bg-rose-50 p-4">
                <p className="font-serif text-sm uppercase tracking-wider text-rose-500">
                  Your Admin Link (keep this secret!)
                </p>
                <p className="mt-1 break-all font-mono text-base text-rose-900">
                  {typeof window !== "undefined" ? window.location.origin : ""}{adminUrl}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${adminUrl}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`w-full border-2 px-4 py-3 font-serif font-medium text-white transition-colors ${
                    copied
                      ? "border-green-500 bg-green-500"
                      : "border-rose-400 bg-rose-500 hover:bg-rose-600"
                  }`}
                >
                  {copied ? "Copied!" : "Copy Admin Link"}
                </button>
                <Link
                  href={adminUrl}
                  className="w-full border-2 border-rose-300 bg-white px-4 py-3 text-center font-serif font-medium text-rose-700 transition-colors hover:bg-rose-50"
                >
                  Go to Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
      <div className="mx-auto max-w-xl px-6 py-8 sm:py-12">
        <Link
          href="/baby-bets"
          className="inline-flex items-center font-serif text-base text-rose-400 transition-colors hover:text-rose-500"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-rose-900">Create a Game</h1>
        <p className="mt-2 font-serif italic text-rose-700/70">
          Set up a new baby name guessing game for your friends.
        </p>

        <div className="mt-8 border-2 border-rose-300 bg-white/90 p-1.5">
          <div className="border border-rose-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-serif text-base text-rose-800">
                  Game Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sarah's Baby"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 w-full border-2 border-rose-200 bg-white px-4 py-2.5 font-serif text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-rose-400/20"
                />
              </div>

              <div>
                <label className="block font-serif text-base text-rose-800">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Who's running this game?"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  className="mt-1.5 w-full border-2 border-rose-200 bg-white px-4 py-2.5 font-serif text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-rose-400/20"
                />
                <p className="mt-1 font-serif text-sm italic text-rose-500">
                  This will be shown as &ldquo;Managed by [your name]&rdquo;
                </p>
              </div>

              <div>
                <label className="mb-3 block font-serif text-base text-rose-800">
                  Baby Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "boy", label: "Boy", color: "emerald", emoji: "💙" },
                    { value: "girl", label: "Girl", color: "amber", emoji: "💛" },
                    { value: "surprise", label: "Surprise!", color: "rose", emoji: "✨" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: option.value as BabyGender })}
                      className={`border-2 px-4 py-3 text-center font-serif transition-all ${
                        formData.gender === option.value
                          ? option.color === "emerald"
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : option.color === "amber"
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-rose-400 bg-rose-50 text-rose-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-lg">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-serif text-base text-rose-800">
                  Password <span className="italic">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for no password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1.5 w-full border-2 border-rose-200 bg-white px-4 py-2.5 font-serif text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-rose-400/20"
                />
                <p className="mt-1 font-serif text-sm italic text-rose-500">
                  If set, players will need this password to join.
                </p>
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.hideGuesses}
                    onChange={(e) => setFormData({ ...formData, hideGuesses: e.target.checked })}
                    className="h-5 w-5 rounded border-2 border-rose-200 text-rose-500 focus:ring-rose-400/20"
                  />
                  <span className="font-serif text-base text-rose-800">
                    Hide guesses during submission phase
                  </span>
                </label>
                <p className="mt-1 ml-8 font-serif text-sm italic text-rose-500">
                  When enabled, players cannot see what others have guessed until voting begins.
                </p>
              </div>

              <div className={`border-t border-rose-200 pt-6`}>
                <h3 className="font-serif text-lg text-rose-800">Timeline</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block font-serif text-base text-rose-800">
                      Submissions Open
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.submissionStart}
                      onChange={(e) => setFormData({ ...formData, submissionStart: e.target.value })}
                      className="mt-1.5 w-full border-2 border-rose-200 bg-white px-4 py-2.5 font-serif text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-rose-400/20"
                    />
                  </div>
                  <div>
                    <label className="block font-serif text-base text-rose-800">
                      Voting Opens
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.votingStart}
                      onChange={(e) => setFormData({ ...formData, votingStart: e.target.value })}
                      className="mt-1.5 w-full border-2 border-rose-200 bg-white px-4 py-2.5 font-serif text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-rose-400/20"
                    />
                    <p className="mt-1 font-serif text-sm italic text-rose-500">
                      Submissions close when voting opens.
                    </p>
                  </div>
                  <div>
                    <label className="block font-serif text-base text-rose-800">
                      Reveal Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.revealDate}
                      onChange={(e) => setFormData({ ...formData, revealDate: e.target.value })}
                      className="mt-1.5 w-full border-2 border-rose-200 bg-white px-4 py-2.5 font-serif text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-rose-400/20"
                    />
                    <p className="mt-1 font-serif text-sm italic text-rose-500">
                      Voting closes at reveal. You can reveal early.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="border-l-4 border-red-400 bg-red-50 px-4 py-3 font-serif text-base text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full border-2 border-rose-400 bg-rose-500 px-4 py-3 font-serif font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Game"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

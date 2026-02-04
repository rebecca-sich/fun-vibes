"use client";

import { useState } from "react";
import Link from "next/link";
import { BabyGender } from "@/lib/baby-bets/types";

export default function CreateGamePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminUrl, setAdminUrl] = useState<string | null>(null);

  // Default dates: start now, submissions for 2 weeks, voting for 1 week, reveal after
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const fourWeeks = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  const formatDateForInput = (date: Date) => date.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    name: "",
    gender: "surprise" as BabyGender,
    password: "",
    submissionStart: formatDateForInput(now),
    submissionEnd: formatDateForInput(twoWeeks),
    votingStart: formatDateForInput(twoWeeks),
    votingEnd: formatDateForInput(threeWeeks),
    revealDate: formatDateForInput(fourWeeks),
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
          submissionEnd: new Date(formData.submissionEnd).toISOString(),
          votingStart: new Date(formData.votingStart).toISOString(),
          votingEnd: new Date(formData.votingEnd).toISOString(),
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
        <div className="mx-auto max-w-xl px-6 py-16 sm:py-24">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-rose-100">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-rose-900">Game Created!</h1>
              <p className="mt-2 text-rose-700/70">
                Save this admin link — you&apos;ll need it to manage the game and reveal the winner.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-rose-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-rose-500">
                Your Admin Link (keep this secret!)
              </p>
              <p className="mt-1 break-all font-mono text-sm text-rose-900">
                {typeof window !== "undefined" ? window.location.origin : ""}{adminUrl}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${adminUrl}`)}
                className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition-colors hover:bg-rose-600"
              >
                Copy Admin Link
              </button>
              <Link
                href={adminUrl}
                className="w-full rounded-xl bg-rose-100 px-4 py-3 text-center font-medium text-rose-700 transition-colors hover:bg-rose-200"
              >
                Go to Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
      <div className="mx-auto max-w-xl px-6 py-16 sm:py-24">
        <Link
          href="/baby-bets"
          className="inline-flex items-center text-sm text-rose-400 hover:text-rose-500 transition-colors"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-rose-900">Create a Game</h1>
        <p className="mt-2 text-rose-700/70">
          Set up a new baby name guessing game for your friends.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-rose-800">
              Game Name
            </label>
            <input
              type="text"
              required
              placeholder="Sarah's Baby"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-800 mb-3">
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
                  className={`rounded-xl border-2 px-4 py-3 text-center transition-all ${
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
            <label className="block text-sm font-medium text-rose-800">
              Password (optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank for no password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
            <p className="mt-1 text-xs text-rose-500">
              If set, players will need this password to join.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rose-800">
                Submissions Start
              </label>
              <input
                type="datetime-local"
                required
                value={formData.submissionStart}
                onChange={(e) => setFormData({ ...formData, submissionStart: e.target.value })}
                className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-rose-800">
                Submissions End
              </label>
              <input
                type="datetime-local"
                required
                value={formData.submissionEnd}
                onChange={(e) => setFormData({ ...formData, submissionEnd: e.target.value })}
                className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rose-800">
                Voting Starts
              </label>
              <input
                type="datetime-local"
                required
                value={formData.votingStart}
                onChange={(e) => setFormData({ ...formData, votingStart: e.target.value })}
                className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-rose-800">
                Voting Ends
              </label>
              <input
                type="datetime-local"
                required
                value={formData.votingEnd}
                onChange={(e) => setFormData({ ...formData, votingEnd: e.target.value })}
                className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-800">
              Reveal Date
            </label>
            <input
              type="datetime-local"
              required
              value={formData.revealDate}
              onChange={(e) => setFormData({ ...formData, revealDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
            <p className="mt-1 text-xs text-rose-500">
              You can reveal early from the admin panel.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Game"}
          </button>
        </form>
      </div>
    </main>
  );
}

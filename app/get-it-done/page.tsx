"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GetItDoneLanding() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleGoToTasks(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim()) return;

    setError("");
    setChecking(true);

    try {
      const res = await fetch(
        `/get-it-done/api/users/check-slug?slug=${encodeURIComponent(slug.trim().toLowerCase())}`
      );
      const data = await res.json();

      if (data.available) {
        setError(
          "Hmm, we couldn't find that one. Double-check the name or create a new space."
        );
      } else {
        router.push(`/get-it-done/${slug.trim().toLowerCase()}/today`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-5xl">
          Get **it Done
        </h1>
        <p className="mt-4 text-lg text-[#6B7280]">
          A simple way to keep track of your day — designed for ease of use.
        </p>

        <Link
          href="/get-it-done/new"
          className="mt-10 inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#2563EB] px-8 text-lg font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:bg-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        >
          Create Your Space
        </Link>

        <div className="mt-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#E5E7EB]" />
          <span className="text-sm font-medium text-[#6B7280]">
            Already have one?
          </span>
          <span className="h-px flex-1 bg-[#E5E7EB]" />
        </div>

        <form onSubmit={handleGoToTasks} className="mt-6">
          <label
            htmlFor="slug-input"
            className="block text-left text-sm font-medium text-[#6B7280]"
          >
            Your URL name
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20">
            <span className="text-sm text-[#9CA3AF] whitespace-nowrap">
              get-it-done /
            </span>
            <input
              id="slug-input"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setError("");
              }}
              placeholder="erics-tasks"
              className="flex-1 bg-transparent text-base text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:outline-none min-w-0"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>

          {error && (
            <p className="mt-3 text-left text-sm text-[#DC4F4F]">{error}</p>
          )}

          <button
            type="submit"
            disabled={!slug.trim() || checking}
            className="mt-4 inline-flex min-h-[54px] w-full items-center justify-center rounded-xl border-2 border-[#2563EB] px-8 text-lg font-semibold text-[#2563EB] transition-colors hover:bg-[#2563EB]/5 active:bg-[#2563EB]/10 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {checking ? "Checking..." : "Go to My Tasks"}
          </button>
        </form>
      </div>
    </main>
  );
}

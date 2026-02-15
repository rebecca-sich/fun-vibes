"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PinPad } from "@/components/get-it-done/PinPad";

export default function PinEntryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(false);

  // Fetch user name for display
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(
          `/get-it-done/api/users/check-slug?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json();
        if (data.name) {
          setUserName(data.name);
        }
      } catch {
        // Silently fail — name is just for display
      }
    }
    fetchUser();
  }, [slug]);

  async function handleSubmit() {
    if (pin.length !== 6 || checking) return;

    setError("");
    setChecking(true);

    try {
      const res = await fetch("/get-it-done/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });

      if (res.ok) {
        router.push(`/get-it-done/${slug}/today`);
        return;
      }

      // Wrong PIN
      setPin("");
      setError("That PIN didn't match — try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  // Auto-submit when PIN reaches expected length
  useEffect(() => {
    if (pin.length === 6) {
      // Small delay to let the dot fill animation complete
      const timer = setTimeout(() => handleSubmit(), 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          {userName ? `${userName}'s Tasks` : "Welcome back"}
        </h1>
        <p className="mt-2 text-base text-[#6B7280]">
          Enter your PIN to continue
        </p>

        <div className="mt-8">
          <PinPad
            pin={pin}
            maxLength={6}
            onChange={(value) => {
              setPin(value);
              setError("");
            }}
            onSubmit={handleSubmit}
            error={error}
            shake={shake}
          />
        </div>
      </div>
    </main>
  );
}

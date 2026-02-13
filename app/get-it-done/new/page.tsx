"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/get-it-done/PinPad";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const [wantPin, setWantPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-suggest slug from name
  useEffect(() => {
    if (!slugEdited && name) {
      const suggested = slugify(name);
      if (suggested.length >= 3) {
        setSlug(suggested + "-tasks");
      } else if (suggested.length > 0) {
        setSlug(suggested);
      }
    }
  }, [name, slugEdited]);

  // Debounced slug availability check
  const checkSlug = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSlugStatus("invalid");
      return;
    }
    setSlugStatus("checking");
    try {
      const res = await fetch(
        `/get-it-done/api/users/check-slug?slug=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setSlugStatus(data.available ? "available" : "taken");
    } catch {
      setSlugStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus(slug ? "invalid" : "idle");
      return;
    }
    const timer = setTimeout(() => checkSlug(slug), 500);
    return () => clearTimeout(timer);
  }, [slug, checkSlug]);

  // PIN flow
  function handlePinSubmit() {
    if (pinStep === "enter") {
      setPinStep("confirm");
      setPinConfirm("");
    } else {
      // confirm step — check match
      if (pinConfirm === pin) {
        // PIN confirmed, good to go
      } else {
        setPinConfirm("");
        setError("PINs didn't match — try again.");
        setPinStep("enter");
        setPin("");
      }
    }
  }

  const pinReady = wantPin
    ? pinStep === "confirm" && pinConfirm === pin && pin.length >= 4
    : true;

  const canSubmit =
    name.trim().length >= 1 &&
    slugStatus === "available" &&
    pinReady &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/get-it-done/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.toLowerCase(),
          email: email.trim() || undefined,
          phone_number: phone.trim() || undefined,
          pin: wantPin ? pin : undefined,
          is_protected: wantPin && pin.length >= 4,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">
          Let&apos;s set you up
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-10">
          {/* About You */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
              About You
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                  className="mt-1.5 block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
                  placeholder="Eric"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
                  placeholder="eric@email.com"
                />
                <p className="mt-1 text-sm text-[#9CA3AF]">
                  Used for daily agenda emails.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-[#1A1A1A]"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
                  placeholder="(555) 123-4567"
                />
                <p className="mt-1 text-sm text-[#9CA3AF]">
                  Used for text message reminders.
                </p>
              </div>
            </div>
          </section>

          {/* Personal URL */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
              Your Personal URL
            </h2>

            <div className="mt-5">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-[#1A1A1A]"
              >
                Choose a short name for your space
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setSlugEdited(true);
                }}
                maxLength={30}
                required
                className="mt-1.5 block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
                placeholder="erics-tasks"
                autoComplete="off"
                autoCapitalize="off"
              />

              {slug && (
                <div className="mt-2 text-sm">
                  {slugStatus === "checking" && (
                    <span className="text-[#6B7280]">Checking...</span>
                  )}
                  {slugStatus === "available" && (
                    <span className="text-[#6B9E78] font-medium">
                      Available!
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-[#DC4F4F] font-medium">
                      Already taken — try another
                    </span>
                  )}
                  {slugStatus === "invalid" && (
                    <span className="text-[#DC4F4F] font-medium">
                      Must be at least 3 characters
                    </span>
                  )}
                </div>
              )}

              {slug && slugStatus === "available" && (
                <p className="mt-1 text-sm text-[#9CA3AF]">
                  Your tasks will live at:{" "}
                  <span className="font-medium text-[#6B7280]">
                    /get-it-done/{slug}
                  </span>
                </p>
              )}
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
              Security
            </h2>

            <p className="mt-3 text-sm font-medium text-[#1A1A1A]">
              Password-protect your tasks?
            </p>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setWantPin(false);
                  setPin("");
                  setPinConfirm("");
                  setPinStep("enter");
                }}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-base font-semibold transition-colors min-h-[50px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                  !wantPin
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-[#E5E7EB] bg-white text-[#6B7280]"
                }`}
              >
                No, keep it open
              </button>
              <button
                type="button"
                onClick={() => setWantPin(true)}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-base font-semibold transition-colors min-h-[50px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                  wantPin
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-[#E5E7EB] bg-white text-[#6B7280]"
                }`}
              >
                Yes, add a PIN
              </button>
            </div>

            {wantPin && (
              <div className="mt-6 flex flex-col items-center">
                <p className="mb-4 text-sm font-medium text-[#1A1A1A]">
                  {pinStep === "enter"
                    ? "Choose a PIN (4-6 digits)"
                    : "Confirm your PIN"}
                </p>
                <PinPad
                  pin={pinStep === "enter" ? pin : pinConfirm}
                  maxLength={pin.length > 0 && pinStep === "confirm" ? pin.length : 6}
                  onChange={(value) => {
                    if (pinStep === "enter") {
                      setPin(value);
                    } else {
                      setPinConfirm(value);
                    }
                    setError("");
                  }}
                  onSubmit={handlePinSubmit}
                />
                {pinStep === "confirm" && pinConfirm === pin && pin.length >= 4 && (
                  <p className="mt-3 text-sm font-medium text-[#6B9E78]">
                    PIN confirmed!
                  </p>
                )}
                <p className="mt-4 text-center text-sm text-[#9CA3AF]">
                  Easy to remember — you&apos;ll enter this when you visit your
                  page.
                </p>
              </div>
            )}
          </section>

          {/* Error */}
          {error && (
            <p className="text-sm font-medium text-[#DC4F4F]" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-[#2563EB] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:bg-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed min-h-[54px]"
          >
            {submitting ? "Creating..." : "Create My Space"}
          </button>
        </form>
      </div>
    </main>
  );
}

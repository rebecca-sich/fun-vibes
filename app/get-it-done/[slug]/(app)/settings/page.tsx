"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PinPad } from "@/components/get-it-done/PinPad";
import { CsvUpload } from "@/components/get-it-done/CsvUpload";

interface UserProfile {
  name: string;
  email: string;
  phone_number: string;
  is_protected: boolean;
  timezone: string;
  week_start: 0 | 1;
  default_reminder_offset: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // PIN management
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [newPin, setNewPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch full profile on mount
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/get-it-done/api/users/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
            phone_number: data.user.phone_number || "",
            is_protected: data.user.is_protected ?? false,
            timezone: data.user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            week_start: data.user.week_start ?? 0,
            default_reminder_offset: data.user.default_reminder_offset ?? 15,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [slug]);

  async function saveField(field: string, value: unknown) {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/get-it-done/api/users/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  function handleFieldChange(field: keyof UserProfile, value: unknown) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    saveField(field, value);
  }

  async function handleSignOut() {
    await fetch("/get-it-done/api/auth/signout", { method: "POST" });
    router.push("/get-it-done");
  }

  async function handleDeleteAccount() {
    try {
      const res = await fetch(`/get-it-done/api/users/${slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/get-it-done");
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  }

  // PIN setup flow
  function handlePinSubmit() {
    setPinError("");
    if (pinStep === "enter") {
      if (pinInput.length !== 6) return;
      setNewPin(pinInput);
      setPinInput("");
      setPinStep("confirm");
    } else {
      // Confirm step
      if (pinInput === newPin) {
        savePinToServer(pinInput);
      } else {
        setPinError("PINs don't match. Try again.");
        setPinStep("enter");
        setNewPin("");
        setPinInput("");
      }
    }
  }

  async function savePinToServer(pin: string) {
    try {
      const res = await fetch(`/get-it-done/api/users/${slug}/pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setProfile((p) => (p ? { ...p, is_protected: true } : p));
        setShowPinSetup(false);
        setPinStep("enter");
        setNewPin("");
        setPinInput("");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Failed to save PIN:", err);
      setPinError("Failed to save PIN. Please try again.");
    }
  }

  async function handleRemovePin() {
    try {
      const res = await fetch(`/get-it-done/api/users/${slug}/pin`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProfile((p) => (p ? { ...p, is_protected: false } : p));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Failed to remove PIN:", err);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/get-it-done/${slug}`;
    navigator.clipboard.writeText(url);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  if (loading || !profile) {
    return (
      <div className="py-8 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8">
      {/* Save status indicator */}
      {saveStatus !== "idle" && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-opacity ${
            saveStatus === "saved"
              ? "bg-[#6B9E78] text-white"
              : saveStatus === "saving"
                ? "bg-[#F3F4F6] text-[#6B7280]"
                : "bg-[#DC4F4F] text-white"
          }`}
          role="status"
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Saved!"
              : "Error saving"}
        </div>
      )}

      {/* Profile section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">Profile</h2>

        <div>
          <label
            htmlFor="settings-name"
            className="block text-sm font-medium text-[#6B7280] mb-1.5"
          >
            Name
          </label>
          <input
            id="settings-name"
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
            onBlur={() => saveField("name", profile.name)}
            maxLength={50}
            className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
          />
        </div>

        <div>
          <label
            htmlFor="settings-email"
            className="block text-sm font-medium text-[#6B7280] mb-1.5"
          >
            Email (optional)
          </label>
          <input
            id="settings-email"
            type="email"
            value={profile.email}
            onChange={(e) =>
              setProfile({ ...profile, email: e.target.value })
            }
            onBlur={() => saveField("email", profile.email || null)}
            className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
          />
        </div>

        <div>
          <label
            htmlFor="settings-phone"
            className="block text-sm font-medium text-[#6B7280] mb-1.5"
          >
            Phone (optional)
          </label>
          <input
            id="settings-phone"
            type="tel"
            value={profile.phone_number}
            onChange={(e) =>
              setProfile({ ...profile, phone_number: e.target.value })
            }
            onBlur={() =>
              saveField("phone_number", profile.phone_number || null)
            }
            className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
          />
        </div>
      </section>

      {/* Display section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">Display</h2>

        <div>
          <span className="block text-sm font-medium text-[#6B7280] mb-2">
            Week starts on
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFieldChange("week_start", 0)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors min-h-[46px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                profile.week_start === 0
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-[#E5E7EB] bg-white text-[#6B7280]"
              }`}
            >
              Sunday
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange("week_start", 1)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors min-h-[46px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
                profile.week_start === 1
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-[#E5E7EB] bg-white text-[#6B7280]"
              }`}
            >
              Monday
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="settings-timezone"
            className="block text-sm font-medium text-[#6B7280] mb-1.5"
          >
            Timezone
          </label>
          <select
            id="settings-timezone"
            value={profile.timezone}
            onChange={(e) => handleFieldChange("timezone", e.target.value)}
            className="block w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-h-[50px]"
          >
            {Intl.supportedValuesOf("timeZone").map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Security section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">Security</h2>

        {showPinSetup ? (
          <div className="rounded-xl border-2 border-[#E5E7EB] bg-white p-5 space-y-4">
            <p className="text-center text-base font-semibold text-[#1A1A1A]">
              {pinStep === "enter" ? "Enter a new 6-digit PIN" : "Confirm your PIN"}
            </p>
            {pinError && (
              <p className="text-center text-sm font-medium text-[#DC4F4F]">
                {pinError}
              </p>
            )}
            <PinPad
              pin={pinInput}
              maxLength={6}
              onChange={setPinInput}
              onSubmit={handlePinSubmit}
              error={pinError}
              shake={!!pinError}
            />
            <button
              type="button"
              onClick={() => {
                setShowPinSetup(false);
                setPinStep("enter");
                setNewPin("");
                setPinInput("");
                setPinError("");
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[46px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.is_protected ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
                  <span className="text-sm font-medium text-[#166534]">
                    PIN protection is enabled
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPinSetup(true)}
                    className="flex-1 rounded-xl border-2 border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px]"
                  >
                    Change PIN
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="flex-1 rounded-xl border-2 border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#DC4F4F] transition-colors hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-[#DC4F4F] focus:ring-offset-2 min-h-[50px]"
                  >
                    Remove PIN
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowPinSetup(true)}
                className="w-full rounded-xl border-2 border-[#2563EB] px-4 py-3 text-base font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px]"
              >
                Add a PIN
              </button>
            )}
          </div>
        )}
      </section>

      {/* Data section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">Data</h2>
        <CsvUpload
          slug={slug}
          onStatusChange={(status) => {
            if (status === "success") {
              setSaveStatus("saved");
              setTimeout(() => setSaveStatus("idle"), 2000);
            }
          }}
        />
      </section>

      {/* Account section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">Account</h2>

        {/* Personal link */}
        <div className="rounded-xl border-2 border-[#E5E7EB] bg-white p-4 space-y-2">
          <p className="text-sm font-medium text-[#6B7280]">Your personal link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-[#F3F4F6] px-3 py-2 text-sm text-[#1A1A1A] overflow-hidden text-ellipsis">
              {typeof window !== "undefined"
                ? `${window.location.origin}/get-it-done/${slug}`
                : `/get-it-done/${slug}`}
            </code>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-xl border-2 border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[42px]"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-3 text-base font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px]"
        >
          Sign Out
        </button>

        {/* Delete account */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl px-4 py-3 text-base font-semibold text-[#DC4F4F] transition-colors hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-[#DC4F4F] focus:ring-offset-2 min-h-[50px]"
          >
            Delete Account
          </button>
        ) : (
          <div className="rounded-xl border-2 border-[#DC4F4F] bg-[#FEF2F2] p-4 space-y-3">
            <p className="text-sm font-medium text-[#DC4F4F]">
              This will permanently delete your account and all your tasks. This
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 min-h-[50px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-[#DC4F4F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C53030] focus:outline-none focus:ring-2 focus:ring-[#DC4F4F] focus:ring-offset-2 min-h-[50px]"
              >
                Delete Forever
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

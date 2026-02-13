"use client";

import { useCallback, useEffect } from "react";

interface PinPadProps {
  pin: string;
  maxLength: number;
  onChange: (pin: string) => void;
  onSubmit?: () => void;
  error?: string;
  shake?: boolean;
}

export function PinPad({
  pin,
  maxLength,
  onChange,
  onSubmit,
  error,
  shake,
}: PinPadProps) {
  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < maxLength) {
        const next = pin + digit;
        onChange(next);
      }
    },
    [pin, maxLength, onChange]
  );

  const handleBackspace = useCallback(() => {
    onChange(pin.slice(0, -1));
  }, [pin, onChange]);

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && onSubmit && pin.length >= 4) {
        onSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace, onSubmit, pin.length]);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN dots */}
      <div
        className={`flex items-center gap-3 ${shake ? "animate-shake" : ""}`}
        role="status"
        aria-label={`${pin.length} of ${maxLength} digits entered`}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition-colors duration-200 ${
              i < pin.length
                ? "bg-[#2563EB]"
                : "border-2 border-[#D1D5DB] bg-white"
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm font-medium text-[#DC4F4F]" role="alert">
          {error}
        </p>
      )}

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-3.5">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            aria-label={`Digit ${digit}`}
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[#1A1A1A] shadow-sm border border-[#E5E7EB] transition-colors active:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: backspace, 0, submit/empty */}
        <button
          type="button"
          onClick={handleBackspace}
          aria-label="Backspace"
          className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white text-xl text-[#6B7280] shadow-sm border border-[#E5E7EB] transition-colors active:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          aria-label="Digit 0"
          className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[#1A1A1A] shadow-sm border border-[#E5E7EB] transition-colors active:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        >
          0
        </button>

        {onSubmit ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={pin.length < 4}
            aria-label="Submit PIN"
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-sm transition-colors active:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <div className="h-[60px] w-[60px]" />
        )}
      </div>
    </div>
  );
}

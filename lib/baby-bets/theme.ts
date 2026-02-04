import { BabyGender } from "./types";

export interface GameTheme {
  // Background gradient
  bgGradient: string;
  // Card backgrounds
  cardBg: string;
  cardBgHover: string;
  cardRing: string;
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent colors
  accent: string;
  accentHover: string;
  accentLight: string;
  // Form inputs
  inputBorder: string;
  inputFocus: string;
  // Badge colors
  badgeBg: string;
  badgeText: string;
}

const themes: Record<BabyGender, GameTheme> = {
  boy: {
    bgGradient: "from-emerald-50 via-teal-50 to-cyan-50",
    cardBg: "bg-white/70",
    cardBgHover: "hover:bg-white",
    cardRing: "ring-emerald-100",
    textPrimary: "text-emerald-900",
    textSecondary: "text-emerald-700/70",
    textMuted: "text-emerald-800/60",
    accent: "bg-emerald-500",
    accentHover: "hover:bg-emerald-600",
    accentLight: "bg-emerald-100",
    inputBorder: "border-emerald-200",
    inputFocus: "focus:border-emerald-400 focus:ring-emerald-400/20",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  girl: {
    bgGradient: "from-amber-50 via-yellow-50 to-orange-50",
    cardBg: "bg-white/70",
    cardBgHover: "hover:bg-white",
    cardRing: "ring-amber-100",
    textPrimary: "text-amber-900",
    textSecondary: "text-amber-700/70",
    textMuted: "text-amber-800/60",
    accent: "bg-amber-500",
    accentHover: "hover:bg-amber-600",
    accentLight: "bg-amber-100",
    inputBorder: "border-amber-200",
    inputFocus: "focus:border-amber-400 focus:ring-amber-400/20",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  surprise: {
    bgGradient: "from-rose-50 via-pink-50 to-fuchsia-50",
    cardBg: "bg-white/70",
    cardBgHover: "hover:bg-white",
    cardRing: "ring-rose-100",
    textPrimary: "text-rose-900",
    textSecondary: "text-rose-700/70",
    textMuted: "text-rose-800/60",
    accent: "bg-rose-500",
    accentHover: "hover:bg-rose-600",
    accentLight: "bg-rose-100",
    inputBorder: "border-rose-200",
    inputFocus: "focus:border-rose-400 focus:ring-rose-400/20",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-600",
  },
};

export function getTheme(gender: BabyGender): GameTheme {
  return themes[gender];
}

export function getGenderLabel(gender: BabyGender): string {
  switch (gender) {
    case "boy":
      return "Boy";
    case "girl":
      return "Girl";
    case "surprise":
      return "It's a Surprise!";
  }
}

export function getGenderEmoji(gender: BabyGender): string {
  switch (gender) {
    case "boy":
      return "👶🩵";
    case "girl":
      return "👶💛";
    case "surprise":
      return "👶✨";
  }
}

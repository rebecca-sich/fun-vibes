import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Rose theme (surprise)
    "from-rose-50", "via-pink-50", "to-fuchsia-50",
    "ring-rose-100", "bg-rose-100", "bg-rose-500",
    "text-rose-900", "text-rose-700/70", "text-rose-800/60", "text-rose-600",
    "border-rose-200", "focus:border-rose-400", "focus:ring-rose-400/20",
    "hover:bg-rose-600",
    // Emerald theme (boy)
    "from-emerald-50", "via-teal-50", "to-cyan-50",
    "ring-emerald-100", "bg-emerald-100", "bg-emerald-500",
    "text-emerald-900", "text-emerald-700/70", "text-emerald-800/60", "text-emerald-700",
    "border-emerald-200", "focus:border-emerald-400", "focus:ring-emerald-400/20",
    "hover:bg-emerald-600",
    // Amber theme (girl)
    "from-amber-50", "via-yellow-50", "to-orange-50",
    "ring-amber-100", "bg-amber-100", "bg-amber-500",
    "text-amber-900", "text-amber-700/70", "text-amber-800/60", "text-amber-700",
    "border-amber-200", "focus:border-amber-400", "focus:ring-amber-400/20",
    "hover:bg-amber-600",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

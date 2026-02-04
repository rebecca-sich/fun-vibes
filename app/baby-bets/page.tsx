import Link from "next/link";
import { getAllGames } from "@/lib/baby-bets/db";
import { getGamePhase, getPhaseLabel } from "@/lib/baby-bets/phases";

export const dynamic = "force-dynamic";

export default async function BabyBetsHome() {
  let games: Awaited<ReturnType<typeof getAllGames>> = [];

  try {
    games = await getAllGames();
  } catch {
    // If Redis isn't configured yet, just show empty state
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
      <div className="mx-auto max-w-2xl flex-1 px-6 py-8 sm:py-12">
        <header className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-rose-900 sm:text-5xl">
            Baby Bets
          </h1>
          <p className="mt-4 font-serif text-lg italic text-rose-700/70">
            Guess what your friends are naming their baby
          </p>
        </header>

        <div className="mt-8 flex justify-center">
          <Link
            href="/baby-bets/create"
            className="inline-flex items-center gap-2 border-2 border-rose-400 bg-rose-500 px-6 py-3 font-serif font-medium text-white transition-colors hover:bg-rose-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Game
          </Link>
        </div>

        {games.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-base uppercase tracking-wider text-rose-500">
              Active Games
            </h2>
            <div className="mt-4 space-y-4">
              {games.map((game) => {
                const phase = getGamePhase(game);
                const phaseLabel = getPhaseLabel(phase);

                return (
                  <Link
                    key={game.id}
                    href={`/baby-bets/${game.id}`}
                    className="block border-2 border-rose-300 bg-white/90 p-1 transition-all hover:bg-white"
                  >
                    <div className="flex items-center justify-between border border-rose-200 p-5">
                      <h3 className="font-serif text-lg text-rose-900">
                        {game.name}
                      </h3>
                      <span className={`border px-3 py-1 font-serif text-sm ${
                        phase === "submission" ? "border-green-400 text-green-700" :
                        phase === "voting" ? "border-blue-400 text-blue-700" :
                        phase === "revealed" ? "border-purple-400 text-purple-700" :
                        "border-rose-400 text-rose-600"
                      }`}>
                        {phaseLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {games.length === 0 && (
          <div className="mt-12 border-2 border-rose-300 bg-white/90 p-1.5">
            <div className="border border-rose-200 p-8 text-center">
              <p className="font-serif italic text-rose-800/60">
                No games yet. Create one to get started!
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="pb-8 text-center">
        <p className="font-serif text-base text-rose-400">
          Part of the{" "}
          <Link
            href="/"
            className="font-medium text-rose-500 transition-colors hover:text-rose-600"
          >
            Good Vibes Projects
          </Link>
        </p>
      </footer>
    </main>
  );
}

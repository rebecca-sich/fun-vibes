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
      <div className="mx-auto max-w-2xl flex-1 px-6 py-16 sm:py-24">
        <header className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-rose-900 sm:text-5xl">
            Baby Bets
          </h1>
          <p className="mt-4 text-lg text-rose-700/70">
            Guess what your friends are naming their baby
          </p>
        </header>

        <div className="mt-8 flex justify-center">
          <Link
            href="/baby-bets/create"
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-medium text-white transition-colors hover:bg-rose-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Game
          </Link>
        </div>

        {games.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-500">
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
                    className="block rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-rose-100 transition-all hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-rose-900">
                        {game.name}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        phase === "submission" ? "bg-green-100 text-green-700" :
                        phase === "voting" ? "bg-blue-100 text-blue-700" :
                        phase === "revealed" ? "bg-purple-100 text-purple-700" :
                        "bg-rose-100 text-rose-600"
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
          <div className="mt-12 rounded-3xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-rose-100">
            <p className="text-rose-800/60">
              No games yet. Create one to get started!
            </p>
          </div>
        )}
      </div>

      <footer className="pb-8 text-center">
        <p className="text-sm text-rose-400">
          Part of the{" "}
          <Link
            href="/"
            className="font-medium text-rose-500 hover:text-rose-600 transition-colors"
          >
            Good Vibes Projects
          </Link>
        </p>
      </footer>
    </main>
  );
}

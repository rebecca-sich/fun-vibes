import { ProjectCard } from "@/components/ui/ProjectCard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col mesh-gradient">
      <div className="mx-auto max-w-4xl flex-1 px-6 py-24 sm:py-32">
        <header className="text-center">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            Good Vibes
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              All The Time
            </span>
          </h1>

          <div className="mx-auto mt-12 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
            <p className="font-bold font-serif text-2xl tracking-wide text-white/60" style={{ fontVariant: "small-caps" }}>
              things that don&apos;t solve real problems but make life better
            </p>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
          </div>
        </header>

        <section className="mt-24">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
            The Vibes
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <ProjectCard
              title="Baby Bets"
              description="Guess what your friends are naming their baby. Place your bets and see who gets closest!"
              href="/baby-bets"
            />
            <ProjectCard
              title="More Coming Soon"
              description="New projects are in the works. Check back for more fun experiments!"
              comingSoon
            />
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 py-8">
        <p className="text-center text-sm text-white/40">
          Made with love and just vibes, <span className="text-white/60">Sich</span>
        </p>
      </footer>
    </main>
  );
}

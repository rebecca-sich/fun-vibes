import { ProjectCard } from "@/components/ui/ProjectCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Fun Vibes
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            A collection of fun, vibe-coded projects
          </p>
        </header>

        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Projects
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <ProjectCard
              title="Baby Bets"
              description="Guess what your friends are naming their baby. Place your bets and see who gets closest!"
              href="/baby-bets"
              accentColor="from-pink-400 to-rose-400"
            />
            <ProjectCard
              title="More Coming Soon"
              description="New projects are in the works. Check back for more fun experiments!"
              comingSoon
              accentColor="from-gray-300 to-gray-400"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

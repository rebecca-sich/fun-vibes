import Link from "next/link";

interface PoolPageProps {
  params: Promise<{ poolId: string }>;
}

export default async function PoolPage({ params }: PoolPageProps) {
  const { poolId } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <Link
          href="/baby-bets"
          className="inline-flex items-center text-sm text-rose-400 hover:text-rose-500 transition-colors"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="mt-8 rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-rose-100">
          <p className="text-center text-rose-800/60">
            Pool: {poolId}
          </p>
          <p className="mt-2 text-center text-sm text-rose-800/40">
            This page will show the pool details and let people place bets.
          </p>
        </div>
      </div>
    </main>
  );
}

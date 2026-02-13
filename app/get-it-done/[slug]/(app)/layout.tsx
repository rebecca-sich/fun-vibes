import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserBySlug } from "@/lib/get-it-done/db";
import { verifySession } from "@/lib/get-it-done/session";
import Link from "next/link";
import { NavLink } from "@/components/get-it-done/NavLink";

export default async function AuthenticatedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getUserBySlug(slug);
  if (!user) {
    redirect("/get-it-done");
  }

  // Check PIN auth for protected users
  if (user.is_protected) {
    const cookieStore = await cookies();
    const token = cookieStore.get("gid-session")?.value;
    const sessionSlug = token ? await verifySession(token) : null;

    if (sessionSlug !== slug) {
      redirect(`/get-it-done/${slug}/pin`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-[#FAF9F6]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[#1A1A1A]">
            {user.name}&apos;s Day
          </h1>
          <Link
            href={`/get-it-done/${slug}/settings`}
            className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
            aria-label="Settings"
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pb-24">
        <div className="mx-auto max-w-[640px]">{children}</div>
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#E5E7EB] bg-[#FAF9F6]/95 backdrop-blur-sm"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-[640px] items-center justify-around py-1">
          <NavLink
            href={`/get-it-done/${slug}/today`}
            label="Today"
            icon="today"
          />
          <NavLink
            href={`/get-it-done/${slug}/calendar`}
            label="Calendar"
            icon="calendar"
          />
        </div>
      </nav>
    </div>
  );
}

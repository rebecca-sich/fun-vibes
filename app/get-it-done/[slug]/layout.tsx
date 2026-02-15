import { notFound } from "next/navigation";
import { getUserBySlug } from "@/lib/get-it-done/db";

export const dynamic = "force-dynamic";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getUserBySlug(slug);
  if (!user) {
    notFound();
  }

  return <>{children}</>;
}

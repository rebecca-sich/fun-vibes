import Link from "next/link";

interface ProjectCardProps {
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}

export function ProjectCard({
  title,
  description,
  href,
  comingSoon = false,
}: ProjectCardProps) {
  const cardContent = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl p-8
        glass transition-all duration-500 ease-out
        ${comingSoon
          ? "opacity-50 cursor-default"
          : "glass-hover hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer"
        }
      `}
    >
      <h3 className="text-2xl font-bold text-white tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-white/60 leading-relaxed">
        {description}
      </p>
      {comingSoon ? (
        <span className="mt-6 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
          Coming Soon
        </span>
      ) : (
        <span className="mt-6 inline-flex items-center text-sm font-medium text-white/80 group-hover:text-white transition-colors">
          Explore
          <svg
            className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </span>
      )}
    </div>
  );

  if (comingSoon || !href) {
    return cardContent;
  }

  return <Link href={href}>{cardContent}</Link>;
}

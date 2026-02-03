import Link from "next/link";

interface ProjectCardProps {
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
  accentColor?: string;
}

export function ProjectCard({
  title,
  description,
  href,
  comingSoon = false,
  accentColor = "from-violet-500 to-purple-500",
}: ProjectCardProps) {
  const cardContent = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl bg-white p-6
        shadow-md transition-all duration-300
        ${comingSoon ? "opacity-60" : "hover:shadow-xl hover:-translate-y-1"}
      `}
    >
      <div
        className={`
          absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentColor}
          transition-all duration-300 group-hover:h-1.5
        `}
      />
      <h3 className="mt-2 text-xl font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
      {comingSoon && (
        <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
          Coming Soon
        </span>
      )}
      {!comingSoon && (
        <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-600 group-hover:text-violet-700">
          Explore
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
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

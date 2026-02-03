# Fun Vibes

A home for vibe-coded projects, all living in one Next.js application.

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the homepage.

## Project Structure

```
fun-vibes/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (shared across all pages)
│   ├── page.tsx            # Homepage (/)
│   ├── globals.css         # Global styles + Tailwind
│   └── baby-bets/          # Baby Bets app (coming soon)
│       └── page.tsx        # /baby-bets route
│
├── components/             # Reusable React components
│   └── ui/                 # Generic UI components
│       └── ProjectCard.tsx # Card component for project links
│
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies and scripts
```

## How the Monorepo Works

This is a single Next.js app with multiple "mini-apps" as routes:

- `/` - Homepage with links to all projects
- `/baby-bets` - Baby name betting game (coming soon)
- `/your-next-app` - Add more apps as new folders in `app/`

Each app gets its own folder inside `app/`. The folder name becomes the URL path.

### Adding a New Project

1. Create a new folder in `app/` (e.g., `app/my-new-app/`)
2. Add a `page.tsx` inside it - this becomes the main page for that route
3. Add a card on the homepage (`app/page.tsx`) linking to your new app

Example:
```
app/
└── my-new-app/
    ├── page.tsx         # /my-new-app
    └── [id]/
        └── page.tsx     # /my-new-app/123 (dynamic route)
```

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the project
3. Vercel auto-detects Next.js and deploys it

That's it - no configuration needed for a basic deploy.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

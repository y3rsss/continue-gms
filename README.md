# Continue?

The video game index. Browse over 900,000 games, compare them by score, and keep a backlog of what to play next.

**Live:** [continue-gms.vercel.app](https://continue-gms.vercel.app)

![The cover page](docs/cover.png)

## Features

- **Cover page** with a trending cover story and rows of trending, new and all-time great games
- **Index** of every game as a ranked list or a grid, filtered by genre, platform and search. Filters live in the URL, so any view can be bookmarked or shared.
- **Game pages** printed in a spot color taken from the game's cover art, with details, screenshots and similar games
- **Backlog** to mark games as Want to play, Playing, Finished or Dropped
- **Day and night editions** (light and dark mode)

![A game page](docs/game.png)

## Tech stack

| Area             | Tools                                                                |
| ---------------- | -------------------------------------------------------------------- |
| App              | React 19, TypeScript, Vite 8                                         |
| Styling          | Tailwind CSS 4, shadcn/ui on Radix                                   |
| Data and routing | TanStack Query, React Router 8                                       |
| API              | Vercel Functions in front of the [RAWG API](https://rawg.io/apidocs) |
| Tooling          | ESLint 10, typescript-eslint                                         |

The browser never talks to RAWG directly. The app calls its own `/api` routes, which add the API key on the server, validate input, reshape the responses into the app's own types and cache them on Vercel's CDN.

## Running locally

You need Node 24 and a free RAWG API key from [rawg.io/apidocs](https://rawg.io/apidocs).

```bash
npm install
cp .env.example .env.local   # then set RAWG_API_KEY
npm run dev
```

The dev server runs the `/api` routes too, so local behaves like production.

| Script            | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server               |
| `npm run build`   | Typecheck and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Lint the project                   |

## Project structure

```text
api/          Vercel functions for games, game details, genres and platforms
shared/       Types used by both the API and the app
src/
  pages/      Cover, index, game and backlog pages
  components/ UI components
  hooks/      Data fetching, URL filters and the backlog
  lib/        Formatting, spot colors and status styles
```

## Credits

Game data and images come from [RAWG](https://rawg.io).

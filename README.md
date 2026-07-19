# Town of Amherst

A mobile-first **Expo + React Native + TypeScript** app showcasing a town information hub for the Town of Amherst, Nova Scotia.

This project was bootstrapped from the Town of Aurora / Orangeville town-hub template and re-themed for Amherst, NS, including new brand colors, a generated town crest, and Amherst-specific content, live-backed by Supabase.

## Features

### ✅ News Tab
- List view of town news (sorted newest first) + a Quick Links tab for external town resources
- Tap any article to view full details, with an adjustable text-size control
- Pull-to-refresh, loading and error states

### ✅ Events Tab
- List view of community events (sorted by date)
- Category filtering and search
- Add-to-calendar support for individual events

### ✅ Directory Tab
- Business directory with search and category filtering
- Sort by "LocalGovy Score" (rating)
- Tap any business to view full contact details, with click-to-call and click-to-map

### ✅ Polls Tab
- Community poll with voting and live percentage-bar results

### ✅ Chat Tab
- Interactive FAQ chatbot with keyword matching, contact lookups, and clickable links/phone numbers/business names

### ✅ School Tab
- School announcements (Chignecto-Central Regional Centre for Education) with a Snow Day Calculator

## Tech Stack

- **Framework**: Expo SDK 56 with React Native
- **Language**: TypeScript (strict mode)
- **Navigation**: expo-router with bottom tabs
- **Backend**: Supabase (Postgres) — live queries, no filler data
- **State**: React hooks (minimal, no external state library)
- **Testing**: Jest + ts-jest

## About the data

News, Events, School announcements, and the Business directory are all fetched live from Supabase via `services/supabase.ts`:

- `fetchNews` / `fetchNewsById` → `amherst_news`
- `fetchEvents` / `fetchEventById` → `amherst_events`
- `fetchSchoolAnnouncements` → `amherst_school`
- `fetchBusinesses` / `fetchBusinessById` → `amherst_business`

Each function queries its table directly and throws on error, so calling screens (and the chat business-name lookup) surface live data with normal loading/error/empty states — no local JSON stand-ins remain for these.

The Supabase URL + anon key live at the top of `services/supabase.ts`. Swap those for a different project if needed (make sure the URL is the bare project URL, e.g. `https://xxxx.supabase.co`, without a `/rest/v1/` suffix — `supabase-js` appends that itself).

Static-only content that isn't meant to come from a database (polls, FAQ, contacts, snow-day score) still lives in `assets/data/*.json` and is imported via `data/index.ts`.

## Project Structure

```
/Users/noah/lg_amherst/
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Splash screen, redirects to tabs
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tabs layout
│       ├── news/                # News list + detail + quick links
│       ├── events/              # Events list + detail
│       ├── directory/           # Business directory list + detail
│       ├── polls/                # Poll voting & results
│       ├── chat/                 # FAQ chatbot
│       └── school/               # School announcements + snow day calculator
├── assets/data/                  # Static-only JSON (polls, FAQ, contacts, snow day)
├── services/
│   └── supabase.ts               # Supabase client + fetch layer (see above)
├── components/                   # Reusable UI components
├── utils/                        # Pure utility functions (filter, keyword match, etc.)
├── __tests__/                    # Unit tests
├── data/
│   └── index.ts                  # Type definitions & static data exports
├── theme.ts                      # Amherst brand colors, spacing, typography tokens
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- iOS Simulator (Mac) or Android Emulator or Expo Go app on your phone

### Installation & Run

```bash
npm install
npx expo start
```
 
Press:
- `i` for iOS Simulator
- `a` for Android Emulator
- Scan the QR code with the Expo Go app on your phone

### Run Tests

```bash
npm test
```

## License

MIT - This is a demo project for educational/showcase purposes.

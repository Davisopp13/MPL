# AGENTS.md - MPL Project

## Project Context
MPL (Manual Process Log) is a PWA replacing a 124-question Microsoft Forms survey. CH and MH teams log time spent on manual processes. The data helps leadership prioritize automation investments.

## Architecture Patterns
- Next.js 14+ App Router with `app/` directory
- Supabase for auth, database, and RLS
- All authenticated pages live under `app/(main)/` with shared layout (header + bottom nav)
- Login and onboarding are outside the `(main)` route group
- Client components for interactive UI (logging flow, timer, charts)
- Server components for data fetching where possible

## Conventions
- Use TypeScript strictly - no `any` types
- Supabase client: `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server)
- Database types: `types/database.ts`
- Components: `components/` directory, PascalCase filenames
- Brand colors defined in `tailwind.config.ts` under `colors.mpl`
- All times stored as integer minutes in the database
- `verified: true` means the entry was timed, `verified: false` means manual estimate

## Key Domain Knowledge
- CH = Container Handler, MH = Marine Handler (two distinct teams)
- Categories are team-specific (CH has 9, MH has 10)
- Each category has sub-tasks (the actual processes being logged)
- Users only see categories for their team
- Supervisors can see all entries for their team's members
- Time chips: 5, 10, 15, 20, 30, 45, 60 minutes (preset buttons for fast entry)

## Testing
- Use Vitest for unit and component tests
- Test files co-located or in `__tests__/` directories
- Always run `npx tsc --noEmit` for type checking before marking tasks complete

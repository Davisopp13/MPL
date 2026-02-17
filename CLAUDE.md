# CLAUDE.md

## Project: MPL (Manual Process Log)

A PWA that replaces a 124-question Microsoft Forms survey with a sub-15-second time tracker for CH (Container Handler) and MH (Marine Handler) teams. Leadership uses the data to prioritize automation investments.

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npx tsc --noEmit         # Type check (run before every commit)
npm test                 # Run Vitest tests
npm run test:watch       # Watch mode

# Supabase
npx supabase start       # Local Supabase (Docker required)
npx supabase db push     # Push migrations to remote
npx supabase gen types typescript --local > types/database.ts  # Regenerate types from schema
```

## Tech Stack

- **Next.js 14+** with App Router (`app/` directory)
- **Supabase** for Postgres, Auth (magic link), and Row Level Security
- **TailwindCSS** with custom brand colors in `tailwind.config.ts`
- **TypeScript** strict mode — no `any` types
- **Vitest** for testing
- **@ducanh2912/next-pwa** for service worker and manifest

## Project Structure

```
app/
  login/page.tsx          # Magic link auth
  auth/callback/route.ts  # Auth callback handler
  onboard/page.tsx        # Name + team selection (first login only)
  (main)/                 # Authenticated route group
    layout.tsx            # Header + BottomNav wrapper
    log/page.tsx          # 3-step logging flow
    history/page.tsx      # Entry history with timestamps
    insights/page.tsx     # KPI cards + category breakdown
    team/page.tsx         # Supervisor team view
components/               # Shared UI components (PascalCase)
lib/
  supabase/client.ts      # Browser Supabase client
  supabase/server.ts      # Server Supabase client
types/
  database.ts             # Generated Supabase types
supabase/
  migrations/             # SQL migrations (numbered)
public/
  manifest.json           # PWA manifest
middleware.ts             # Auth route protection
```

## Architecture Decisions

- **Route groups:** All authenticated pages live under `app/(main)/` and share a layout with the MPL header and bottom nav. Login and onboarding are outside this group.
- **Client vs server components:** Data fetching in server components where possible. Client components for interactive UI (logging flow, timer, form state, charts).
- **Supabase RLS enforces access control** — members see their own entries, supervisors see their team's entries. Never bypass RLS with service role key in client code.
- **Categories are seeded via migration**, not hardcoded in the frontend. The frontend fetches categories from Supabase filtered by the user's team.
- **Timer verification:** `verified: true` = timed entry (higher confidence), `verified: false` = manual quick entry estimate. Both are valid data — the flag enables data quality analysis.

## Brand & Design

| Token | Value | Usage |
|-------|-------|-------|
| `mpl.primary` | `#0EA5E9` | Buttons, active states, links |
| `mpl.primaryDark` | `#0284C7` | Header gradient, hover states |
| `mpl.primaryLight` | `#E0F2FE` | Selected backgrounds, stat cards |
| `mpl.accent` | `#F59E0B` | Amber highlights, CH badges |
| `mpl.bg` | `#F8FAFC` | Page background |
| `mpl.surface` | `#FFFFFF` | Card backgrounds |
| `mpl.border` | `#E2E8F0` | Card borders, dividers |

- Mobile-first, max-width 430px centered
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Border radius: 12-16px cards, 8-10px inputs/chips
- No shadows — use 1px borders instead
- Time chips: pill buttons in a row (5m, 10m, 15m, 20m, 30m, 45m, 60m) + custom input
- Badges: TIMER = green (`#ECFDF5`/`#065F46`), MANUAL = amber (`#FEF3C7`/`#92400E`)
- Team badges: CH = amber, MH = blue
- Animations: max 200ms, slide-up for transitions, fade-in for toasts

## Domain Knowledge

- **CH** = Container Handler (9 categories), **MH** = Marine Handler (10 categories)
- Each category has sub-tasks — these are the actual manual processes being tracked
- Users belong to exactly one team and only see their team's categories
- The logging flow is 3 steps: **Category → Sub-task → Time entry**
- Occurrences track how many times a process happened in a single log (e.g., "dispatched 3 containers" = 1 entry, 3 occurrences, 12 minutes)
- Supervisors see team-level data; members see only their own

## Database Conventions

- All IDs are `uuid` using `gen_random_uuid()`
- All tables have `created_at timestamptz DEFAULT now()`
- Times stored as integer minutes (not seconds, not intervals)
- Team values are exactly `'CH'` or `'MH'` (text, not enum)
- Role values are exactly `'member'` or `'supervisor'`
- Supabase Auth `auth.uid()` links to `users.id`

## Common Patterns

### Fetching categories for the current user
```typescript
const { data: categories } = await supabase
  .from('categories')
  .select('*, subtasks(*)')
  .eq('team', user.team)
  .order('sort_order');
```

### Inserting a log entry
```typescript
const { error } = await supabase.from('log_entries').insert({
  user_id: user.id,
  category_id: selectedCategory.id,
  subtask_id: selectedSubtask.id,
  minutes,
  occurrences,
  note: note || null,
  verified: timerWasUsed,
});
```

### Aggregating for insights
```typescript
const { data } = await supabase
  .from('log_entries')
  .select('minutes, occurrences, category_id, subtask_id, categories(label, icon), subtasks(label)')
  .eq('user_id', user.id);
// Aggregate in JS — Supabase doesn't support GROUP BY via client lib
```

### Checking supervisor access
```typescript
// RLS handles enforcement, but for UI gating:
const isSupervisor = user.role === 'supervisor';
```

## Testing Guidelines

- Co-locate test files or use `__tests__/` directories
- Always run `npx tsc --noEmit` before committing — type errors break the build
- Test the logging flow state machine: category → subtask → time → submit → reset
- Test time chip behavior: select, deselect, custom input sync
- Test date grouping: today, yesterday, older dates
- Test timer: start, pause, resume, reset, minute calculation from seconds

## Things to Avoid

- Don't use `any` — define proper types or use `unknown` with type guards
- Don't bypass Supabase RLS with service role key in client-facing code
- Don't hardcode categories in components — always fetch from database
- Don't use `localStorage` for auth state — use Supabase session
- Don't add heavy animation libraries — CSS transitions and Tailwind utilities only
- Don't create API routes when a server action or direct Supabase query works
- Don't over-engineer — this is an MVP, ship working code fast

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anonymous key (safe for client)
```

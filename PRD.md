# MPL (Manual Process Log) - PWA

## Overview

MPL is a Progressive Web App that replaces a 124-question Microsoft Forms survey with a fast, mobile-friendly time tracker. CH (Container Handler) and MH (Marine Handler) teams log productivity loss from manual processes in seconds. Leadership gets real-time visibility into where automation investment will have the highest ROI.

**Target time to log an entry: under 15 seconds.**

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (Postgres + Row Level Security + Auth)
- **Styling:** TailwindCSS
- **Deployment:** Vercel
- **PWA:** next-pwa or @ducanh2912/next-pwa for service worker + manifest
- **Branding:** MPL Blue `#0EA5E9`, dark `#0284C7`, light `#E0F2FE`

## Database Schema

### users
- `id` uuid (PK, references auth.users)
- `email` text NOT NULL
- `name` text NOT NULL
- `team` text NOT NULL CHECK (team IN ('CH', 'MH'))
- `role` text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'supervisor'))
- `created_at` timestamptz DEFAULT now()

### categories
- `id` uuid (PK, DEFAULT gen_random_uuid())
- `label` text NOT NULL
- `icon` text NOT NULL
- `team` text NOT NULL CHECK (team IN ('CH', 'MH'))
- `sort_order` int NOT NULL DEFAULT 0
- `created_at` timestamptz DEFAULT now()

### subtasks
- `id` uuid (PK, DEFAULT gen_random_uuid())
- `category_id` uuid REFERENCES categories(id)
- `label` text NOT NULL
- `sort_order` int NOT NULL DEFAULT 0
- `created_at` timestamptz DEFAULT now()

### log_entries
- `id` uuid (PK, DEFAULT gen_random_uuid())
- `user_id` uuid REFERENCES users(id)
- `category_id` uuid REFERENCES categories(id)
- `subtask_id` uuid REFERENCES subtasks(id)
- `minutes` int NOT NULL CHECK (minutes > 0)
- `occurrences` int NOT NULL DEFAULT 1 CHECK (occurrences > 0)
- `note` text
- `verified` boolean NOT NULL DEFAULT false (true = timer-tracked, false = manual estimate)
- `created_at` timestamptz DEFAULT now()

## Process Taxonomy (Seed Data)

### CH Categories (9)

| Category | Icon | Sub-tasks |
|----------|------|-----------|
| Dwell Report | 📋 | Announcement, Trucker/Customer Follow up, CH/MH Check, In Transit |
| Routing Actions | 🔀 | COD/DIV, Misroutes |
| Notice Emails | 📧 | Salesforce Notice Emails, Outlook Emails, ICI Arrival Notice Emails, Additional Trucker Charges |
| Manual Dispatch | 📦 | Sending Work Orders, Adding Splits, Shuttle (in FIS), No Reply / Rejections, DO Corrections |
| Invoicing | 💰 | Blume Charges, TREXs, Work Order Updates |
| 3rd Party Website | 🌐 | IMC Shuttle Review, CP Billing |
| Rail Storage | 🚃 | Rail Storage |
| Report / Macro | ⚙️ | Panasonic IMAR, Pre-Advise Macro |
| Other | 📌 | Meetings, Trainings, Popup Mgmt / Interruptions, General Escalation |

### MH Categories (10)

| Category | Icon | Sub-tasks |
|----------|------|-----------|
| Port / Terminal Mgmt | 🏗️ | Line Release, Dwell, Announcements, Rail Billing / Splits, Customs Review, Assigning Trucker Appts., Issuing ITs / Arriving IT |
| Routing Actions | 🔀 | Re Export / ROB, COD/DIV, Misroutes, Damage / Transloads |
| Invoicing | 💰 | Rail Storage, TREX |
| Outlook / Notice Emails | 📧 | Exam Management, Port Communications, QSCRAIL Inbox, NS Container Hold Emails, CPKC Invalid Commodity |
| Rail Billing | 🚃 | Truck Work Order, Rail Work Order |
| Cross Border | 🛃 | Rejections, Abandonment, A6 Release, Border Exam Charges, Mexico Arrival Notice, Mexico Rail Billing, Mexico Documentation, All Truck Moves |
| Report / Macro | ⚙️ | General Order, TDRA, OAK Macro, Rail Advisory Macro, IT Macro, In-transit Macro, Rail Report E3000 Macro |
| Transshipment / Barge / Omit | 🚢 | Outlook Email Mgmt, Master Sheet, Booking Request, Update Routing / WO / Split, Bermuda, HNL, Area Organization, Run Remark Macro, Complete PCC, Correcting Vessel Manifest, Updating Routing, Correcting ITs, Sending / Updating Billing, Withdraw / Sending Releases, Customer Email Notifications, Correcting Omit Errors |
| 3rd Party Website | 🌐 | CSX Billing, Covering / Posting Rail Storage, Termview (AMP) |
| Other | 📌 | Meetings, Trainings, Popup Mgmt / Interruptions, General Escalation |

## Tasks

### Phase 1: Project Setup

- [x] **1.1 Initialize Next.js project** - Create Next.js 14+ app with App Router, TailwindCSS, and TypeScript. Configure `tailwind.config.ts` with MPL brand colors (primary: `#0EA5E9`, primaryDark: `#0284C7`, primaryLight: `#E0F2FE`). Set up project structure: `app/`, `components/`, `lib/`, `types/`. Add a basic layout with the MPL header (blue gradient, logo "M", title "MPL", subtitle "Manual Process Log").

- [x] **1.2 Set up Supabase client and types** - Install `@supabase/supabase-js` and `@supabase/ssr`. Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client). Create `types/database.ts` with TypeScript types matching the database schema above. Use environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [x] **1.3 Create Supabase migration for schema** - Create a SQL migration file at `supabase/migrations/001_initial_schema.sql` that creates all 4 tables (users, categories, subtasks, log_entries) with the exact schema defined above. Include indexes on `log_entries(user_id)`, `log_entries(category_id)`, `log_entries(created_at)`, `subtasks(category_id)`, and `categories(team)`.

- [x] **1.4 Create seed data migration** - Create `supabase/migrations/002_seed_categories.sql` that inserts ALL categories and subtasks from the Process Taxonomy section above. Use `gen_random_uuid()` for IDs. Set `sort_order` sequentially. This must include all 9 CH categories with their subtasks and all 10 MH categories with their subtasks. Every single sub-task listed above must be seeded.

- [x] **1.5 Set up Row Level Security** - Create `supabase/migrations/003_rls_policies.sql`. Enable RLS on all tables. Policies: (1) users can read their own row and supervisors can read all users on their team, (2) categories and subtasks are readable by all authenticated users, (3) log_entries: users can INSERT their own, SELECT their own; supervisors can SELECT all entries for users on their team. Use `auth.uid()` for user identification.

- [x] **1.6 Set up Supabase Auth** - Create `app/login/page.tsx` with magic link auth using Supabase. Minimal UI: email input, "Send Magic Link" button, MPL branding. Create `app/auth/callback/route.ts` to handle the auth callback. Create middleware at `middleware.ts` to protect all routes except `/login` and `/auth/callback`. After first login, redirect to an onboarding step if user doesn't exist in the users table yet.

- [x] **1.7 Create onboarding flow** - Create `app/onboard/page.tsx`. After first auth, user enters their name and selects their team (CH or MH) via two large buttons. This creates their row in the users table. Redirect to `/` after completion. If user already exists in users table, skip onboarding and go to `/`.

### Phase 2: Core Logging Flow

- [x] **2.1 Create bottom navigation** - Build `components/BottomNav.tsx`. Fixed bottom bar with 4 tabs: Log (➕), History (📋), Insights (📊), Team (👥). Active tab shows MPL blue with top border accent. Include safe area padding for mobile. Use `app/(main)/layout.tsx` to wrap all authenticated pages with this nav + the MPL header. Header should show the user's initials avatar and a CH/MH badge.

- [x] **2.2 Build category selection (Step 1 of logging)** - Create `app/(main)/log/page.tsx`. Fetch categories from Supabase filtered by the user's team. Display as a 2-column grid of cards, each showing the icon, label, and sub-task count. Tapping a category advances to sub-task selection. Show breadcrumb navigation with back arrow at top.

- [x] **2.3 Build sub-task selection (Step 2 of logging)** - After category selection, display the category's sub-tasks as a vertical list of tappable rows. Each row shows the sub-task label with a chevron. Tapping advances to the time entry step. Breadcrumb updates to show Category > Sub-task path. Back navigation returns to category grid.

- [x] **2.4 Build time entry with chips (Step 3 of logging)** - After sub-task selection, show: (1) Context pill at top showing selected category icon + label + sub-task. (2) Mode toggle: "Quick Entry" vs "Timer". (3) Quick Entry mode: row of time chip buttons (5m, 10m, 15m, 20m, 30m, 45m, 60m) plus a custom minute input at the end. Selecting a chip highlights it blue and syncs the custom input. Typing a custom value deselects chips unless it matches one. (4) Occurrences stepper with − button, number input, + button, and helper text "How many times?". (5) Optional note textarea. (6) "Log Entry" submit button that shows the selected time (e.g., "Log 15m Entry"). Button disabled when no time selected or timer running.

- [x] **2.5 Build timer mode** - In the Timer tab of the time entry step: large monospace display (MM:SS), Start/Pause/Resume button (blue for start/resume, red for pause), Reset button when paused. Timer runs via `setInterval`. When stopped, the accumulated seconds are used for the entry. Occurrences stepper and note field still visible below timer. Submit button disabled while timer is actively running.

- [x] **2.6 Implement log entry submission** - On submit, INSERT into `log_entries` table with: user_id from auth session, category_id, subtask_id, minutes (from chips/custom/timer), occurrences, note, verified (true if timer was used with seconds > 0, false for quick entry). Show success toast "Entry logged ✅" for 2 seconds. Reset all form state and return to category selection. Handle errors gracefully with error toast.

### Phase 3: History View

- [x] **3.1 Build history page with date grouping** - Create `app/(main)/history/page.tsx`. Fetch user's log_entries from Supabase, JOIN with categories and subtasks for labels/icons, ordered by `created_at DESC`. Group entries by date: "Today", "Yesterday", then formatted dates (e.g., "Wed, Feb 12"). Show daily total minutes in each group header.

- [x] **3.2 Build history entry cards** - Each entry shows: category icon in a blue-tinted rounded square, category label with TIMER (green badge) or MANUAL (amber badge), sub-task name in blue, note (truncated, if present), clock timestamp (e.g., "🕐 2:35 PM"), occurrence count (e.g., "3x occurrences"), minutes on the right (bold blue), and per-occurrence average when occurrences > 1 (e.g., "~4m/ea").

- [x] **3.3 Build history summary card** - At top of history page, a gradient blue card showing: "Today's Total" with large minute count, entry count, and total occurrences for today.

### Phase 4: Insights Dashboard

- [x] **4.1 Build KPI cards** - Create `app/(main)/insights/page.tsx`. Top section: 2x2 grid of stat cards: Total Minutes Logged (blue), Hours/Week (amber), Total Entries (green), Total Occurrences (red). Data aggregated from user's log_entries.

- [x] **4.2 Build category breakdown chart** - Below KPI cards, show "Time by Category" section. For each category with logged time: icon + label on left, minutes + percentage on right, horizontal progress bar (blue gradient, relative to highest category). Sorted by minutes descending.

- [x] **4.3 Build automation opportunity callout** - Below category chart, an amber card with lightbulb icon and "Automation Opportunity" header. Identifies the sub-task with the highest total minutes across all entries. Shows: sub-task name, parent category, total minutes, and projected monthly savings (total × 4.3). Only shows if there are entries.

### Phase 5: Team / Supervisor View

- [x] **5.1 Build team overview page** - Create `app/(main)/team/page.tsx`. If user role is 'supervisor': show team aggregate card (total hours this week, member count), CH/MH/All filter buttons, and list of team members. Each member card shows: initials avatar, name, team badge (CH amber / MH blue), top category with icon, entry count, and total minutes. If user role is 'member': show a message that this view is for supervisors, or show read-only view of their own stats.

- [x] **5.2 Build team data queries** - Create server action or API route to aggregate team data: total minutes per member this week, top category per member, entry count per member. Supervisors can only see data for users on their same team. Use Supabase RLS to enforce this. Include date range filtering (default: current week).

- [x] **5.3 Add export button placeholder** - Add "📥 Export Team Report" button at bottom of team page. For MVP, this shows a toast "Export coming soon" or generates a simple CSV download of the team's log entries for the selected period.

### Phase 6: PWA Setup

- [x] **6.1 Configure PWA manifest and service worker** - Install and configure `@ducanh2912/next-pwa` (or `next-pwa`). Create `public/manifest.json` with: name "MPL", short_name "MPL", theme_color "#0EA5E9", background_color "#F8FAFC", display "standalone", start_url "/", icons (generate 192x192 and 512x512 PNG icons with the letter "M" on blue background). Configure service worker for caching strategy. Add meta tags to layout: `<meta name="theme-color">`, `<link rel="manifest">`, `<meta name="apple-mobile-web-app-capable">`.

- [x] **6.2 Add install prompt** - Detect PWA installability via `beforeinstallprompt` event. Show a dismissible banner at top of the app: "Install MPL for quick access" with an "Install" button. Store dismissal in localStorage so it doesn't keep showing. Only show on mobile browsers that support PWA install.

### Phase 7: Polish & Testing

- [x] **7.1 Add loading states and error handling** - Add skeleton loading states for: category grid, history list, insights charts, team list. Add error boundaries with retry buttons. Add empty states for: no entries in history ("No entries yet - start logging!"), no insights data ("Log entries to see insights"), no team data.

- [x] **7.2 Mobile responsiveness pass** - Ensure all views work well at 320px-430px width. Test: category grid doesn't overflow, time chips wrap properly, history cards don't truncate important info, bottom nav has safe area padding, no horizontal scroll anywhere. Use Tailwind responsive utilities.

- [ ] **7.3 Add page transitions and micro-interactions** - Subtle animations: slide-up for step transitions in log flow, fade-in for toast notifications, press feedback on buttons (scale 0.97 on active), smooth progress bar fills on insights. Use CSS animations or Tailwind `transition` utilities. Keep it fast - no animation > 200ms.

- [ ] **7.4 Write tests** - Create tests using Vitest or Jest: (1) Unit tests for time formatting helpers, date grouping logic, and minutes calculation from timer. (2) Component tests for time chip selection behavior (chip select, custom input sync, chip deselect). (3) Integration test that the log flow state machine works: category → subtask → time → submit resets correctly. Minimum 10 test cases covering happy paths and edge cases.

## Design Reference

- Mobile-first, max-width 430px centered
- Font: system font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)
- Border radius: 12-16px for cards, 8-10px for inputs/chips
- Shadows: minimal, use borders instead (`#E2E8F0`)
- Timer: large monospace font, 48px
- Time chips: row of pill buttons, selected = blue fill + white text, unselected = white fill + border
- Badges: TIMER = green bg (`#ECFDF5`) + green text (`#065F46`), MANUAL = amber bg (`#FEF3C7`) + amber text (`#92400E`)
- CH badge: amber bg + amber text, MH badge: blue bg + blue text
- Success toast: green left-accent bar with checkmark

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

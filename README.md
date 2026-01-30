# SG Deal Tracker

A sales tracking tool for managing brand prospects across startup advisory relationships.

## Features

- **Authentication** - Email/password authentication with role-based access (Admin/Founder)
- **Dashboard** - Overview of pipeline stats, deal stages, and activity feed
- **Prospects Pipeline** - Track prospects through deal stages with inline stage editing
- **Products Management** - Manage product offerings and pricing
- **Materials Library** - Upload and version sales materials (decks, PDFs)
- **Invite System** - Admin can invite founders to their respective startups
- **Activity Logging** - Automatic tracking of all pipeline changes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API

### 2. Set up Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Database Migrations

Open the Supabase SQL Editor and run the migration file:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, triggers, and seeds the initial "Social Glass" startup.

### 4. Configure the First Admin User

After running migrations:

1. Sign up through the app
2. In Supabase, go to Table Editor > profiles
3. Update your user's `role` to `admin`

### 5. Install Dependencies and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── (auth)/           # Auth pages (login, signup, invite)
├── (dashboard)/      # Protected app routes
│   ├── dashboard/    # Main dashboard
│   ├── prospects/    # Prospects list + detail
│   ├── products/     # Products management
│   ├── materials/    # Materials library
│   └── settings/     # User/company settings
components/
├── layout/           # Sidebar, header
└── ui/               # shadcn/ui components
lib/
├── supabase/         # Supabase client helpers
└── types/            # TypeScript types
supabase/
└── migrations/       # Database migrations
```

## Deal Stages

1. Intro Made
2. Responded (Yes/No)
3. Meeting Scheduled
4. Demo Completed (Yes/No)
5. Proposal Sent
6. Closed Won
7. Closed Lost

## Deploying to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Future Considerations

- Multiple startups with company switcher
- Revenue forecasting
- Email/calendar integrations

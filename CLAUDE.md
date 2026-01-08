# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Diffit is a full-stack fitness and nutrition management application built with Next.js 14 (App Router), TypeScript, Prisma/PostgreSQL, and NextAuth.js. It serves two user types: **trainers** who create and manage training/nutrition plans, and **clients** who follow those plans and track their progress.

## Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm start                # Run production build
npm run lint             # Run ESLint

# Database (Prisma)
npm run db:generate      # Generate Prisma client (run after schema changes)
npm run db:migrate       # Run migrations (creates migration files)
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio GUI (localhost:5555)
npx prisma db push       # Sync schema without migrations (dev only)
npx prisma migrate reset # Reset database and re-run migrations
```

## Architecture Overview

### App Structure (Next.js 14 App Router)

The application uses **parallel route hierarchies** for the two user roles:

- **`/app/admin/*`** - Trainer dashboard (requires TRAINER role)
  - Protected by middleware checking `session.user.role === 'TRAINER'`
  - Manages clients, training plans, nutrition plans
  - Uses **Server Components** for data fetching with Prisma

- **`/app/dashboard/*`** - Client dashboard (requires CLIENT role)
  - Protected by middleware checking `session.user.role === 'CLIENT'`
  - Views assigned plans, tracks workouts/weight, uploads files
  - Uses **Server Components** for data fetching with Prisma

- **`/app/api/*`** - API Routes for mutations
  - Most read operations use Server Components directly with Prisma
  - API routes primarily for POST/PUT/DELETE operations and file uploads

### Server vs Client Components

**Critical pattern**: This app heavily uses **Server Components** for data fetching (Prisma queries) and **Client Components** only when needed for interactivity or client-side-only libraries.

**Common issue**: Libraries like Recharts (charts) only work in Client Components. When a page needs both Prisma queries AND interactive charts:

1. Keep the page as a Server Component with async data fetching
2. Create a separate Client Component (with `'use client'` directive) for the interactive parts
3. Pass serializable data as props from Server → Client Component

Example:
```typescript
// page.tsx (Server Component)
export default async function ClientDetailPage({ params }) {
  const client = await prisma.user.findFirst({ ... }) // Server-side query
  const weightData = client.weightEntry.map(...) // Prepare data

  return (
    <div>
      {/* Server-rendered content */}
      <ClientProgressCharts weightData={weightData} /> {/* Client Component */}
    </div>
  )
}

// ClientProgressCharts.tsx (Client Component)
'use client'
import { LineChart, ... } from 'recharts'

export default function ClientProgressCharts({ weightData }) {
  return <LineChart data={weightData}>...</LineChart>
}
```

### Authentication Flow

- **NextAuth.js** with JWT strategy (not database sessions)
- Authentication config: `src/lib/auth.ts`
- Custom types: `src/types/next-auth.d.ts` extends NextAuth types with `role` field
- Session includes: `{ user: { id, email, name, role } }`
- Access session in Server Components: `await getServerSession(authOptions)`
- Access session in Client Components: `useSession()` from `next-auth/react`

### Database Architecture (Prisma)

Key relationships to understand:

1. **User model** has self-referential relation for trainer-client:
   ```prisma
   clients   User[] @relation("TrainerClients")  // If TRAINER
   trainer   User?  @relation("TrainerClients")  // If CLIENT
   trainerId String?
   ```

2. **Training plan hierarchy** (cascading deletes):
   ```
   TrainingPlan → TrainingWeek → TrainingSession → Exercise
                                                  ↓
                                            WorkoutSession → ExerciseData
   ```

3. **Active plan pattern**: Models like `TrainingPlan` and `NutritionPlan` have `isActive` boolean. Only one plan per client should be active at a time (enforced in business logic, not DB).

4. **File storage**: The `File` model stores metadata, actual files go in `public/uploads/` (excluded from git via .gitignore).

### Data Fetching Patterns

**Server Components** (preferred for reads):
```typescript
// Direct Prisma queries in page.tsx
const clients = await prisma.user.findMany({
  where: { trainerId: session.user.id },
  include: { trainingPlan: true }
})
```

**API Routes** (for mutations):
```typescript
// POST /api/admin/training-plans
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  // Validate role, then mutate with Prisma
}
```

**Never** fetch from your own API routes in Server Components—just use Prisma directly.

## Common Workflows

### Adding a new page for trainers

1. Create file in `src/app/admin/[feature]/page.tsx`
2. Use Server Component with `getServerSession(authOptions)` to verify trainer role
3. Query Prisma directly for data
4. If you need client-side interactivity, extract to a separate Client Component
5. Add navigation link in `src/components/admin-nav.tsx`

### Adding a new API endpoint

1. Create file in `src/app/api/[feature]/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`
3. Always verify session and role at the start:
   ```typescript
   const session = await getServerSession(authOptions)
   if (!session || session.user.role !== 'TRAINER') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```
4. Use Prisma for database operations
5. Return `NextResponse.json({ ... })`

### Modifying the database schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma Client types
3. Run `npm run db:migrate` to create migration (will prompt for name)
4. Update `prisma/seed.ts` if needed for test data
5. TypeScript types are auto-generated—import from `@prisma/client`

### Working with dates

- Database stores `DateTime` (UTC)
- Use `date-fns` for formatting: `import { formatDate } from '@/lib/utils'`
- Current week logic: `TrainingWeek` has `startDate` and `endDate`, compare with `new Date()` to determine active week
- Display format: Spanish locale (`es-ES`) is used throughout the app

## Key Files Reference

- **`src/lib/auth.ts`** - NextAuth configuration (JWT strategy, credential provider)
- **`src/lib/prisma.ts`** - Singleton Prisma client instance
- **`src/lib/utils.ts`** - Utility functions (formatDate, formatWeight, cn for Tailwind)
- **`prisma/schema.prisma`** - Database schema definition
- **`prisma/seed.ts`** - Test data (creates trainer@diffit.com and cliente@diffit.com)

## Important Patterns & Conventions

### Role-based access control

Always check role at the start of pages and API routes:
```typescript
if (session.user.role !== 'TRAINER') {
  redirect('/dashboard') // or return 401
}
```

### Cascading deletes

Most relations use `onDelete: Cascade` in schema. Deleting a `TrainingPlan` automatically deletes all associated weeks, sessions, and exercises.

### File uploads

Files go to `public/uploads/` directory. The `File` model stores:
- `url`: Path relative to public (e.g., `/uploads/photo.jpg`)
- `name`: Original filename
- `type`: Enum (IMAGE, PDF, VIDEO, DOCUMENT)
- `userId`: Owner

### Current week detection

Training weeks have `startDate` and `endDate`. To find current week:
```typescript
const currentWeek = plan.weeks.find(week =>
  new Date() >= new Date(week.startDate) &&
  new Date() <= new Date(week.endDate)
)
```

Future weeks should be locked/disabled in the UI.

## Environment Variables

Required in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/diffit"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

## Test Credentials (after seed)

- Trainer: `trainer@diffit.com` / `password123`
- Client: `cliente@diffit.com` / `password123`

## Troubleshooting

**"Module not found: next-auth"**: Clear `.next` folder and reinstall:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

**"Super expression must either be null or a function"**: Likely mixing Server/Client components incorrectly. Check that Recharts or other client-only libraries are in `'use client'` components.

**Database connection timeout**: Check PostgreSQL is running and DATABASE_URL is correct. Try `npx prisma db push` instead of migrate if locked.

**Prisma Client out of sync**: Run `npm run db:generate` after schema changes.

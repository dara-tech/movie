# Next.js Migration Plan for Movie Streaming App

## Current Structure Analysis

### Your Current App:
- **Framework**: Create React App
- **Routing**: React Router
- **State**: Context API (Auth, Toast)
- **Components**: 30+ components
- **Authentication**: Protected routes
- **API**: External backend server
- **Styling**: Tailwind CSS

### Key Features to Migrate:
1. Movie/TV Show listings
2. Movie/TV Show detail pages (with SSR for OG tags)
3. Authentication & protected routes
4. Watchlist & History
5. Admin panel
6. Search functionality
7. Player components

## Migration Strategy

### Phase 1: Setup Next.js Project
```bash
npx create-next-app@latest client-nextjs --typescript --tailwind --app
```

### Phase 2: Project Structure
```
client-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── movies/
│   │   │   └── [id]/
│   │   ├── tvshows/
│   │   │   └── [id]/
│   │   ├── watchlist/
│   │   ├── history/
│   │   ├── search/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/
│   │   └── [...rest]/ (proxy to backend)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── (same as current)
│   └── server/ (server components)
├── lib/
│   ├── api.ts
│   └── utils.ts
└── context/
    ├── AuthContext.tsx
    └── ToastContext.tsx
```

### Phase 3: Key Changes

#### 1. Routing Migration
**From React Router:**
```jsx
<Route path="/movie/:id" element={<MovieDetailPage />} />
```

**To Next.js:**
```jsx
// app/(protected)/movies/[id]/page.tsx
export default function MoviePage({ params }) {
  // SSR data fetching
}
```

#### 2. SSR for Movie Pages
```typescript
// app/(protected)/movies/[id]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const movie = await fetchMovie(params.id)
  
  return {
    title: `${movie.title} (${movie.year}) | MovieStream`,
    description: movie.overview,
    openGraph: {
      title: `${movie.title} (${movie.year})`,
      description: movie.overview,
      images: [`https://image.tmdb.org/t/p/w1280${movie.backdropPath}`],
    }
  }
}

export default async function MoviePage({ params }) {
  const movie = await fetchMovie(params.id)
  
  return <MovieDetailContent movie={movie} />
}
```

#### 3. Protected Routes
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

#### 4. API Proxy
```typescript
// app/api/[...rest]/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  
  const res = await fetch(`${process.env.BACKEND_URL}/api/${path}`)
  return new Response(res.body)
}
```

## Step-by-Step Implementation

### Step 1: Create Next.js Project
- Install Next.js
- Copy components
- Set up Tailwind
- Configure TypeScript

### Step 2: Migrate Layouts
- Root layout with providers
- Auth layout
- Protected layout
- Admin layout

### Step 3: Migrate Pages
- Landing page (public)
- Login/Register (public)
- Dashboard (protected)
- Movies list (protected)
- Movie detail with SSR (protected)
- TV Shows (protected)
- Watchlist (protected)
- History (protected)
- Search (protected)
- Admin panel (protected)

### Step 4: Implement SSR
- Movie detail page with SSR
- TV Show detail page with SSR
- Dynamic meta tags
- OpenGraph tags

### Step 5: Authentication
- Middleware for protected routes
- Auth context integration
- Cookie handling

### Step 6: Deploy
- Configure for Netlify
- Set up environment variables
- Deploy and test

## Benefits After Migration

### Performance:
✅ **Initial Load**: 0.5-1s (vs 3-4s)
✅ **SEO**: Perfect scores
✅ **Social Sharing**: Dynamic OG tags work
✅ **Code Splitting**: Automatic

### Features:
✅ **SSR**: Server-side rendering
✅ **Static Generation**: For popular content
✅ **API Routes**: Built-in
✅ **Image Optimization**: Automatic

## Timeline Estimate

- **Setup**: 30 minutes
- **Component Migration**: 2-3 hours
- **SSR Implementation**: 1-2 hours
- **Auth Setup**: 1 hour
- **Testing**: 1 hour
- **Deployment**: 30 minutes

**Total**: ~6-8 hours

## Ready to Start?

I'll guide you through the migration step by step. Let's begin! 🚀

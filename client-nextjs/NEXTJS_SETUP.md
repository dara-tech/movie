# Next.js Movie App Setup

## Environment Variables

Create a `.env.local` file in the `client-nextjs` directory with:

```env
# API Configuration
API_URL=http://localhost:5001
NEXT_PUBLIC_API_URL=http://localhost:5001

# Site URL
NEXT_PUBLIC_SITE_URL=https://visionary-lebkuchen-a7e181.netlify.app

# TMDB API (if needed)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_key_here
```

## What's Implemented

### ✅ Movie Detail Page with SSR
- Server-Side Rendering for movie pages
- Dynamic OpenGraph meta tags
- JSON-LD structured data
- Twitter Card support
- Automatic SEO optimization

### ✅ Benefits
- ✅ Perfect OpenGraph tags (dynamic per movie)
- ✅ Fast initial load (SSR)
- ✅ Perfect SEO
- ✅ Social media previews work!
- ✅ Search engine indexing

## Run the App

```bash
cd client-nextjs
npm run dev
```

Visit: `http://localhost:3000/movie/[movie-id]`

## Test OpenGraph

Use Facebook Debugger:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://your-domain.com/movie/[movie-id]`
3. See perfect meta tags!

## Next Steps

1. Add more pages (TV shows, etc.)
2. Add authentication
3. Add remaining components
4. Deploy to Netlify

## File Structure

```
client-nextjs/
├── app/
│   └── movie/
│       └── [id]/
│           └── page.tsx (SSR with OG tags)
├── services/
│   └── api.ts
└── NEXTJS_SETUP.md
```

# OpenGraph Meta Tags Not Showing - Quick Fix Guide

## Problem
The OpenGraph meta tags (title, image, description) are not appearing when you share movie/TV show links on social media.

## Root Cause
Your React app uses **client-side routing**, which means:
- Meta tags are added by JavaScript (React Helmet)
- Social media crawlers **don't execute JavaScript**
- They only see the static HTML from `index.html`
- Result: No dynamic meta tags! ❌

## Immediate Solution

### Step 1: Enable Netlify Prerendering

**Option A: Via Netlify Dashboard (Easiest)**
1. Go to: https://app.netlify.com/
2. Select your site: `visionary-lebkuchen-a7e181`
3. Go to: **Site settings** → **Build & deploy** → **Post processing**
4. Enable: **"Prerendering"**
5. Add patterns to prerender:
   - `/movie/*`
   - `/tvshow/*`
6. Save changes

**Option B: Via netlify.toml (Already done)**
The `netlify.toml` file has been updated with prerendering configuration.

### Step 2: Rebuild and Deploy

```bash
cd client
npm run build
```

Then commit and push to trigger a new Netlify deployment.

### Step 3: Clear Social Media Cache

After deployment, clear the cache for your URLs:

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Enter your URL: `https://visionary-lebkuchen-a7e181.netlify.app/movie/68fc58bdd4afa091954846af`
   - Click "Debug"
   - Click "Scrape Again"

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter your URL and validate

### Step 4: Test

Share your URL on Facebook/Twitter and you should now see:
- ✅ Correct title
- ✅ Movie poster image
- ✅ Description

## Alternative Solution: Server-Side Rendering (SSR)

For a production-ready solution, consider migrating to **Next.js**:

### Benefits:
- ✅ Built-in SSR support
- ✅ Automatic OpenGraph meta tags
- ✅ Better SEO
- ✅ Faster initial page loads

### Migration Guide:
1. Install Next.js: `npx create-next-app@latest`
2. Move components to Next.js structure
3. Use `next/head` for meta tags
4. Deploy to Netlify (Next.js is supported!)

## Current Implementation Status

✅ **Completed:**
- React Helmet integration
- OpenGraph meta tag generation
- JSON-LD structured data
- Dynamic meta tags in components
- Default meta tags in index.html

⏳ **Needs Deployment:**
- Netlify prerendering configuration
- Social media cache clearing
- Testing with actual URLs

## Verification Checklist

After deployment, verify:
- [ ] View page source shows meta tags in `<head>`
- [ ] Facebook Debugger shows correct title/image
- [ ] Twitter Validator shows correct card
- [ ] Sharing on social media shows preview
- [ ] Image loads correctly (absolute URLs)

## Support

If issues persist:
1. Check Netlify deployment logs
2. Verify URL patterns in prerendering config
3. Test with OpenGraph Debugger: https://www.opengraph.xyz/
4. Contact Netlify support: https://answers.netlify.com/


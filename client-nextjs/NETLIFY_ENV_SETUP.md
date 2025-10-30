# Netlify Environment Variables Setup

## Required Environment Variables

Your Next.js app needs these environment variables set in Netlify:

### Step 1: Go to Netlify Dashboard
1. Visit: https://app.netlify.com
2. Find your site: **pagerender.netlify.app**
3. Click **Site settings**

### Step 2: Add Environment Variables
Go to **Build & Deploy** → **Environment variables**

Add these variables:

```
NEXT_PUBLIC_API_URL=https://movie-7zq4.onrender.com
NEXT_PUBLIC_SITE_URL=https://pagerender.netlify.app
```

### Step 3: Redeploy
After adding variables, trigger a new deploy:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete

### Step 4: Test
Visit a movie page and verify it loads correctly!

---

## Current Issue

If you see "Error: Load failed", it's because:
- `NEXT_PUBLIC_API_URL` is not set in Netlify
- The app is trying to fetch from `http://localhost:5001` (incorrect)

After setting the environment variables above, the error will be fixed!

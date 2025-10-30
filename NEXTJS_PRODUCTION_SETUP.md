# Next.js Production Setup - Same Domain Solution

## 🎯 Goal: Use Next.js OG Tags on Same URL

To use Next.js OpenGraph tags while keeping the same URL, you have two options:

## Option 1: Two Netlify Deployments (Easiest)

### Setup:
1. **Deploy React app** to: `https://visionary-lebkuchen-a7e181.netlify.app`
2. **Deploy Next.js** to: `https://your-nextjs-app.netlify.app` (new deployment)

### How it works:
- Users stay on React app for most features
- When clicking movie card → redirects to Next.js URL
- Next.js shows perfect OG tags

### Pros:
- ✅ Works immediately
- ✅ Perfect OG tags
- ✅ No conflicts

### Cons:
- ⚠️ Two deployments
- ⚠️ Different URL for movies

## Option 2: Netlify Functions (Advanced)

Use Netlify Edge Functions to handle movie routes with SSR.

### Pros:
- ✅ Same URL
- ✅ Perfect OG tags

### Cons:
- ⚠️ Complex setup
- ⚠️ Requires serverless functions

## 🚀 Quick Deployment Steps (Option 1)

### Step 1: Deploy Next.js to Netlify

1. **Go to Netlify**: https://app.netlify.com
2. **Add new site** → Import `client-nextjs` folder
3. **Configure**:
   - Build command: `npm run build`
   - Publish: `.next`
4. **Add environment variables**:
   ```
   NEXT_PUBLIC_API_URL=https://movie-7zq4.onrender.com
   ```
5. **Deploy** and copy the URL (e.g., `https://amazing-app-123.netlify.app`)

### Step 2: Update React App

1. **In React app Netlify settings**, add env var:
   ```
   REACT_APP_NEXTJS_URL=https://amazing-app-123.netlify.app
   ```

2. **Redeploy** React app

### Step 3: Test

1. Visit React app
2. Click movie card
3. Opens Next.js with perfect OG tags!

## 🎯 Current Configuration

**MovieCard.tsx** is set to:
- Development: `http://localhost:3001`
- Production: Use `REACT_APP_NEXTJS_URL` env var

**Backend CORS** allows:
- All `*.netlify.app` domains

## ✅ Ready to Deploy!

Just follow the steps above and you'll have:
- ✅ React app working
- ✅ Next.js with perfect OG tags
- ✅ Movie-specific social sharing!

---

**Deploy Next.js to Netlify first, then update React app with the Next.js URL!** 🚀

# ⚡ Deploy Next.js to Netlify NOW

## 🎯 Quick Steps (5 minutes)

### Step 1: Build Locally (Optional but Recommended)

```bash
cd client-nextjs
npm install
npm run build
```

### Step 2: Deploy to Netlify

**Option A: Via Netlify UI**
1. Go to: https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. **IMPORTANT**: Set "Base directory" to `client-nextjs`
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://movie-7zq4.onrender.com`
6. Click "Deploy site"

**Option B: Via Netlify CLI**
```bash
npm install -g netlify-cli
cd client-nextjs
netlify deploy --prod
```
Follow the prompts to create a new site.

### Step 3: Set Environment Variables

After deployment, go to your Netlify site:
1. Site settings → Environment variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://movie-7zq4.onrender.com
   ```
3. Trigger redeploy

### Step 4: Copy Your URL

Your Next.js app URL will look like:
- `https://amazing-nextjs-app-123.netlify.app`

### Step 5: Update React App

1. Go to your **React app's** Netlify dashboard
2. Site settings → Environment variables
3. Add:
   ```
   REACT_APP_NEXTJS_URL=https://amazing-nextjs-app-123.netlify.app
   ```
4. Trigger redeploy

### Step 6: Test!

1. Visit your React app
2. Click any movie card
3. Should redirect to Next.js with perfect OG tags! 🎉

---

## 🎊 Done!

Your movies now have perfect OpenGraph tags for social sharing!

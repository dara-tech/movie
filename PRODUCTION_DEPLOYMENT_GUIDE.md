# Production Deployment Guide - Netlify

## 🚀 How to Deploy Both Apps to Netlify

### Architecture

```
React App: https://visionary-lebkuchen-a7e181.netlify.app
Next.js App: https://your-nextjs-app.netlify.app (separate deployment)
Backend: https://movie-7zq4.onrender.com
```

## 📋 Pre-Deployment Checklist

### 1. Backend CORS Setup ✅
Already configured in `server/index.js`:
- Allows localhost:3000 (React)
- Allows localhost:3001 (Next.js dev)
- Allows your Netlify domains
- Allows all *.netlify.app

### 2. Environment Variables Needed

#### React App (.env in client/):
```env
REACT_APP_API_URL=https://movie-7zq4.onrender.com
REACT_APP_NEXTJS_URL=https://your-nextjs-app.netlify.app
NODE_ENV=production
```

#### Next.js (.env in client-nextjs/):
```env
NEXT_PUBLIC_API_URL=https://movie-7zq4.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-nextjs-app.netlify.app
NODE_ENV=production
```

#### Backend (server/.env):
```env
CLIENT_URL=https://visionary-lebkuchen-a7e181.netlify.app
```

## 🔧 Deployment Steps

### Step 1: Deploy Next.js App

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to Git** (GitHub/GitLab) or drag & drop `client-nextjs` folder
4. **Configure build settings**:
   - **Base directory**: `client-nextjs`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. **Add environment variables**:
   ```
   NEXT_PUBLIC_API_URL=https://movie-7zq4.onrender.com
   NEXT_PUBLIC_SITE_URL=https://your-nextjs-app.netlify.app
   ```
6. **Deploy**

Your Next.js app will get a URL like: `https://your-nextjs-app.netlify.app`

### Step 2: Update React App Environment

1. **In your React app's Netlify settings**:
2. **Add environment variable**:
   ```
   REACT_APP_NEXTJS_URL=https://your-nextjs-app.netlify.app
   ```
3. **Redeploy** the React app

### Step 3: Update Backend CORS (If Needed)

If you deploy Next.js to a new URL, add it to backend CORS:
```javascript
// server/index.js
origin: [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://visionary-lebkuchen-a7e181.netlify.app",
  "https://your-nextjs-app.netlify.app", // Add this!
  "https://*.netlify.app"
]
```

## 🧪 Testing in Production

### 1. Test React App
- Go to: https://visionary-lebkuchen-a7e181.netlify.app
- Click a movie card
- Should navigate to Next.js app

### 2. Test Next.js App
- Go to: https://your-nextjs-app.netlify.app/movie/[some-id]
- Should show movie with OG tags
- Check page source for meta tags

### 3. Test OG Tags
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Enter: https://your-nextjs-app.netlify.app/movie/[id]
- Should show perfect OG tags!

## 📝 Quick Reference

### Development URLs:
- React: http://localhost:3000
- Next.js: http://localhost:3001
- Backend: http://localhost:5001

### Production URLs:
- React: https://visionary-lebkuchen-a7e181.netlify.app
- Next.js: https://your-nextjs-app.netlify.app (after deployment)
- Backend: https://movie-7zq4.onrender.com

## ✅ Production Checklist

- [ ] Deploy Next.js to Netlify
- [ ] Get Next.js URL
- [ ] Update React app env variable: `REACT_APP_NEXTJS_URL`
- [ ] Redeploy React app
- [ ] Update backend CORS with Next.js URL
- [ ] Test movie card click
- [ ] Test OG tags with Facebook Debugger
- [ ] Verify social sharing works

## 🎯 Alternative: Deploy Next.js as Netlify Function

If you want both apps on same domain:

1. Create Netlify function for movie pages
2. Point `/movie/*` to Next.js function
3. Keep React app for everything else

This requires more setup but keeps everything on one domain.

---

**After deployment, update the Next.js URL in your React app environment variables!** 🚀

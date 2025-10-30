# 🚀 Deploy Next.js to Netlify - Step by Step

## Quick Deploy via Netlify Dashboard

### Method 1: Connect to Git (Recommended)

1. **Go to Netlify**: https://app.netlify.com
2. **Add new site** → "Import an existing project"
3. **Connect to Git**:
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository
   - **Base directory**: Select `client-nextjs` folder
   - Click "Deploy site"

4. **Configure Build Settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `.next`
   
5. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://movie-7zq4.onrender.com
   NEXT_PUBLIC_SITE_URL=https://your-app-name.netlify.app
   ```

6. **Deploy**! The site will auto-deploy

---

### Method 2: Manual Deploy (Drag & Drop)

1. **Build locally**:
   ```bash
   cd client-nextjs
   npm run build
   ```

2. **Go to Netlify**: https://app.netlify.com
3. **Add new site** → "Deploy manually"
4. **Drag & drop** the `.next` folder
5. **Add environment variables** (after deployment):
   - Site settings → Environment variables
   - Add the variables from step 5 above

---

## After Deployment

### 1. Copy Your Next.js URL
Your Next.js app will have a URL like:
- `https://amazing-app-123.netlify.app`

### 2. Update React App

Go to your **React app's Netlify**:
1. Site settings → Environment variables
2. Add: `REACT_APP_NEXTJS_URL=https://amazing-app-123.netlify.app`
3. Trigger redeploy (Deploys → Trigger deploy)

### 3. Test!

1. Visit your React app
2. Click a movie card
3. Should open Next.js URL with perfect OG tags!

---

## Troubleshooting

### Build Fails

**Error**: `Module not found`
- **Fix**: Make sure you're in `client-nextjs` directory when deploying

**Error**: `next.config.ts error`
- **Fix**: Check `next.config.ts` syntax

### 404 on Movie Pages

**Error**: Movie pages return 404
- **Fix**: Make sure `@netlify/plugin-nextjs` is in `netlify.toml`
- **Fix**: Check environment variables are set

### CORS Error

**Error**: Cannot fetch from API
- **Fix**: Add Next.js URL to backend CORS:
  ```js
  origin: ['https://your-nextjs-app.netlify.app']
  ```

---

## 📋 Quick Checklist

- [ ] Next.js deployed to Netlify
- [ ] Environment variables added (API_URL, SITE_URL)
- [ ] Next.js URL copied
- [ ] React app updated with NEXTJS_URL
- [ ] React app redeployed
- [ ] Test movie card click
- [ ] Test OG tags (use Facebook Debugger)

---

## 🎉 Success!

Once deployed, your movies will have perfect OpenGraph tags thanks to Next.js SSR!

# 🖥️ Deploy Next.js via Netlify CLI

## Quick Deploy from Terminal

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Login to Netlify

```bash
netlify login
```

This will open your browser to authenticate.

### 3. Navigate to Next.js Project

```bash
cd client-nextjs
```

### 4. Initialize Netlify (First Time Only)

```bash
netlify init
```

Follow the prompts:
- Create & configure a new site
- Set build command: `npm run build`
- Set publish directory: `.next`
- Choose your team
- Give it a name (e.g., "movie-nextjs")

### 5. Add Environment Variables

```bash
netlify env:set NEXT_PUBLIC_API_URL https://movie-7zq4.onrender.com
```

### 6. Deploy!

```bash
netlify deploy --prod
```

### 7. Get Your URL

After deployment, Netlify will show your site URL:
```
Website URL: https://amazing-site-123.netlify.app
```

### 8. Copy This URL!

Copy the URL above and use it in your React app's environment variables.

---

## Future Updates

After the initial setup, just run:
```bash
netlify deploy --prod
```

to redeploy when you make changes.

---

## Troubleshooting

**Build failed?**
```bash
npm run build
```
Test locally first.

**Can't find site?**
```bash
netlify status
```
Shows your current site info.

**Reset everything?**
```bash
rm -rf .netlify
netlify init
```

---

## 🎉 Done!

Your Next.js app is now live on Netlify!

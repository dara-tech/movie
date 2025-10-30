# 🚀 Deploy Backend Changes to Render

## Current Issue: CORS Error

The Next.js app is being blocked by CORS because the backend needs to be updated.

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

If your Render service is connected to GitHub with auto-deploy:

1. ✅ Changes are already pushed to GitHub (done!)
2. Render will automatically detect the push
3. It will rebuild and deploy the backend
4. Wait 2-3 minutes for deployment to complete
5. Test your Next.js app again

### Option 2: Manual Deployment

If auto-deploy is disabled:

1. Go to: https://dashboard.render.com
2. Find your backend service (likely named "movie" or similar)
3. Click **Manual Deploy**
4. Select **Deploy latest commit**
5. Wait for deployment to complete

## Verify CORS Fix

After deployment, test:

```bash
curl -H "Origin: https://pagerender.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://movie-7zq4.onrender.com/api/health
```

You should see headers like:
```
Access-Control-Allow-Origin: https://pagerender.netlify.app
```

## Expected Result

✅ Next.js app at `https://pagerender.netlify.app` can now fetch data from the backend
✅ Movie pages will load successfully
✅ OpenGraph tags will work perfectly!

---

**Time to fix**: 2-3 minutes after Render deployment completes

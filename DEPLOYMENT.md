# Deployment Configuration

## Server (Railway)
Your server is deployed at: `https://pirate-bananagrams-production.up.railway.app`

## Client (Next: Deploy to Vercel)

### Step 1: Push Updated Code to GitHub
```bash
git add .
git commit -m "Configure for Railway deployment"
git push
```

### Step 2: Deploy Client to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo: `pirate-bananagrams`
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables** (IMPORTANT):
   - Variable: `VITE_SERVER_URL`
   - Value: `https://pirate-bananagrams-production.up.railway.app`

6. Click "Deploy"

### Step 3: Update Railway CORS (After Vercel Deployment)

Once Vercel gives you your URL (like `https://pirate-bananagrams.vercel.app`), you'll need to push one more update to add it to CORS.

## Environment Variables

### For Local Development:
Create `client/.env.local` (gitignored):
```
VITE_SERVER_URL=http://localhost:3001
```

### For Production (Set in Vercel Dashboard):
```
VITE_SERVER_URL=https://pirate-bananagrams-production.up.railway.app
```

## Current Configuration

✅ **Server CORS**: Allows localhost + Vercel domains
✅ **Client**: Uses Railway URL by default, falls back to env variable
✅ **Port**: Railway uses PORT environment variable (you set to 8080)

## Testing

Once both are deployed:
1. Visit your Vercel URL
2. It should connect to your Railway server
3. Create a room and test the game!


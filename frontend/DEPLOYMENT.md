# Vercel Deployment Guide

## Setup Instructions

1. **Vercel Project Configuration:**

   - Framework Preset: **Vite**
   - Root Directory: `frontend` (if deploying from monorepo) or `.` (if deploying frontend folder separately)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Environment Variables:**
   Make sure to add the following environment variables in Vercel:

   - `VITE_API_URL` - Your backend API URL
   - `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key

3. **Routing:**
   The `vercel.json` file handles client-side routing for the React Router SPA.
   All routes except static assets will be rewritten to `/index.html`.

## Troubleshooting

### 404 Errors on Routes (e.g., /map)

- ✅ Fixed by `vercel.json` rewrite rules
- Make sure `vercel.json` is in the deployment root (frontend folder)

### 401 Errors on Static Assets

- This might be a Vercel project setting
- Check Vercel Dashboard → Project Settings → Security
- Ensure "Vercel Authentication" is disabled for public routes
- Verify the file exists in `public/` folder and is being copied to `dist/` during build

### Favicon Not Loading

- The favicon is set to `/Gemini_Generated_Image_lk7w0olk7w0olk7w.png`
- Verify the file exists in `public/` folder
- Check browser console for exact error message
- Try accessing the file directly: `https://your-domain.vercel.app/Gemini_Generated_Image_lk7w0olk7w0olk7w.png`

## Build Verification

After deployment, verify:

1. ✅ Homepage loads at `/`
2. ✅ Map page loads at `/map`
3. ✅ AR page loads at `/ar`
4. ✅ AI Assistant loads at `/ai-chat`
5. ✅ Static assets (images, favicon) load correctly
6. ✅ Client-side navigation works (no page refreshes on route changes)

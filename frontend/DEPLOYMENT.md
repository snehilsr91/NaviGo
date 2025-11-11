# Vercel Deployment Guide

## Setup Instructions

1. **Vercel Project Configuration:**

   - Framework Preset: **Vite**
   - Root Directory: `frontend` (if deploying from monorepo) or `.` (if deploying frontend folder separately)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Environment Variables:**
   Make sure to add the following environment variables in Vercel (Settings → Environment Variables):

   - `VITE_API_URL` - **REQUIRED** Your backend API URL (e.g., `https://your-backend.railway.app/api` or `https://your-backend.herokuapp.com/api`)
     - ⚠️ **IMPORTANT**: This MUST be set in production, otherwise API calls will fail!
     - The URL should point to your deployed backend server
     - Make sure it includes the `/api` suffix if your backend routes are mounted at `/api`
     - No trailing slashes!
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

### API Calls Failing / 404 on Reviews and Photos

**This is the most common issue when deploying!**

1. **Check VITE_API_URL is set:**

   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `VITE_API_URL` is set for Production, Preview, and Development
   - The value should be your backend URL (e.g., `https://your-backend.railway.app/api`)
   - Make sure there are no trailing slashes
   - **Redeploy after adding/changing environment variables!**

2. **Verify Backend is Deployed and Accessible:**

   - Test your backend API directly: `https://your-backend-url/api/buildings/boys-hostel/reviews`
   - Should return JSON (empty array `[]` if no reviews, or array of reviews)
   - Check backend logs to see if requests are arriving
   - Make sure backend CORS allows requests from your Vercel domain

3. **Check Browser Console:**

   - Open browser DevTools → Console
   - Look for errors like:
     - `❌ VITE_API_URL is not set!` → Set the environment variable in Vercel
     - `❌ API Error: No response from server` → Backend is not accessible or URL is wrong
     - `❌ API Error: 404` → Check if the endpoint URL is correct
   - Check Network tab to see the actual API request and response
   - Look for the actual API URL being called

4. **Verify Building IDs Match:**

   - Building IDs in `frontend/src/data/buildings.js` must match what's stored in the database
   - IDs are case-sensitive (e.g., `boys-hostel` not `Boys-Hostel`)
   - Check backend logs to see what `buildingId` is being requested

5. **Network Timeout:**
   - API calls have a 10-second timeout
   - If your backend is slow, check backend response times
   - Check if backend is responding quickly enough

## Build Verification

After deployment, verify:

1. ✅ Homepage loads at `/`
2. ✅ Map page loads at `/map`
3. ✅ AR page loads at `/ar`
4. ✅ AI Assistant loads at `/ai-chat`
5. ✅ Static assets (images, favicon) load correctly
6. ✅ Client-side navigation works (no page refreshes on route changes)

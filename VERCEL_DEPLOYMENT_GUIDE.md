# Vercel Deployment Guide for NaviGo

## 🚀 Deployment Overview

NaviGo consists of **two separate Vercel projects**:
1. **Frontend** (React SPA with Vite)
2. **Backend** (Node.js Express API as serverless functions)

---

## 📦 Deploy Backend First

### Step 1: Create Backend Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. **Change Root Directory**: `backend`
5. **Framework Preset**: Other
6. **Build Command**: Leave empty (not needed for serverless)
7. **Output Directory**: Leave empty
8. **Install Command**: `npm install`

### Step 2: Configure Backend Environment Variables

Add these environment variables in Vercel Project Settings:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

### Step 3: Deploy Backend

Click **"Deploy"** and wait for deployment to complete.

**Copy the Backend URL** (e.g., `https://navi-go-backend.vercel.app`)

---

## 🎨 Deploy Frontend Second

### Step 1: Create Frontend Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import the **same** GitHub repository (or create a new import)
4. **Change Root Directory**: `frontend`
5. **Framework Preset**: Vite
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. **Install Command**: `npm install`

### Step 2: Configure Frontend Environment Variables

Add this environment variable in Vercel Project Settings:

```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

**Important**: Replace `your-backend-url.vercel.app` with your actual backend URL from Step 3 of backend deployment.

### Step 3: Deploy Frontend

Click **"Deploy"** and wait for deployment to complete.

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Frontend 404 on Routes (e.g., `/map`, `/ar`)

**Cause**: SPA routing not configured properly
**Solution**: ✅ Already fixed in `frontend/vercel.json` with rewrites

### Issue 2: Backend 404 on Root `/`

**Cause**: No root route handler
**Solution**: ✅ Already fixed in `backend/src/app.js` with health check endpoints

### Issue 3: CORS Errors

**Cause**: Backend CORS not allowing frontend domain
**Solution**: Backend already has `cors({ origin: "*" })` enabled

### Issue 4: API Calls Failing

**Cause**: `VITE_API_URL` not set or incorrect
**Solution**: 
1. Go to Frontend Project → Settings → Environment Variables
2. Add `VITE_API_URL` with your backend URL + `/api`
3. Redeploy frontend

### Issue 5: MongoDB Connection Errors

**Cause**: `MONGODB_URI` not set or incorrect
**Solution**:
1. Go to Backend Project → Settings → Environment Variables
2. Add `MONGODB_URI` with your MongoDB connection string
3. Redeploy backend

---

## 📝 Verification Steps

### After Frontend Deployment:

1. Visit your frontend URL: `https://your-frontend.vercel.app`
2. Test all routes:
   - `/` - Home page ✅
   - `/map` - Map page ✅
   - `/ar` - AR page ✅
   - `/find-teacher` - Find teacher page ✅
   - `/ai-chat` - AI chat page ✅

### After Backend Deployment:

1. Visit your backend URL: `https://your-backend.vercel.app`
   - Should see: `{"status":"ok","message":"NaviGo Backend API is running"}`

2. Test health endpoint: `https://your-backend.vercel.app/health`
   - Should see: `{"status":"healthy","uptime":...}`

3. Test API endpoints:
   - `https://your-backend.vercel.app/api/teachers/list` ✅
   - `https://your-backend.vercel.app/api/teachers/find?teacher=TeacherName` ✅
   - `https://your-backend.vercel.app/api/assistant/ask?q=test` ✅

---

## 🔄 Redeployment

### To Redeploy Backend:
1. Push changes to GitHub
2. Vercel will auto-deploy from the `backend` directory

### To Redeploy Frontend:
1. Push changes to GitHub  
2. Vercel will auto-deploy from the `frontend` directory

---

## 🆘 Still Having Issues?

### Check Vercel Logs:

1. Go to your project in Vercel Dashboard
2. Click on the latest deployment
3. Click "Functions" tab to see serverless function logs
4. Look for errors and warnings

### Common Fixes:

1. **Clear Vercel Cache**: Redeploy with "Redeploy without cache"
2. **Verify Environment Variables**: Check all env vars are set correctly
3. **Check Build Logs**: Look for build errors in deployment logs
4. **Test Locally First**: Run `npm run build` locally to catch errors early

---

## 📞 URLs to Remember

- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://your-backend.vercel.app
- **Backend API Base**: https://your-backend.vercel.app/api

Remember to update `VITE_API_URL` in frontend whenever backend URL changes!


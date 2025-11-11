# Backend Deployment Guide for Vercel

## Important Setup Steps

### 1. Vercel Project Configuration

When creating/editing your backend project in Vercel:

1. **Root Directory**: Set to `backend`
   - Go to Vercel Dashboard → Your Project → Settings → General
   - Under "Root Directory", set it to `backend`
   - This tells Vercel to use the `backend` folder as the project root

2. **Framework Preset**: None (or Node.js)
   - Vercel will auto-detect Node.js

3. **Build Command**: Leave empty (Vercel doesn't need to build Node.js)
   - Or set to: `npm install` (if you want to be explicit)

4. **Output Directory**: Leave empty (not needed for serverless functions)

5. **Install Command**: `npm install` (default)

### 2. Environment Variables

Add these environment variables in Vercel (Settings → Environment Variables):

- `MONGODB_URI` - Your MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/navigo`
  - Or: `mongodb://localhost:27017/navigo` (for local MongoDB)
- `NODE_ENV` - Set to `production`
- Any other environment variables your backend needs

### 3. File Structure

The backend deployment uses:
- `backend/vercel.json` - Vercel configuration
- `backend/api/index.js` - Serverless function entry point
- `backend/src/app.js` - Express app
- `backend/package.json` - Dependencies

### 4. How It Works

- Vercel converts your Express app into serverless functions
- All routes are handled by `api/index.js`
- MongoDB connection is managed in the serverless function
- The function is reused across requests (warm starts)

## Troubleshooting

### Error: "cd frontend: No such file or directory"

**Solution**: Make sure you've set the **Root Directory** to `backend` in Vercel project settings.

1. Go to Vercel Dashboard → Your Backend Project → Settings → General
2. Scroll to "Root Directory"
3. Set it to: `backend`
4. Save and redeploy

### MongoDB Connection Issues

- Make sure `MONGODB_URI` environment variable is set correctly
- For MongoDB Atlas, ensure your IP is whitelisted (or use `0.0.0.0/0` for all IPs)
- Check MongoDB connection string format
- Verify network access in MongoDB Atlas

### Routes Not Working

- All API routes should be prefixed with `/api`
- Example: `/api/buildings/boys-hostel/reviews`
- Make sure CORS is configured correctly in `src/app.js`

### Cold Start Issues

- First request after inactivity may be slow (cold start)
- Subsequent requests are faster (warm start)
- Consider using Vercel Pro for better cold start performance

## Alternative: Deploy to Railway/Render

If you prefer a traditional server deployment (not serverless):

1. **Railway**: Better for traditional Node.js servers
   - Connect your GitHub repo
   - Set root directory to `backend`
   - Railway will detect Node.js and deploy automatically

2. **Render**: Similar to Railway
   - Connect GitHub repo
   - Set root directory to `backend`
   - Use `npm start` or create a start script

For Railway/Render, you can use the original `src/server.js` file instead of the serverless function.


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

- `MONGODB_URI` - **REQUIRED** Your MongoDB connection string
  - **For MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/navigo?retryWrites=true&w=majority`
    - Replace `username`, `password`, `cluster`, and `navigo` with your actual values
    - Make sure to URL-encode special characters in username/password
  - **For Local MongoDB**: `mongodb://localhost:27017/navigo` (won't work on Vercel, only for local dev)
  - **⚠️ IMPORTANT**: 
    - MongoDB Atlas IP Whitelist must include `0.0.0.0/0` (allow all IPs) OR
    - Add Vercel's IP ranges (not recommended, as they change)
    - Go to MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0`
- `NODE_ENV` - Set to `production` (optional, but recommended)
- Any other environment variables your backend needs

### 3. MongoDB Atlas Setup (if using MongoDB Atlas)

1. **Create a Cluster** (if you haven't already)
   - Go to MongoDB Atlas → Create Cluster
   - Choose a free tier (M0) for development

2. **Create a Database User**
   - Go to Database Access → Add New Database User
   - Choose "Password" authentication
   - Create a strong password
   - Remember the username and password

3. **Whitelist IP Addresses**
   - Go to Network Access → Add IP Address
   - Add `0.0.0.0/0` to allow all IPs (required for Vercel serverless)
   - Or add specific Vercel IP ranges (less secure, but more restrictive)

4. **Get Connection String**
   - Go to Database → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `navigo`)
   - Example: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/navigo?retryWrites=true&w=majority`

5. **Set in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `MONGODB_URI` with your connection string
   - Make sure to set it for Production, Preview, and Development environments
   - **Redeploy after adding environment variables!**

### 4. File Structure

The backend deployment uses:
- `backend/vercel.json` - Vercel configuration
- `backend/api/index.js` - Serverless function entry point
- `backend/src/app.js` - Express app
- `backend/package.json` - Dependencies

### 5. How It Works

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

### MongoDB Connection Issues / Timeout Errors

**Common Error**: `MongooseError: Operation buffering timed out after 10000ms`

This means MongoDB cannot be reached. Check:

1. **MONGODB_URI is Set**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify `MONGODB_URI` is set for Production environment
   - Check the value is correct (no typos, correct password)
   - **Redeploy after adding/changing environment variables!**

2. **MongoDB Atlas IP Whitelist**:
   - Go to MongoDB Atlas → Network Access
   - Make sure `0.0.0.0/0` is whitelisted (allows all IPs)
   - OR add Vercel's IP ranges (but this is less reliable)
   - **This is the most common issue!**

3. **Connection String Format**:
   - Should be: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - Make sure password is URL-encoded (special characters like `@`, `:`, `/` need encoding)
   - Example: If password is `p@ssw:rd`, encode it as `p%40ssw%3Ard`

4. **Database User Permissions**:
   - Make sure the database user has read/write permissions
   - Go to MongoDB Atlas → Database Access → Edit User
   - Set "Database User Privileges" to "Read and write to any database"

5. **Check Backend Logs**:
   - Look for connection error messages
   - Check if `MONGODB_URI` is being logged (it shouldn't be, for security)
   - Look for "MongoDB connected" message

6. **Test Connection**:
   - Try connecting from a MongoDB client (MongoDB Compass, Studio 3T)
   - Use the same connection string
   - If it works locally but not on Vercel, it's likely an IP whitelist issue

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


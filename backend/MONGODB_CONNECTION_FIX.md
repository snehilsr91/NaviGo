# MongoDB Connection Fix for Vercel Serverless

## Problem

The backend was experiencing MongoDB connection issues in Vercel's serverless environment:
- **Error**: `MongooseError: Operation buffering timed out after 10000ms`
- **Connection State**: `State: 0` (disconnected)
- Operations were timing out because MongoDB wasn't connected when queries ran

## Root Cause

1. **No Connection Reuse**: In serverless environments, each function invocation is stateless. Without proper connection caching, Mongoose would try to connect on every request, but connections weren't being reused across invocations.

2. **Connection Timing**: Connections were being attempted, but operations were running before the connection was established, causing Mongoose to buffer operations indefinitely.

3. **Deprecated Options**: Using deprecated Mongoose options (`useNewUrlParser`, `useUnifiedTopology`) that are no longer needed.

4. **No Connection Validation**: Controllers were running queries without ensuring the connection was established first.

## Solution

### 1. Created Dedicated Connection Utility (`src/utils/connectDB.js`)

**Key Features**:
- **Connection Reuse**: Caches the connection promise to prevent multiple simultaneous connection attempts
- **State Management**: Properly handles all MongoDB connection states (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
- **Serverless Optimized**: Uses connection options optimized for serverless environments
- **Error Handling**: Throws clear errors if `MONGODB_URI` is not set
- **Logging**: Provides clear console logs for debugging

**Connection States Handled**:
- **State 1 (Connected)**: Returns existing connection immediately (reused from previous invocation)
- **State 2 (Connecting)**: Waits for existing connection attempt to complete
- **State 0 (Disconnected)**: Creates new connection
- **State 3 (Disconnecting)**: Waits for disconnect, then creates new connection

### 2. Removed Deprecated Options

Removed:
- `useNewUrlParser` (deprecated, no longer needed)
- `useUnifiedTopology` (deprecated, no longer needed)

These options are automatically handled by modern Mongoose versions.

### 3. Added Middleware in `app.js`

**Location**: Before route registration (so it runs first)

**Functionality**:
- Checks if MongoDB is connected before handling API requests
- Automatically establishes connection if not connected
- Skips DB connection for routes that don't need it (`/health`, `/`, `/api/assistant/ask`)
- Returns proper error responses (503) if connection fails

### 4. Updated All Controllers

All controllers now:
- Import `connectDB`, `isConnected`, and `getConnectionState` from `utils/connectDB.js`
- Double-check connection before running queries (defense in depth)
- Provide better error messages for connection issues
- Log connection state for debugging

**Updated Controllers**:
- `buildingReviews.controller.js`
- `detections.controller.js`
- `places.controller.js`

### 5. Connection Options for Serverless

```javascript
{
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
  maxPoolSize: 1, // Only 1 connection for serverless
  minPoolSize: 0, // Allow pool to close when idle
  maxIdleTimeMS: 30000, // Close after 30 seconds of inactivity
}
```

## How It Works

### Connection Flow:

1. **First Request (Cold Start)**:
   - Middleware runs → checks connection state (0 = disconnected)
   - Calls `connectDB()` → creates new connection
   - Connection is established → cached in module-level variable
   - Request proceeds → controller runs query

2. **Subsequent Requests (Warm Start)**:
   - Middleware runs → checks connection state (1 = connected)
   - Returns immediately → uses cached connection
   - Request proceeds → controller runs query

3. **Connection Lost**:
   - If connection is lost (state = 0)
   - Next request → middleware detects disconnection
   - Calls `connectDB()` → establishes new connection
   - Connection is re-established → cached again

### Why This Fixes "State: 0" Issue

**Before**:
- Controllers ran queries immediately
- Mongoose tried to buffer operations while waiting for connection
- Connection was never established (or took too long)
- Operations timed out after 10 seconds

**After**:
- Middleware ensures connection is established BEFORE controllers run
- Connection is reused across invocations (state stays at 1)
- Controllers double-check connection before queries
- Operations run only when connection is ready (state = 1)

## Files Changed

1. **Created**: `backend/src/utils/connectDB.js`
   - Centralized MongoDB connection logic
   - Exports `connectDB()`, `isConnected()`, `getConnectionState()`

2. **Updated**: `backend/src/app.js`
   - Added MongoDB connection middleware before routes
   - Ensures DB is connected before API routes execute

3. **Updated**: `backend/api/index.js`
   - Simplified (just exports the app)
   - Connection logic moved to `app.js`

4. **Updated**: `backend/src/controllers/buildingReviews.controller.js`
   - Uses `connectDB()` utility
   - Checks connection before queries

5. **Updated**: `backend/src/controllers/detections.controller.js`
   - Uses `connectDB()` utility
   - Checks connection before queries

6. **Updated**: `backend/src/controllers/places.controller.js`
   - Uses `connectDB()` utility
   - Checks connection before queries

## Environment Variables Required

Make sure these are set in Vercel:
- `MONGODB_URI` - MongoDB connection string (REQUIRED)
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
  - MongoDB Atlas IP whitelist must include `0.0.0.0/0`

## Testing

After deployment, check logs for:
- `✅ MongoDB connected successfully` - Connection established
- `✅ Using existing MongoDB connection` - Connection reused
- `❌ MongoDB connection error` - Connection failed (check MONGODB_URI and IP whitelist)

## Next Steps

1. **Set MONGODB_URI in Vercel**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `MONGODB_URI` with your MongoDB Atlas connection string
   - Redeploy after adding

2. **Verify MongoDB Atlas**:
   - Check IP whitelist includes `0.0.0.0/0`
   - Verify database user has read/write permissions
   - Test connection string with MongoDB Compass

3. **Monitor Logs**:
   - Check Vercel function logs for connection status
   - Look for connection state in logs
   - Verify operations are succeeding


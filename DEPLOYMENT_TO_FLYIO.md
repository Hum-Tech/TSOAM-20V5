# TSOAM Church Management System - Fly.io Deployment Guide

## Overview

This guide explains how to deploy the TSOAM Church Management System to Fly.io in production mode.

## What Was Changed

1. **fly.toml** - Fly.io configuration file with proper build and start commands
2. **Procfile** - Backup process configuration for Fly.io
3. **package.json** - Updated scripts with proper production start command
4. **.dockerignore** - Optimized Docker build for Fly.io
5. **scripts/deploy.js** - Local deployment preparation script

## Pre-Deployment Checklist

- [ ] All code changes are committed locally
- [ ] Production build has been tested locally with `npm run build`
- [ ] Environment variables are configured in Fly.io dashboard
- [ ] Database is set up (MySQL or SQLite based on your configuration)

## Deployment Steps

### Step 1: Prepare Your Local Machine

```bash
# Install Fly.io CLI (if not already installed)
# macOS/Linux:
curl -L https://fly.io/install.sh | sh

# Windows:
# Download from https://github.com/superfly/flyctl/releases

# Login to Fly.io
flyctl auth login
```

### Step 2: Configure Environment Variables

In the Fly.io dashboard or via CLI:

```bash
# Set production environment variables
flyctl secrets set NODE_ENV=production
flyctl secrets set USE_SQLITE=false
flyctl secrets set JWT_SECRET=your_secret_key_here
flyctl secrets set DB_HOST=your_db_host
flyctl secrets set DB_PORT=3306
flyctl secrets set DB_USER=your_db_user
flyctl secrets set DB_PASSWORD=your_db_password
flyctl secrets set DB_NAME=tsoam_church_db
```

**Or manually:**
1. Go to https://fly.io/dashboard
2. Select your app
3. Go to Settings > Secrets
4. Add environment variables

### Step 3: Push Code to GitHub

```bash
# Commit changes
git add .
git commit -m "Configure production deployment for Fly.io"

# Push to your main branch
git push origin main
```

### Step 4: Deploy to Fly.io

#### Option A: Via CLI (Recommended)

```bash
# Deploy from your local machine
flyctl deploy

# Monitor deployment
flyctl status
flyctl logs
```

#### Option B: Via GitHub Integration

1. Go to Fly.io dashboard
2. Add GitHub integration
3. Connect to your repository
4. Enable auto-deploy on main branch push

### Step 5: Verify Deployment

```bash
# Check app status
flyctl status

# View live logs
flyctl logs

# Test the application
curl https://your-app.fly.dev
curl https://your-app.fly.dev/api/health
```

## What Happens During Deployment

1. **Build Phase:**
   - Fly.io clones your GitHub repository
   - Runs `npm install` to install root dependencies
   - Runs `npm run build` to build the React client and create `client/dist`
   - Prepares the Docker image

2. **Start Phase:**
   - Starts the production server with `npm start`
   - Server runs on port 3001
   - Serves static files from `client/dist`
   - API routes are available at `/api/*`

## Production Build Details

### What the Build Does

The `npm run build` command:
- Builds the React client with Vite in production mode
- Creates optimized bundles in `client/dist`
- Removes Vite dev server dependencies
- Outputs no source maps in production

### Server Configuration

The production server (`server/server.js`):
- Serves static files from `client/dist` directory
- Routes API requests to backend endpoints
- Handles 404s by serving index.html (for SPA routing)
- Listens on the PORT environment variable (default: 3001)

## Troubleshooting

### 500 Internal Server Error
- Check logs: `flyctl logs`
- Verify environment variables are set correctly
- Check database connectivity

### Build Fails
- Review build logs: `flyctl logs --history`
- Ensure `npm install` works locally
- Check for TypeScript errors: `npm run build`

### Static Files Not Loading
- Verify `client/dist` is created by build
- Check server.js is serving from correct path
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Database Connection Issues
- Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in secrets
- Check database is accessible from Fly.io machines
- Set USE_SQLITE=false to avoid falling back to SQLite

## Rollback to Previous Version

If something goes wrong:

```bash
# Check recent releases
flyctl releases

# Rollback to previous release
flyctl releases rollback
```

## Next Steps

1. **Connect to Database:** If using an external database, ensure it's accessible from Fly.io
2. **Set Up Custom Domain:** Configure DNS in Fly.io settings
3. **Monitor Performance:** Use `flyctl monitor` to watch resource usage
4. **Set Up Error Tracking:** Consider integrating Sentry for error monitoring

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Node.js Guide](https://fly.io/docs/languages-and-frameworks/nodejs/)
- [Environment Variables on Fly.io](https://fly.io/docs/reference/secrets/)

## Support

For issues with Fly.io deployment:
- Check [Fly.io Support](https://fly.io/docs/getting-help/)
- Review deployment logs: `flyctl logs`
- Verify configuration: `flyctl config view`

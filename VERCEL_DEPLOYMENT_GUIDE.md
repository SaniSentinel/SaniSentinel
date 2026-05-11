# SaniSentinel - Vercel Deployment Guide

## 🚀 Complete Guide to Deploy SaniSentinel on Vercel

This guide will walk you through deploying your SaniSentinel React application to Vercel with proper environment variable configuration.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Supabase Project**: Your Supabase database should be set up and running

## 🔧 Step 1: Prepare Your Project

### 1.1 Update .gitignore
Make sure your `.env` file is NOT committed to Git for security:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 1.2 Create Environment Variables Template
Create a `.env.example` file to document required environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Africa's Talking SMS API Configuration (Optional)
AFRICAS_TALKING_API_KEY=your_africas_talking_api_key
AFRICAS_TALKING_USERNAME=your_africas_talking_username
```

### 1.3 Verify Build Configuration
Your `package.json` already has the correct build script:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

## 🌐 Step 2: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Git Repository**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your SaniSentinel repository
   - Click "Import"

3. **Configure Project Settings**
   - **Project Name**: `sanissentinel` (or your preferred name)
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL = https://aaxgfnzcbyerjlcftwuo.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheGdmbnpjYnllcmpsY2Z0d3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc4NDgsImV4cCI6MjA5Mzc2Mzg0OH0.rur02SV6Yy0gLjUmkFMwUTB7msz1f3bXzyQPokaWJrk
   AFRICAS_TALKING_API_KEY = atsk_56cc647e4593a9b12d5d85db3d9f2746f4c23a7bd297d9f90e1827a8245520adaaeab07b
   AFRICAS_TALKING_USERNAME = sandbox
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-3 minutes)

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   cd /path/to/SaniSentinel
   vercel
   ```

4. **Follow CLI Prompts**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `sanissentinel`
   - Directory: `./`

5. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add AFRICAS_TALKING_API_KEY
   vercel env add AFRICAS_TALKING_USERNAME
   ```

## 🔒 Step 3: Configure Supabase for Production

### 3.1 Update Supabase URL Allowlist
1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Add your Vercel domain to the "Site URL" field:
   ```
   https://your-project-name.vercel.app
   ```

### 3.2 Update Authentication Redirect URLs
1. In Supabase dashboard, go to Authentication > URL Configuration
2. Add your Vercel URL to "Redirect URLs":
   ```
   https://your-project-name.vercel.app/**
   ```

## 🛠️ Step 4: Optimize for Production

### 4.1 Create vercel.json Configuration
Create a `vercel.json` file in your project root:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### 4.2 Update Vite Configuration for Production
Update your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
```

## 🔍 Step 5: Test Your Deployment

### 5.1 Verify Deployment
1. Visit your Vercel URL: `https://your-project-name.vercel.app`
2. Check that the application loads correctly
3. Test login functionality
4. Verify map displays properly
5. Test admin dashboard features

### 5.2 Check Environment Variables
Open browser console and verify:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
// Should show your Supabase URL, not undefined
```

## 🚨 Troubleshooting Common Issues

### Issue 1: Build Fails
**Error**: `Module not found` or dependency issues
**Solution**: 
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Environment Variables Not Working
**Error**: `undefined` environment variables
**Solution**: 
- Ensure variables start with `VITE_`
- Check they're added in Vercel dashboard
- Redeploy after adding variables

### Issue 3: Routing Issues (404 on refresh)
**Error**: 404 when refreshing pages
**Solution**: The `vercel.json` rewrites configuration above should fix this

### Issue 4: Supabase Connection Issues
**Error**: CORS or connection errors
**Solution**: 
- Update Supabase Site URL settings
- Check API keys are correct
- Verify RLS policies allow public access where needed

## 📱 Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Follow DNS configuration instructions

### 6.2 Update Supabase Settings
Update Supabase Site URL to your custom domain:
```
https://yourdomain.com
```

## 🔄 Step 7: Continuous Deployment

### 7.1 Automatic Deployments
Vercel automatically deploys when you push to your main branch:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from feature branches

### 7.2 Deploy Hooks
Create deploy hooks for manual deployments:
1. Go to Project Settings > Git
2. Create Deploy Hook
3. Use the webhook URL to trigger deployments

## 📊 Step 8: Monitoring and Analytics

### 8.1 Vercel Analytics
Enable Vercel Analytics in your project settings for:
- Page views
- Performance metrics
- User analytics

### 8.2 Error Monitoring
Consider adding error monitoring:
```bash
npm install @sentry/react @sentry/tracing
```

## ✅ Deployment Checklist

- [ ] Repository is pushed to Git
- [ ] Environment variables are configured in Vercel
- [ ] Supabase URLs are updated for production
- [ ] Build completes successfully
- [ ] Application loads on Vercel URL
- [ ] Authentication works
- [ ] Database connections work
- [ ] Maps display correctly
- [ ] Admin dashboard functions properly
- [ ] SMS functionality works (if applicable)

## 🎉 Success!

Your SaniSentinel application should now be live on Vercel! 

**Your deployment URL**: `https://your-project-name.vercel.app`

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with `npm run build && npm run preview`
4. Check Supabase dashboard for connection issues

---

**Note**: Remember to keep your environment variables secure and never commit them to your repository!
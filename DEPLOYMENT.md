# Deployment Guide

This guide covers deploying Creepy Companion to Vercel with serverless functions.

## Prerequisites

- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Featherless AI API key (get from https://featherless.ai)
- [ ] Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Import Project to Vercel

**Option A: Via Vercel Dashboard**

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your Git provider (GitHub/GitLab/Bitbucket)
4. Choose the repository
5. Vercel will auto-detect the Vite framework

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel
```

### 3. Configure Environment Variables

In the Vercel Dashboard:

1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add the following variable:

| Name                  | Value                         | Environments                     |
| --------------------- | ----------------------------- | -------------------------------- |
| `FEATHERLESS_API_KEY` | Your API key from Featherless | Production, Preview, Development |

**Important**: Make sure to enable the variable for all three environments (Production, Preview, Development).

### 4. Configure Build Settings (Auto-detected)

Vercel should automatically detect these settings from `vercel.json`:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not auto-detected, set them manually in Settings → General → Build & Development Settings.

### 5. Deploy

**First Deployment:**

The project will deploy automatically after importing. Monitor the deployment logs for any errors.

**Subsequent Deployments:**

Every push to your main branch will trigger a new production deployment automatically.

**Manual Deployment:**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 6. Verify Deployment

#### Test the Frontend

Visit your deployment URL (e.g., `https://your-app.vercel.app`) and verify:

- [ ] Creation screen loads
- [ ] Pet can be created with name, archetype, and color
- [ ] Game canvas renders
- [ ] Stats display correctly

#### Test the Serverless Function

Test the `/api/chat` endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Describe a mysterious artifact in one sentence", "temperature": 0.7}'
```

Expected response:

```json
{
  "text": "A cryptic AI-generated description..."
}
```

#### Test Error Handling

Test with invalid request:

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response (400):

```json
{
  "error": "Invalid request: prompt is required and must be a string"
}
```

### 7. Monitor Deployment

In the Vercel Dashboard:

1. **Functions** tab: Monitor serverless function invocations and errors
2. **Analytics** tab: Track page views and performance
3. **Logs** tab: View real-time logs from your functions

## Troubleshooting

### Build Fails

**Issue**: TypeScript compilation errors

**Solution**: Run `npm run build` locally to identify and fix errors before deploying.

**Issue**: Missing dependencies

**Solution**: Ensure all dependencies are in `package.json`, not just `devDependencies` for production packages.

### Serverless Function Errors

**Issue**: "Server configuration error"

**Solution**: Verify `FEATHERLESS_API_KEY` is set in environment variables and enabled for the correct environment.

**Issue**: Function timeout

**Solution**: The function has a 30-second timeout. If requests consistently timeout, check:

- Featherless API status
- Network connectivity
- Prompt complexity

**Issue**: CORS errors

**Solution**: The `vercel.json` includes CORS headers. If issues persist, check browser console for specific errors.

### Environment Variable Issues

**Issue**: Environment variable not available

**Solution**:

1. Verify the variable is set in Vercel Dashboard
2. Ensure it's enabled for the correct environment (Production/Preview/Development)
3. Redeploy after adding new variables

### State Persistence Issues

**Issue**: Game state not persisting

**Solution**: The game uses localStorage. Ensure:

- Browser allows localStorage
- No browser extensions blocking storage
- Check browser console for storage quota errors

## Performance Optimization

### Caching

Vercel automatically caches static assets. The `dist` folder contents are served via CDN.

### Function Cold Starts

Serverless functions may have cold starts (1-2 second delay on first request). This is normal and subsequent requests will be faster.

### Bundle Size

Monitor bundle size with:

```bash
npm run build
```

Check the output for bundle sizes. Consider code splitting if bundles exceed 500KB.

## Custom Domain

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed by Vercel
4. Wait for DNS propagation (up to 48 hours)

## Rollback

If a deployment has issues:

1. Go to Deployments tab
2. Find a previous working deployment
3. Click "..." → "Promote to Production"

## CI/CD Integration

Vercel automatically deploys:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

Configure branch settings in Project Settings → Git.

## Security Checklist

- [ ] API key stored in environment variables (not in code)
- [ ] CORS headers configured correctly
- [ ] Rate limiting handled in serverless function
- [ ] Error messages don't expose sensitive information
- [ ] HTTPS enforced (automatic with Vercel)

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Featherless AI: https://featherless.ai/docs

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables documented
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Accessibility tested
- [ ] Performance acceptable
- [ ] State persistence works
- [ ] Offline decay calculation correct

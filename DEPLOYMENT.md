# 🚀 AI Mock Interview App - Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create production database (Neon/Supabase)
- [ ] Get GROQ API key for production
- [ ] Generate strong session secrets
- [ ] Prepare environment variables

### 2. Code Preparation
- [ ] Test build process locally
- [ ] Run database migrations
- [ ] Verify all environment variables
- [ ] Test production build

## 🎯 Recommended Deployment Strategy

### Backend: Railway (Recommended) or Render
### Frontend: Vercel (Recommended) or Netlify
### Database: Neon (Already configured)

---

## 🚄 Option 1: Railway + Vercel (RECOMMENDED)

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**: https://railway.app
2. **Connect GitHub**: Link your repository
3. **Create New Project**: 
   ```bash
   railway new
   ```
4. **Set Environment Variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_neon_database_url
   GROQ_API_KEY=your_groq_api_key
   SESSION_SECRET=generate_strong_secret
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. **Deploy**: Railway auto-deploys from main branch

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**: https://vercel.com
2. **Import Project**: Connect your GitHub repo
3. **Configure Build Settings**:
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Set Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```
5. **Deploy**: Auto-deploys from main branch

---

## 🎨 Option 2: Render + Netlify

### Step 1: Deploy Backend to Render

1. **Create Render Account**: https://render.com
2. **New Web Service**: Connect GitHub repo
3. **Configure Service**:
   - Name: ai-mock-interview-api
   - Environment: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
4. **Set Environment Variables** (same as Railway)

### Step 2: Deploy Frontend to Netlify

1. **Create Netlify Account**: https://netlify.com
2. **New Site from Git**: Connect repo
3. **Configure Build**:
   - Base Directory: `client`
   - Build Command: `npm run build`
   - Publish Directory: `client/dist`
4. **Set Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```

---

## 🐳 Option 3: Docker Deployment (Advanced)

### For VPS/Cloud Platforms (DigitalOcean, AWS, etc.)

```bash
# Build the Docker image
docker build -t ai-mock-interview .

# Run with environment variables
docker run -p 5000:5000 \
  -e DATABASE_URL=your_db_url \
  -e GROQ_API_KEY=your_api_key \
  -e NODE_ENV=production \
  ai-mock-interview
```

---

## 🔧 Production Environment Variables

### Required Variables:
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# AI Service
GROQ_API_KEY=gsk_your_groq_api_key_here

# Security
SESSION_SECRET=your_super_strong_secret_here
JWT_SECRET=another_strong_secret_here

# App Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 🔄 Deployment Commands

### Local Testing:
```bash
# Build frontend
cd client && npm run build

# Test production build
npm run build && npm start

# Database migration (if needed)
npm run db:push
```

### Post-Deployment:
```bash
# Initialize demo users (one-time)
curl -X POST https://your-backend-url.com/api/auth/init-demo

# Health check
curl https://your-backend-url.com/health
```

---

## 🏆 Best Practices

### Security:
- ✅ Use strong, unique secrets for production
- ✅ Enable HTTPS only (handled by hosting platforms)
- ✅ Set proper CORS origins
- ✅ Use environment variables for all secrets

### Performance:
- ✅ Enable gzip compression (handled by platforms)
- ✅ Use CDN for static assets (handled by Vercel/Netlify)
- ✅ Monitor API response times
- ✅ Set up error logging

### Monitoring:
- ✅ Use health check endpoints
- ✅ Monitor database connections
- ✅ Set up uptime monitoring
- ✅ Configure alerts for errors

---

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**: Verify FRONTEND_URL is set correctly
2. **Database Connection**: Check DATABASE_URL and network access
3. **API Key Issues**: Verify GROQ_API_KEY is valid
4. **Build Failures**: Check Node.js version compatibility

### Quick Fixes:
```bash
# Check logs
railway logs  # or render logs

# Restart service
railway restart  # or redeploy

# Database migration
railway run npm run db:push
```

---

## 📞 Support

- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Neon Database: https://neon.tech/docs
- GROQ API: https://groq.com/docs
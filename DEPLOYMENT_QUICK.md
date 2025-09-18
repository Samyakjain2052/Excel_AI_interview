# 🚀 Quick Deployment Checklist

## ✅ Before Deployment

- [ ] **Test locally**: `npm run build && npm start`
- [ ] **Environment variables ready**:
  - [ ] DATABASE_URL (production)
  - [ ] GROQ_API_KEY 
  - [ ] SESSION_SECRET (generate new)
  - [ ] FRONTEND_URL
- [ ] **Database migrated**: `npm run db:push`
- [ ] **Secrets secured** (not in git)
- [ ] **Build works** without errors

## 🎯 Recommended: Railway + Vercel

### Backend (Railway):
1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Select your repo
4. Set environment variables
5. Deploy automatically

### Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com)
2. "New Project" → Import Git Repository
3. Root Directory: `client`
4. Set `VITE_API_URL` to your Railway URL
5. Deploy

## 🔗 Post-Deployment

- [ ] **Test authentication** with demo users
- [ ] **Verify API endpoints** work
- [ ] **Initialize demo data**: `POST /api/auth/init-demo`
- [ ] **Check health**: `GET /health`
- [ ] **Test interview flow**
- [ ] **Test HR dashboard**

## 📱 URLs After Deployment
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.railway.app`
- **Health Check**: `https://your-app.railway.app/health`

## 🆘 If Issues:
1. Check logs in Railway/Vercel dashboard
2. Verify environment variables
3. Test database connection
4. Check CORS settings
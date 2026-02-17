# Migration to Next.js + Vercel Guide

## ✅ What's Been Changed

1. **Frontend**: Converted from plain HTML to React/Next.js
2. **Backend**: Converted Express routes to Next.js API routes
3. **Structure**: New Next.js app structure with `/app` directory
4. **Config**: Added `next.config.js` and `vercel.json`

## 🔧 What You Need to Do in AWS

### Keep These (No Changes Needed):
- ✅ **RDS Postgres** - Keep as is, still using it
- ✅ **S3 Bucket** - Keep as is, still using it
- ✅ **IAM User** - Keep credentials, still need them

### Can Delete/Stop (No Longer Needed):
- ❌ **Elastic Beanstalk Environment** - Can terminate (saves ~$15-30/month)
  - Go to: https://console.aws.amazon.com/elasticbeanstalk
  - Select `resumeiq-env` → Actions → Terminate environment

### Update DNS (Important!):
1. Go to GoDaddy DNS settings
2. Update the `www` CNAME record:
   - **Old**: `resumeiq-env.eba-bcbvp6p8.us-east-2.elasticbeanstalk.com`
   - **New**: Your Vercel domain (will get after deployment)

## 🚀 Deploy to Vercel

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Your account)
- Link to existing project? **No**
- Project name: `resumeiq` (or your choice)
- Directory: `./` (current directory)
- Override settings? **No**

### Step 4: Set Environment Variables in Vercel

Go to: https://vercel.com/dashboard → Your project → Settings → Environment Variables

Add these (same values from your `.env` file):

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-2
S3_BUCKET_NAME=your_bucket_name
DB_HOST=your_rds_endpoint
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_db_password
```

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Update DNS

1. Get your Vercel domain from the dashboard
2. Go to GoDaddy DNS
3. Update `www` CNAME to point to your Vercel domain (e.g., `resumeiq.vercel.app`)

Or add a custom domain in Vercel:
- Vercel Dashboard → Your Project → Settings → Domains
- Add `www.smartresumes.org`
- Update DNS records as shown in Vercel

## 🧪 Test Locally First

```bash
npm run dev
```

Visit: http://localhost:3000

## 📝 Notes

- The old `server/` folder is still there but not used
- Old `index.html` and `js/app.js` are replaced by Next.js
- CSS files are combined into `app/globals.css`
- Database initialization happens automatically on first API call

## 🎯 Benefits

- ✅ Free hosting on Vercel
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Modern React/Next.js stack
- ✅ Better for your resume!

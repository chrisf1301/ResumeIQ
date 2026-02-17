# AI-Powered Matching Setup

## ✅ What's Been Added

Your app now has **AI-powered resume matching** with detailed feedback:

- **Score**: 0-100% match percentage
- **Strengths**: What matches well
- **Weaknesses**: What's missing
- **Recommendations**: How to improve
- **Summary**: Overall analysis

## 🔑 Setup OpenAI API Key

### Step 1: Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click **Create new secret key**
4. Name it: `ResumeIQ`
5. **Copy the key** (you won't see it again!)

### Step 2: Add to Vercel

1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Click **Add New**
3. Enter:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
   - **Environments**: Check Production, Preview, Development
4. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **3 dots** → **Redeploy**

## 💰 Cost Estimate

- **GPT-3.5-turbo**: ~$0.001-0.002 per analysis
- **100 analyses**: ~$0.10-0.20
- **Very affordable!**

## 🎯 How It Works

1. User uploads resume + job description
2. AI analyzes semantic match (not just keywords)
3. Returns detailed feedback:
   - What skills match
   - What's missing
   - How to improve
4. Falls back to keyword matching if API key missing

## 🚀 Features

- **Semantic understanding** - Understands context, not just words
- **Actionable feedback** - Specific recommendations
- **Automatic fallback** - Works even without API key (basic matching)

---

**Once you add the OpenAI API key to Vercel and redeploy, AI matching will work!**

# Deploy SMAP Backend to Railway

## Quick Deploy Steps

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Railway Project
```bash
cd backend
railway init
```

### 4. Set Environment Variables
```bash
railway variables set OPENAI_API_KEY=your_openai_api_key_here
railway variables set NASA_USERNAME=your_nasa_username
railway variables set NASA_PASSWORD=your_nasa_password
```

### 5. Deploy
```bash
railway up
```

### 6. Get the Public URL
```bash
railway domain
```

### 7. Update Supabase Edge Functions
Copy the Railway URL and update the `PYTHON_BACKEND_URL` environment variable in your Supabase dashboard:

1. Go to Supabase Dashboard → Settings → Edge Functions
2. Set `PYTHON_BACKEND_URL` to your Railway URL (e.g., `https://your-app.railway.app`)

## Alternative: Deploy to Render

If Railway doesn't work, you can also deploy to Render:

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (OPENAI_API_KEY, NASA_USERNAME, NASA_PASSWORD)

## Test the Deployment

Once deployed, test with:
```bash
curl -X POST https://your-app.railway.app/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "region": "India",
    "subregion": "Punjab", 
    "bbox": [73.8, 29.5, 76.5, 32.5],
    "date": "2025-07-01"
  }'
``` 
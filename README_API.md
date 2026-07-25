# NSE Trading & Analytics Python API Server

Production-ready FastAPI backend server for fetching live NSE Option Chain data, Black-Scholes Option Greeks, PCR, Max Pain, and real-time market metrics.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the Python API Server
```bash
python api_server.py
```
Or directly with Uvicorn:
```bash
uvicorn api_server:app --reload --port 8000
```

### 3. Open Interactive Swagger API Documentation
Once running, open your browser to:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 📡 API Endpoints Summary

| Endpoint | Method | Description |
|---|---|---|
| `/` or `/api/health` | `GET` | Health check & market status |
| `/api/live-data` | `GET` | Live raw NSE Option Chain (supports `symbol=NIFTY`, `BANKNIFTY`, `RELIANCE`, etc.) |
| `/api/analytics` | `GET` | Real-time PCR, Max Pain, ATM IV, Expected Move & Black-Scholes Greeks |
| `/api/stocks` | `GET` | List of supported stock & index symbols |

---

## 🌐 Deploying Live to Production

### Option A: Deploy to Render (Recommended - Free / Low Cost)
1. Push this repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your repository.
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
6. Click **Create Web Service**.

### Option B: Deploy to Railway / Heroku
The included `Procfile` will automatically configure the app:
```bash
web: uvicorn api_server:app --host 0.0.0.0 --port $PORT
```

### Option C: Connect React Frontend to Production Backend
In your frontend deployment (Vercel / Netlify / Cloudflare Pages), add an environment variable:
```env
VITE_API_BASE_URL=https://your-python-api.onrender.com
```
The React frontend will automatically connect to your live Python backend API!

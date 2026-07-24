# 📈 Nifty Options Analysis Dashboard & Derivatives Engine

A data-driven derivative analytics system and web dashboard for **NSE Nifty 50 Options & Futures**. It processes raw NSE market CSV files or live market feeds to calculate Black-Scholes Greeks, PCR, Max Pain, Volatility Cone, Expected Move, Liquidity Scores, and Volatility Skew — with 1-click **Excel (`analysis.xlsx`)** and **CSV (`analysis.csv`)** exporting.

> [!IMPORTANT]
> **No Trading Recommendations • No AI Decision Making • Pure Quantitative Derivatives Analytics**

---

## 🚀 Quick Start Guide (Commands to Run)

### 1. Install Dependencies
```bash
# Install Node.js frontend dependencies
npm install

# Install Python analytics dependencies
pip install pandas numpy openpyxl yfinance requests
```

---

### 2. Run the Web Dashboard
Launch the interactive web application at **http://localhost:5173/**:
```bash
npm run dev
```

---

### 3. Run the Live NSE CORS Proxy Server (For Live Auto-Sync)
To stream live market feeds directly into the browser without CORS blocks:
```bash
node proxy_server.mjs
```
*(Runs locally on `http://localhost:3001`)*

---

### 4. Run the Standalone Python Analytics Engine
To process your NSE CSV files directly via CLI and generate `analysis.xlsx` & `analysis.csv`:
```bash
python analytics_engine.py
```

---

### 5. Run the Automated Live Data Fetcher Loop (Market Hours)
To continuously fetch live option chain data from NSE India every 60 seconds (9:15 AM – 3:30 PM IST):
```bash
python live_fetcher.py
```

---

### 6. Build Production Web Application
```bash
npm run build
```

---

## 📋 Required NSE Market CSV Files

When using manual CSV mode, place or upload the following 3 files:

1. **`option-chain-ED-NIFTY-*.csv`** (or `option-chain.csv`)
2. **`MW-FO-nse50_fut-*.csv`** (or `nse50_fut.csv`)
3. **`MW-FO-nse50_opt-*.csv`** (or `nse50_opt.csv`)

---

## ✨ Core Features & Analytics Engine

| Step # | Metric / Feature | Description |
| :---: | :--- | :--- |
| **1** | **Market Summary** | Spot Price, Futures Price, Premium/Discount, Expiry, Days to Expiry, Exchange Feed Timestamp & Session Status (`🟢 LIVE` / `🔴 LAST SESSION CLOSE`) |
| **2** | **Option Chain Summary & PCR** | Overall Call/Put OI, Total Volume, Strike PCR, and Market Sentiment Interpretation |
| **3** | **Max Pain Analysis** | Buyer Loss Minimization Strike and distance from current spot price |
| **4** | **Support & Resistance** | Top 5 Support levels (Put OI) and Top 5 Resistance levels (Call OI) |
| **5** | **OI Build-up Classification** | 6-Way Classification (Call/Put Writing, Long/Short Build-up, Unwinding, Covering) |
| **6** | **Liquidity Score (0-100)** | Normalized liquidity ranking based on Bid-Ask spread & trading volume |
| **7** | **Implied Volatility (IV) Analysis** | ATM IV, Volatility Skew (OTM Put - OTM Call), and IV Smile Curve |
| **8** | **Black-Scholes Greeks** | Vectorized $\Delta, \Gamma, \Theta, \nu, \rho$ for all CE & PE strikes |
| **9** | **Expected Move Cone** | 1-StdDev Expected Price Move ($\text{Spot} \times \text{ATM IV} \times \sqrt{DTE/365}$) |
| **10** | **Futures Analysis** | Basis %, Open Interest, High/Low/Open, and Premium/Discount Status |
| **11** | **Historical Volatility (HV)** | 1-Month Annualized HV from Yahoo Finance (`^NSEI`) |
| **12** | **HV vs IV Comparison** | Option Volatility Regime (Overpriced vs Underpriced) |
| **13** | **Complete Option Chain Table** | High-density grid highlighting ATM row in Gold |
| **14** | **Data Audit Warnings** | Quality audit for missing values, invalid IVs (`-` dashes), and duplicate rows |
| **Export** | **Excel & CSV Reports** | Multi-sheet `analysis.xlsx` and structured `analysis.csv` |

---

## 🎨 Theme & UI Styling
- **Warm Light Theme**: Soft warm paper background (`#F4F1EA`), sidebar panels (`#EBE8E0`), and olive-gold primary accents (`#9B9044`).
- **Typography**: Clean, high-density monospace numbers (`Inter` / system fonts).

---

## 📁 Repository Structure
```
d:\NiteshYadav\Trading\data-extraction\
├── index.html                  # App entry point with custom favicon
├── package.json                # Project scripts & dependencies
├── analytics_engine.py         # Python analytics & Excel/CSV exporter
├── live_fetcher.py             # Python live NSE loop fetcher
├── proxy_server.mjs            # Standalone Node CORS proxy server
├── public/
│   ├── favicon.svg             # Custom Nifty Derivative Favicon
│   └── *.csv                   # Real NSE market data files
└── src/
    ├── components/             # React dashboard step components
    ├── types/                  # TypeScript interfaces
    └── utils/
        ├── blackScholes.ts     # Black-Scholes Greeks calculator
        ├── calculations.ts     # Core calculation engine
        ├── csvParser.ts        # Robust NSE CSV dump parser
        ├── exportCsv.ts        # Dashboard CSV report exporter
        ├── exportExcel.ts      # Multi-sheet Excel workbook generator
        └── yahooFinance.ts     # Historical Volatility API integration
```

---

## 📄 License
MIT License • Built for quantitative derivative analysis.

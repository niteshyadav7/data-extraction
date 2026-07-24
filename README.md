# 📈 Nifty Options Analysis Dashboard & Derivatives Engine

A data-driven derivative analytics system and web dashboard for **NSE Nifty 50 Options & Futures**. It processes raw NSE market CSV files or live market feeds to calculate Black-Scholes Greeks, PCR, Max Pain, Volatility Cone, Expected Move, Liquidity Scores, Volatility Skew, and **LTP Target & Reversal Prices** — with 1-click **Excel (`analysis.xlsx`)** and **CSV (`analysis.csv`)** exporting.

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

## 🧮 How to Use the LTP Target & Reversal Calculator (Step 18)

The **LTP Calculator** in Step 18 lets options traders predict **where option prices (LTPs) will go** under different spot price movements, IV volatility shifts, and time decay.

### 1. **Spot Price Simulator (Delta $\Delta$ & Gamma $\Gamma$)**
- **Target Spot Price Input/Slider**: Type or slide to simulate a target spot price level (e.g. Nifty $+100$ pts).
- The calculator uses **Black-Scholes Delta ($\Delta$) and Gamma ($\Gamma$)** to calculate the exact theoretical Call and Put LTP for every strike.

### 2. **IV Volatility Shift (Vega $\nu$ Impact)**
- **Target IV Change Slider**: Simulate volatility expansion ($+1.5\%$) or compression ($-2.0\%$ IV crush).
- Positive IV shift adds Vega premium to options; negative IV shift models post-event IV crush.

### 3. **Holding Time Decay (Theta $\Theta$ Erosion)**
- **Time Passed Slider (0 to 72 Hours)**: Simulates daily **Theta ($\Theta$) time decay** erosion to show option value if held overnight.

### 4. **Support & Resistance Reversal Levels (EOS / EOR)**
- **EOR (Extension of Resistance)**: $\text{Strike} + \text{Target Call LTP}$. Theoretical upper boundary where Call buyers take profit and price reverses down.
- **EOS (Extension of Support)**: $\text{Strike} - \text{Target Put LTP}$. Theoretical lower boundary where Put buyers take profit and price bounces up.

---

## ✨ Core Features & Analytics Engine

| Step # | Metric / Feature | Description |
| :---: | :--- | :--- |
| **1** | **Market Summary** | Spot Price, Futures Price, Premium/Discount, Expiry, Days to Expiry, Exchange Feed Timestamp & Session Status (`🟢 LIVE` / `🔴 LAST SESSION CLOSE`) |
| **2** | **Option Chain Summary & PCR** | Overall Call/Put OI, Total Volume, Strike PCR, and Market Sentiment Interpretation |
| **3** | **PCR Sentiment Gauge** | Color-coded Sentiment Gauge Meter (`Red` < 0.8, `Gold` 0.8-1.2, `Green` > 1.2) |
| **4** | **Max Pain Analysis** | Buyer Loss Minimization Strike and distance from current spot price |
| **5** | **Support & Resistance** | Top 5 Support levels (Put OI) and Top 5 Resistance levels (Call OI) |
| **6** | **OI Build-up Classification** | 6-Way Classification (Call/Put Writing, Long/Short Build-up, Unwinding, Covering) |
| **7** | **Liquidity Score (0-100)** | Normalized liquidity ranking based on Bid-Ask spread & trading volume |
| **8** | **Implied Volatility (IV) Analysis** | ATM IV, Volatility Skew (OTM Put - OTM Call), and IV Smile Curve |
| **9** | **Black-Scholes Greeks** | Vectorized $\Delta, \Gamma, \Theta, \nu, \rho$ for all CE & PE strikes |
| **10** | **Expected Move Cone** | 1-StdDev Expected Price Move ($\text{Spot} \times \text{ATM IV} \times \sqrt{DTE/365}$) |
| **11** | **Futures Analysis** | Basis %, Open Interest, High/Low/Open, and Premium/Discount Status |
| **12** | **Historical Volatility (HV)** | 1-Month Annualized HV from Yahoo Finance (`^NSEI`) |
| **13** | **HV vs IV Comparison** | Option Volatility Regime (Overpriced vs Underpriced) |
| **14** | **Option Chain Matrix** | Complete Option Chain Grid with Range Filter (`ATM ± 5`, `ATM ± 10`, `All`), ITM Shading, and **Greeks Toggle** |
| **15** | **LTP & Reversal Calculator** | Step 18 Dedicated LTP Target & Reversal Simulator (EOS/EOR Levels, Spot Shift, IV Shift, Theta Decay) |
| **16** | **Data Audit Warnings** | Quality audit for missing values, invalid IVs (`-` dashes), and duplicate rows |
| **Export** | **Excel & CSV Reports** | Multi-sheet `analysis.xlsx` and structured `analysis.csv` |

---

## 🎨 Theme & UI Styling
- **Warm Light Theme**: Soft warm paper background (`#F4F1EA`), sidebar panels (`#EBE8E0`), and olive-gold primary accents (`#9B9044`).
- **Typography**: Clean, high-density monospace numbers (`Inter` / system fonts).

---

## 📄 License
MIT License • Built for quantitative derivative analysis.

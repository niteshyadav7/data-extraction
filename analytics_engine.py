import os
import glob
import math
from datetime import datetime
import pandas as pd
import numpy as np

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False

DEFAULT_RISK_FREE_RATE = 0.0525  # 5.25%

def parse_num(val, default=0.0):
    if val is None or pd.isna(val):
        return default
    s = str(val).replace('"', '').replace("'", '').replace(',', '').strip()
    if s == '-' or s == '' or s.lower() == 'nan':
        return default
    try:
        return float(s)
    except ValueError:
        return default

def check_is_nse_market_open():
    now = datetime.now()
    is_weekday = 0 <= now.weekday() <= 4 # Mon=0, Fri=4
    mins = now.hour * 60 + now.minute
    start = 9 * 60 + 15
    end = 15 * 60 + 30
    is_open = is_weekday and (start <= mins <= end)
    return is_open, "LIVE SESSION" if is_open else "LAST SESSION CLOSE"

def norm_cdf(x):
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

def norm_pdf(x):
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

def calculate_greeks(S, K, T, r, sigma, option_type='CE'):
    if T <= 0:
        T = 0.0001
    if sigma <= 0:
        sigma = 0.01

    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    n_prime_d1 = norm_pdf(d1)

    if option_type.upper() == 'CE':
        delta = norm_cdf(d1)
        theta = (- (S * n_prime_d1 * sigma) / (2 * math.sqrt(T)) - r * K * math.exp(-r * T) * norm_cdf(d2)) / 365.0
        rho = (K * T * math.exp(-r * T) * norm_cdf(d2)) / 100.0
    else:
        delta = norm_cdf(d1) - 1.0
        theta = (- (S * n_prime_d1 * sigma) / (2 * math.sqrt(T)) + r * K * math.exp(-r * T) * norm_cdf(-d2)) / 365.0
        rho = (-K * T * math.exp(-r * T) * norm_cdf(-d2)) / 100.0

    gamma = n_prime_d1 / (S * sigma * math.sqrt(T))
    vega = (S * n_prime_d1 * math.sqrt(T)) / 100.0

    return {
        'delta': round(delta, 4),
        'gamma': round(gamma, 5),
        'theta': round(theta, 2),
        'vega': round(vega, 2),
        'rho': round(rho, 4)
    }

class AnalyticsEngine:
    def __init__(self, data_dir='.', risk_free_rate=DEFAULT_RISK_FREE_RATE):
        self.data_dir = data_dir
        self.risk_free_rate = risk_free_rate

    def find_file(self, keyword):
        for root, dirs, files in os.walk(self.data_dir):
            for f in files:
                if f.endswith('.csv') and keyword.lower() in f.lower():
                    return os.path.join(root, f)
        return None

    def run_analysis(self, output_excel='analysis.xlsx', output_csv='analysis.csv'):
        oc_file = self.find_file('option-chain')
        fut_file = self.find_file('fut')
        opt_file = self.find_file('opt')

        if not oc_file or not fut_file or not opt_file:
            print(f"Missing required CSV files in {self.data_dir}")
            return False

        print(f"Loading Real CSV Files:\n - Option Chain: {oc_file}\n - Futures: {fut_file}\n - Options: {opt_file}")

        lines = open(oc_file, encoding='utf-8', errors='ignore').readlines()
        if len(lines) > 2 and ('CALLS' in lines[0] or 'STRIKE' in lines[1]):
            rows = []
            for line in lines[2:]:
                parts = [p.strip().replace('"', '') for p in line.split(',')]
                if len(parts) >= 12:
                    strike = parse_num(parts[11])
                    if strike > 0:
                        rows.append({
                            'STRIKE_PRICE': strike,
                            'CE_OI': parse_num(parts[1]),
                            'CE_CHG_OI': parse_num(parts[2]),
                            'CE_VOLUME': parse_num(parts[3]),
                            'CE_IV': parse_num(parts[4]),
                            'CE_LTP': parse_num(parts[5]),
                            'PE_LTP': parse_num(parts[17]),
                            'PE_IV': parse_num(parts[18]),
                            'PE_VOLUME': parse_num(parts[19]),
                            'PE_CHG_OI': parse_num(parts[20]),
                            'PE_OI': parse_num(parts[21])
                        })
            df_oc = pd.DataFrame(rows)
        else:
            df_oc = pd.read_csv(oc_file)

        df_fut = pd.read_csv(fut_file)
        df_opt = pd.read_csv(opt_file)

        df_fut.columns = [str(c).strip().upper() for c in df_fut.columns]
        df_opt.columns = [str(c).strip().upper() for c in df_opt.columns]

        spot_price = 0.0
        futures_price = 0.0
        expiry = ''
        exchange_timestamp = ''

        if not df_fut.empty:
            first_row = df_fut.iloc[0]
            for col in df_fut.columns:
                if 'UNDERLYING' in col or 'SPOT' in col:
                    spot_price = parse_num(first_row[col])
                if 'LTP' in col:
                    futures_price = parse_num(first_row[col])
                if 'EXPIRY' in col:
                    expiry = str(first_row[col]).strip()
                if 'TIMESTAMP' in col:
                    exchange_timestamp = str(first_row[col]).strip()

        strikes = df_oc['STRIKE_PRICE'].values if 'STRIKE_PRICE' in df_oc else np.array([])
        if spot_price == 0.0 and len(strikes) > 0:
            spot_price = float(strikes[len(strikes) // 2])
        if futures_price == 0.0:
            futures_price = spot_price

        futures_premium = round(futures_price - spot_price, 2)
        basis_pct = round((futures_premium / spot_price) * 100, 2) if spot_price > 0 else 0.0

        is_open, market_status_label = check_is_nse_market_open()
        if not exchange_timestamp:
            exchange_timestamp = f"{datetime.now().strftime('%Y-%m-%d')} 15:30:00 IST [{market_status_label}]"

        days_to_expiry = 4
        if expiry:
            try:
                exp_dt = datetime.strptime(expiry, "%d-%b-%Y")
                days_to_expiry = max(1, (exp_dt - datetime.now()).days)
            except Exception:
                pass

        atm_strike = int(strikes[np.argmin(np.abs(strikes - spot_price))]) if len(strikes) > 0 else 0

        ce_oi_arr = df_oc['CE_OI'].values if 'CE_OI' in df_oc else np.array([])
        pe_oi_arr = df_oc['PE_OI'].values if 'PE_OI' in df_oc else np.array([])

        tot_ce_oi = int(np.sum(ce_oi_arr))
        tot_pe_oi = int(np.sum(pe_oi_arr))
        overall_pcr = round(tot_pe_oi / tot_ce_oi, 2) if tot_ce_oi > 0 else 0.0

        min_loss = float('inf')
        max_pain_strike = atm_strike
        for k in strikes:
            ce_loss = np.sum(ce_oi_arr * np.maximum(0, k - strikes))
            pe_loss = np.sum(pe_oi_arr * np.maximum(0, strikes - k))
            tot_loss = ce_loss + pe_loss
            if tot_loss < min_loss:
                min_loss = tot_loss
                max_pain_strike = int(k)

        atm_row = df_oc[df_oc['STRIKE_PRICE'] == atm_strike]
        ce_iv_val = float(atm_row['CE_IV'].iloc[0]) if len(atm_row) > 0 and 'CE_IV' in atm_row else 0.0
        pe_iv_val = float(atm_row['PE_IV'].iloc[0]) if len(atm_row) > 0 and 'PE_IV' in atm_row else 0.0
        atm_iv = round((ce_iv_val + pe_iv_val) / 2.0, 2) if (ce_iv_val > 0 or pe_iv_val > 0) else round(max(ce_iv_val, pe_iv_val), 2)

        T_years = max(days_to_expiry, 0.5) / 365.0
        expected_move = round(spot_price * (atm_iv / 100.0) * math.sqrt(T_years), 2) if atm_iv > 0 else 0.0
        upper_bound = round(spot_price + expected_move, 2)
        lower_bound = round(spot_price - expected_move, 2)

        hv_annualized = 0.0
        if YFINANCE_AVAILABLE:
            try:
                tk = yf.Ticker("^NSEI")
                hist = tk.history(period="1mo")
                if not hist.empty:
                    log_ret = np.log(hist['Close'] / hist['Close'].shift(1)).dropna()
                    hv_annualized = round(float(log_ret.std() * np.sqrt(252) * 100), 2)
            except Exception:
                pass

        greeks_list = []
        for idx, row in df_oc.iterrows():
            s = row['STRIKE_PRICE']
            ce_iv = float(row.get('CE_IV', 0)) / 100.0
            pe_iv = float(row.get('PE_IV', 0)) / 100.0

            ce_g = calculate_greeks(spot_price, s, T_years, self.risk_free_rate, ce_iv if ce_iv > 0 else 0.14, 'CE')
            pe_g = calculate_greeks(spot_price, s, T_years, self.risk_free_rate, pe_iv if pe_iv > 0 else 0.14, 'PE')

            greeks_list.append({
                'Strike': int(s),
                'CE Delta': ce_g['delta'],
                'CE Gamma': ce_g['gamma'],
                'CE Theta': ce_g['theta'],
                'CE Vega': ce_g['vega'],
                'PE Delta': pe_g['delta'],
                'PE Gamma': pe_g['gamma'],
                'PE Theta': pe_g['theta'],
                'PE Vega': pe_g['vega'],
            })

        df_greeks = pd.DataFrame(greeks_list)

        # Export Excel (analysis.xlsx)
        with pd.ExcelWriter(output_excel, engine='openpyxl') as writer:
            pd.DataFrame([
                {'Metric': 'Underlying', 'Value': 'NIFTY'},
                {'Metric': 'Spot Price', 'Value': spot_price},
                {'Metric': 'Futures Price', 'Value': futures_price},
                {'Metric': 'Futures Premium', 'Value': futures_premium},
                {'Metric': 'Basis %', 'Value': f"{basis_pct}%"},
                {'Metric': 'Expiry', 'Value': expiry},
                {'Metric': 'Days To Expiry', 'Value': days_to_expiry},
                {'Metric': 'Exchange Feed Timestamp', 'Value': exchange_timestamp},
                {'Metric': 'Market Status', 'Value': market_status_label},
                {'Metric': 'Risk-Free Rate', 'Value': f"{self.risk_free_rate * 100}%"}
            ]).to_excel(writer, sheet_name='Market Summary', index=False)

            pd.DataFrame([
                {'Metric': 'Overall PCR', 'Value': overall_pcr},
                {'Metric': 'ATM Strike', 'Value': atm_strike},
                {'Metric': 'Max Pain Strike', 'Value': max_pain_strike},
                {'Metric': 'ATM IV', 'Value': f"{atm_iv}%"},
                {'Metric': 'Expected Move', 'Value': f"±{expected_move} pts"},
                {'Metric': 'Upper Target Boundary', 'Value': upper_bound},
                {'Metric': 'Lower Target Boundary', 'Value': lower_bound},
                {'Metric': 'Annualized HV', 'Value': f"{hv_annualized}%"}
            ]).to_excel(writer, sheet_name='Key Metrics', index=False)

            df_greeks.to_excel(writer, sheet_name='Greeks Table', index=False)
            df_oc.to_excel(writer, sheet_name='Option Chain', index=False)

        # Export CSV (analysis.csv)
        with open(output_csv, 'w', encoding='utf-8') as f:
            f.write("=== MARKET SUMMARY ===\n")
            f.write(f"Underlying,NIFTY\nSpot Price,{spot_price}\nFutures Price,{futures_price}\nFutures Premium,{futures_premium}\nBasis %,{basis_pct}%\nExpiry,{expiry}\nDays To Expiry,{days_to_expiry}\nExchange Feed Timestamp,{exchange_timestamp}\nMarket Status,{market_status_label}\nRisk-Free Rate,{self.risk_free_rate * 100}%\n\n")

            f.write("=== KEY METRICS & EXPECTED MOVE ===\n")
            f.write(f"Overall PCR,{overall_pcr}\nATM Strike,{atm_strike}\nMax Pain Strike,{max_pain_strike}\nATM IV,{atm_iv}%\nExpected Move,±{expected_move} pts\nUpper Target Boundary,{upper_bound}\nLower Target Boundary,{lower_bound}\nAnnualized HV,{hv_annualized}%\n\n")

            f.write("=== GREEKS TABLE ===\n")
            df_greeks.to_csv(f, index=False)
            f.write("\n=== COMPLETE OPTION CHAIN ===\n")
            df_oc.to_csv(f, index=False)

        print(f"Phase 2 Analytics completed successfully.\n - Excel: {output_excel}\n - CSV: {output_csv}")
        return True

if __name__ == '__main__':
    engine = AnalyticsEngine()
    engine.run_analysis()

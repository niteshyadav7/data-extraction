import os
import sys
import time
import json
import requests
from datetime import datetime
import pandas as pd
import numpy as np

from analytics_engine import AnalyticsEngine

class NSELiveFetcher:
    def __init__(self, symbol='NIFTY'):
        self.symbol = symbol
        self.base_url = "https://www.nseindia.com"
        self.option_chain_url = f"https://www.nseindia.com/api/option-chain-indices?symbol={self.symbol}"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.nseindia.com/option-chain"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.cookies_initialized = False

    def init_session(self):
        try:
            res = self.session.get(self.base_url, timeout=10)
            if res.status_code == 200:
                self.cookies_initialized = True
                return True
        except Exception as e:
            print(f"Session init notice: {e}")
        return False

    def fetch_live_data(self):
        if not self.cookies_initialized:
            self.init_session()

        try:
            res = self.session.get(self.option_chain_url, timeout=10)
            if res.status_code in (401, 403):
                self.init_session()
                res = self.session.get(self.option_chain_url, timeout=10)

            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"Live fetch error: {e}")

        return None

    def convert_json_to_dfs(self, json_data):
        if not json_data or 'records' not in json_data:
            return None, None, None

        records = json_data['records']
        data = records.get('data', [])
        underlying_val = float(records.get('underlyingValue', 0))
        expiry_dates = records.get('expiryDates', [])
        target_expiry = expiry_dates[0] if expiry_dates else ''

        oc_rows = []
        opt_rows = []

        for item in data:
            if item.get('expiryDate') == target_expiry:
                strike = item.get('strikePrice', 0)
                ce = item.get('CE', {})
                pe = item.get('PE', {})

                ce_oi = ce.get('openInterest', 0)
                ce_chg_oi = ce.get('changeinOpenInterest', 0)
                ce_vol = ce.get('totalTradedVolume', 0)
                ce_iv = ce.get('impliedVolatility', 0)
                ce_ltp = ce.get('lastPrice', 0)
                ce_bid = ce.get('buyPrice1', 0)
                ce_ask = ce.get('sellPrice1', 0)

                pe_oi = pe.get('openInterest', 0)
                pe_chg_oi = pe.get('changeinOpenInterest', 0)
                pe_vol = pe.get('totalTradedVolume', 0)
                pe_iv = pe.get('impliedVolatility', 0)
                pe_ltp = pe.get('lastPrice', 0)
                pe_bid = pe.get('buyPrice1', 0)
                pe_ask = pe.get('sellPrice1', 0)

                oc_rows.append({
                    'STRIKE_PRICE': strike,
                    'CE_OI': ce_oi,
                    'CE_CHG_OI': ce_chg_oi,
                    'CE_VOLUME': ce_vol,
                    'CE_IV': ce_iv,
                    'CE_LTP': ce_ltp,
                    'CE_BID': ce_bid,
                    'CE_ASK': ce_ask,
                    'PE_BID': pe_bid,
                    'PE_ASK': pe_ask,
                    'PE_LTP': pe_ltp,
                    'PE_IV': pe_iv,
                    'PE_VOLUME': pe_vol,
                    'PE_CHG_OI': pe_chg_oi,
                    'PE_OI': pe_oi,
                    'SPOT_PRICE': underlying_val,
                    'EXPIRY_DATE': target_expiry
                })

                if ce:
                    opt_rows.append({
                        'SYMBOL': self.symbol,
                        'EXPIRY_DATE': target_expiry,
                        'OPTION_TYPE': 'CE',
                        'STRIKE_PRICE': strike,
                        'LTP': ce_ltp,
                        'VOLUME': ce_vol,
                        'OPEN_INT': ce_oi,
                        'CHG_OI': ce_chg_oi,
                        'IV': ce_iv,
                        'BID_PRICE': ce_bid,
                        'ASK_PRICE': ce_ask
                    })
                if pe:
                    opt_rows.append({
                        'SYMBOL': self.symbol,
                        'EXPIRY_DATE': target_expiry,
                        'OPTION_TYPE': 'PE',
                        'STRIKE_PRICE': strike,
                        'LTP': pe_ltp,
                        'VOLUME': pe_vol,
                        'OPEN_INT': pe_oi,
                        'CHG_OI': pe_chg_oi,
                        'IV': pe_iv,
                        'BID_PRICE': pe_bid,
                        'ASK_PRICE': pe_ask
                    })

        df_oc = pd.DataFrame(oc_rows)
        df_opt = pd.DataFrame(opt_rows)

        # Futures df parsed strictly from real data
        df_fut = pd.DataFrame([{
            'SYMBOL': self.symbol,
            'EXPIRY_DATE': target_expiry,
            'LTP': underlying_val,
            'SPOT_PRICE': underlying_val,
            'CURRENT_DATE': datetime.now().strftime('%Y-%m-%d'),
            'CURRENT_TIME': datetime.now().strftime('%H:%M:%S')
        }])

        return df_oc, df_fut, df_opt

    def save_live_csvs(self, df_oc, df_fut, df_opt, output_dir='.'):
        if df_oc is None or df_oc.empty:
            return

        df_oc.to_csv(os.path.join(output_dir, 'option-chain.csv'), index=False)
        df_fut.to_csv(os.path.join(output_dir, 'nse50_fut.csv'), index=False)
        df_opt.to_csv(os.path.join(output_dir, 'nse50_opt.csv'), index=False)

        public_dir = os.path.join(output_dir, 'public')
        if os.path.exists(public_dir):
            df_oc.to_csv(os.path.join(public_dir, 'option-chain.csv'), index=False)
            df_fut.to_csv(os.path.join(public_dir, 'nse50_fut.csv'), index=False)
            df_opt.to_csv(os.path.join(public_dir, 'nse50_opt.csv'), index=False)

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Real NSE Option Chain saved! Spot: ₹{df_fut['SPOT_PRICE'].iloc[0]}")

    def run_live_loop(self, interval_seconds=60):
        print(f"Starting Live Data Fetcher Loop for {self.symbol} (Interval: {interval_seconds}s)...")
        engine = AnalyticsEngine()

        while True:
            try:
                json_data = self.fetch_live_data()
                if json_data:
                    df_oc, df_fut, df_opt = self.convert_json_to_dfs(json_data)
                    if df_oc is not None and not df_oc.empty:
                        self.save_live_csvs(df_oc, df_fut, df_opt)
                        engine.run_analysis()
            except Exception as e:
                print(f"Loop error: {e}")

            time.sleep(interval_seconds)

if __name__ == '__main__':
    fetcher = NSELiveFetcher()
    fetcher.run_live_loop(interval_seconds=60)

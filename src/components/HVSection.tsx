import React, { useState } from 'react';
import type { HistoricalVolatilityData } from '../types';
import { BarChart3, Globe, RefreshCw } from 'lucide-react';

interface HVSectionProps {
  data: HistoricalVolatilityData;
  onRefreshYahoo: () => void;
}

export const HVSection: React.FC<HVSectionProps> = ({ data, onRefreshYahoo }) => {
  const [showCandlesTable, setShowCandlesTable] = useState(false);

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--accent-gold)" />
            Step 14: Historical Volatility (HV) Analysis
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Source: <span className="pill-code">{data.source}</span> • Lookback: {data.lookbackDays} Trading Days
          </p>
        </div>

        <button
          onClick={onRefreshYahoo}
          className="btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} />
          Sync Yahoo Finance OHLCV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Annualized Historical Volatility (HV)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            {data.annualizedHv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Formula: Daily StdDev × √252</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Return Std Dev (σ)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {(data.dailyStdDev * 100).toFixed(3)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Standard Deviation of Log Returns</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} /> Historical Ticker
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            ^NSEI / NIFTY.NS
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Nifty 50 Index</div>
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowCandlesTable(!showCandlesTable)}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', marginBottom: '12px' }}
        >
          {showCandlesTable ? 'Hide Historical OHLCV Table' : 'Show 30-Day Historical OHLCV Table'}
        </button>

        {showCandlesTable && (
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table className="dashboard-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
                  <th>Volume</th>
                  <th>Daily Log Return</th>
                </tr>
              </thead>
              <tbody>
                {data.candles.map(c => (
                  <tr key={c.date}>
                    <td style={{ fontWeight: 600 }}>{c.date}</td>
                    <td>₹{c.open.toFixed(2)}</td>
                    <td style={{ color: 'var(--color-green)' }}>₹{c.high.toFixed(2)}</td>
                    <td style={{ color: 'var(--color-red)' }}>₹{c.low.toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>₹{c.close.toFixed(2)}</td>
                    <td>{c.volume.toLocaleString('en-IN')}</td>
                    <td style={{ color: c.logReturn >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {(c.logReturn * 100).toFixed(3)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

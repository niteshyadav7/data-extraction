import React from 'react';
import type { LiquidityRow } from '../types';
import { Droplet } from 'lucide-react';

interface LiquiditySectionProps {
  data: LiquidityRow[];
}

export const LiquiditySection: React.FC<LiquiditySectionProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Droplet size={20} color="var(--accent-gold)" />
          Step 8: Liquidity Analysis (Top Liquid Strikes)
        </h2>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Strike Price</th>
              <th>Option Type</th>
              <th>Bid Price</th>
              <th>Ask Price</th>
              <th>Bid-Ask Spread</th>
              <th>Total Volume</th>
              <th>Open Interest</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={`${row.strike}-${row.type}-${idx}`}>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.strike}</td>
                <td>
                  <span className={row.type === 'CE' ? 'badge-green' : 'badge-red'}>
                    {row.type}
                  </span>
                </td>
                <td>₹{row.bid.toFixed(2)}</td>
                <td>₹{row.ask.toFixed(2)}</td>
                <td style={{ fontWeight: 600, color: row.spread <= 1 ? 'var(--color-green)' : 'var(--text-main)' }}>
                  ₹{row.spread.toFixed(2)}
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent-gold-dark)' }}>
                  {row.volume.toLocaleString('en-IN')}
                </td>
                <td>{row.oi.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import type { FuturesAnalysisData } from '../types';
import { TrendingUp } from 'lucide-react';

interface FuturesAnalysisProps {
  data: FuturesAnalysisData;
}

export const FuturesAnalysis: React.FC<FuturesAnalysisProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="var(--accent-gold)" />
          Step 10: Futures Analysis
        </h2>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Open Price</th>
              <th>High Price</th>
              <th>Low Price</th>
              <th>LTP (Last Price)</th>
              <th>Total Volume</th>
              <th>Open Interest (OI)</th>
              <th>Premium Points</th>
              <th>Discount Points</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>₹{data.open.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>₹{data.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ color: 'var(--color-red)', fontWeight: 600 }}>₹{data.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ fontWeight: 700, fontSize: '1rem' }}>₹{data.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td>{data.volume.toLocaleString('en-IN')}</td>
              <td style={{ fontWeight: 600 }}>{data.openInterest.toLocaleString('en-IN')}</td>
              <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                {data.premium > 0 ? `+₹${data.premium}` : '₹0.00'}
              </td>
              <td style={{ color: 'var(--color-red)', fontWeight: 600 }}>
                {data.discount > 0 ? `-₹${data.discount}` : '₹0.00'}
              </td>
              <td>
                <span className={data.status === 'Premium' ? 'badge-green' : data.status === 'Discount' ? 'badge-red' : 'badge-neutral'}>
                  {data.status}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

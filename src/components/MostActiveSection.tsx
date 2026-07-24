import React from 'react';
import type { MostActiveData } from '../types';
import { Flame } from 'lucide-react';

interface MostActiveSectionProps {
  data: MostActiveData;
}

export const MostActiveSection: React.FC<MostActiveSectionProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={20} color="var(--accent-gold)" />
          Step 11: Most Active Options
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Top 10 by Volume */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            backgroundColor: 'var(--bg-sidebar)',
            padding: '10px 14px',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            Top 10 By Volume
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Strike</th>
                <th>Option Type</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {data.top10ByVolume.map((row, idx) => (
                <tr key={`vol-${row.strike}-${row.type}-${idx}`}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.strike}</td>
                  <td>
                    <span className={row.type === 'CE' ? 'badge-green' : 'badge-red'}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-gold-dark)' }}>
                    {row.value.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top 10 by OI */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            backgroundColor: 'var(--bg-sidebar)',
            padding: '10px 14px',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            Top 10 By Open Interest (OI)
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Strike</th>
                <th>Option Type</th>
                <th>Open Interest</th>
              </tr>
            </thead>
            <tbody>
              {data.top10ByOi.map((row, idx) => (
                <tr key={`oi-${row.strike}-${row.type}-${idx}`}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.strike}</td>
                  <td>
                    <span className={row.type === 'CE' ? 'badge-green' : 'badge-red'}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {row.value.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

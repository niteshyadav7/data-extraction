import React from 'react';
import type { SupportResistanceData } from '../types';
import { Shield, ShieldAlert } from 'lucide-react';

interface SupportResistanceProps {
  data: SupportResistanceData;
}

export const SupportResistance: React.FC<SupportResistanceProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-gold)" />
          Step 6: Support & Resistance Analysis
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Support Table */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            backgroundColor: 'var(--bg-green)',
            color: 'var(--color-green)',
            padding: '10px 14px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} /> Top 5 Support Levels (PE OI)
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Strike</th>
                <th>PE OI</th>
                <th>PE Change OI</th>
              </tr>
            </thead>
            <tbody>
              {data.top5Support.map((row, idx) => (
                <tr key={row.strike}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.strike}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-green)' }}>{row.oi.toLocaleString('en-IN')}</td>
                  <td style={{ color: row.chgOi >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {row.chgOi >= 0 ? `+${row.chgOi.toLocaleString('en-IN')}` : row.chgOi.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resistance Table */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            backgroundColor: 'var(--bg-red)',
            color: 'var(--color-red)',
            padding: '10px 14px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={16} /> Top 5 Resistance Levels (CE OI)
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Strike</th>
                <th>CE OI</th>
                <th>CE Change OI</th>
              </tr>
            </thead>
            <tbody>
              {data.top5Resistance.map((row, idx) => (
                <tr key={row.strike}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.strike}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-red)' }}>{row.oi.toLocaleString('en-IN')}</td>
                  <td style={{ color: row.chgOi >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {row.chgOi >= 0 ? `+${row.chgOi.toLocaleString('en-IN')}` : row.chgOi.toLocaleString('en-IN')}
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

import React from 'react';
import type { SupportResistanceData } from '../types';
import { Shield, ShieldAlert, Target } from 'lucide-react';

interface SupportResistanceProps {
  data: SupportResistanceData;
  atmCeLtp?: number;
  atmPeLtp?: number;
}

export const SupportResistance: React.FC<SupportResistanceProps> = ({
  data,
  atmCeLtp = 250,
  atmPeLtp = 250
}) => {
  const topSupport1 = data.top5Support[0]?.strike || 0;
  const topSupport2 = data.top5Support[1]?.strike || 0;
  const topResist1 = data.top5Resistance[0]?.strike || 0;
  const topResist2 = data.top5Resistance[1]?.strike || 0;

  // Calculate 4-Level Quant Reversal Targets (EOR1, EOR2, EOS1, EOS2)
  const eor1 = topResist1 > 0 ? Math.round(topResist1 + atmCeLtp) : 0;
  const eor2 = topResist2 > 0 ? Math.round(topResist2 + atmCeLtp) : 0;
  const eos1 = topSupport1 > 0 ? Math.round(topSupport1 - atmPeLtp) : 0;
  const eos2 = topSupport2 > 0 ? Math.round(topSupport2 - atmPeLtp) : 0;

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-gold)" />
          Step 6: Support & Resistance Analysis & Reversal Levels
        </h2>
      </div>

      {/* 4-Level Reversal Zones Cards (EOR1, EOR2, EOS1, EOS2) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ backgroundColor: '#E2F0E5', border: '1px solid var(--color-green)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> EOS1 (PRIMARY SUPPORT REVERSAL)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '2px' }}>
            ₹{eos1.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Strike {topSupport1} - ATM PE LTP (₹{atmPeLtp.toFixed(1)})
          </div>
        </div>

        <div style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> EOS2 (SECONDARY SUPPORT REVERSAL)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '2px' }}>
            ₹{eos2.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Strike {topSupport2} - ATM PE LTP (₹{atmPeLtp.toFixed(1)})
          </div>
        </div>

        <div style={{ backgroundColor: '#FADBD8', border: '1px solid var(--color-red)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> EOR1 (PRIMARY RESISTANCE REVERSAL)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '2px' }}>
            ₹{eor1.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Strike {topResist1} + ATM CE LTP (₹{atmCeLtp.toFixed(1)})
          </div>
        </div>

        <div style={{ backgroundColor: '#FCE8E6', border: '1px solid #EF9A9A', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> EOR2 (SECONDARY RESISTANCE REVERSAL)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '2px' }}>
            ₹{eor2.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Strike {topResist2} + ATM CE LTP (₹{atmCeLtp.toFixed(1)})
          </div>
        </div>
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

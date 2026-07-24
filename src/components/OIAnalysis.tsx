import React, { useState } from 'react';
import type { OiAnalysisData } from '../types';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OIAnalysisProps {
  data: OiAnalysisData;
}

export const OIAnalysis: React.FC<OIAnalysisProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'callWriting' | 'putWriting' | 'callUnwinding' | 'putUnwinding'>('callWriting');

  const tabs = [
    { key: 'callWriting' as const, label: 'Top 10 Call Writing', count: data.top10CallWriting.length },
    { key: 'putWriting' as const, label: 'Top 10 Put Writing', count: data.top10PutWriting.length },
    { key: 'callUnwinding' as const, label: 'Top 10 Call Unwinding', count: data.top10CallUnwinding.length },
    { key: 'putUnwinding' as const, label: 'Top 10 Put Unwinding', count: data.top10PutUnwinding.length },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'callWriting': return { list: data.top10CallWriting, isCall: true, isWriting: true };
      case 'putWriting': return { list: data.top10PutWriting, isCall: false, isWriting: true };
      case 'callUnwinding': return { list: data.top10CallUnwinding, isCall: true, isWriting: false };
      case 'putUnwinding': return { list: data.top10PutUnwinding, isCall: false, isWriting: false };
    }
  };

  const current = getActiveData();

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="var(--accent-gold)" />
          Step 7: Open Interest (OI) Build-up Analysis
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-gold)' : '2px solid transparent',
              backgroundColor: activeTab === tab.key ? 'var(--bg-main)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-gold-dark)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Strike Price</th>
              <th>Option Type</th>
              <th>OI Change (Build-up / Cut)</th>
              <th>Total Open Interest</th>
              <th>Action Indicator</th>
            </tr>
          </thead>
          <tbody>
            {current.list.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No strikes found for {activeTab}.
                </td>
              </tr>
            ) : (
              current.list.map((row, idx) => (
                <tr key={row.strike}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.strike}</td>
                  <td>
                    <span className={current.isCall ? 'badge-green' : 'badge-red'}>
                      {current.isCall ? 'CE' : 'PE'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: current.isWriting ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {row.chgOi >= 0 ? `+${row.chgOi.toLocaleString('en-IN')}` : row.chgOi.toLocaleString('en-IN')}
                  </td>
                  <td>{row.oi.toLocaleString('en-IN')}</td>
                  <td>
                    {current.isWriting ? (
                      <span className="badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={14} /> {current.isCall ? 'Call Writing' : 'Put Writing'}
                      </span>
                    ) : (
                      <span className="badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowDownRight size={14} /> {current.isCall ? 'Call Unwinding' : 'Put Unwinding'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

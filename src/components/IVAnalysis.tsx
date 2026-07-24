import React from 'react';
import type { IvAnalysisData } from '../types';
import { Activity } from 'lucide-react';

interface IVAnalysisProps {
  data: IvAnalysisData;
}

export const IVAnalysis: React.FC<IVAnalysisProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-gold)" />
          Step 9: Implied Volatility (IV) Analysis
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ATM IV</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            {data.atmIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Average IV of ATM CE & PE</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average CE IV</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)', marginTop: '4px' }}>
            {data.avgCeIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across all active Call strikes</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average PE IV</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-red)', marginTop: '4px' }}>
            {data.avgPeIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across all active Put strikes</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest IV Strike</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestIvStrike} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold-dark)' }}>({data.highestIvValue}%)</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lowest IV Strike</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.lowestIvStrike} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold-dark)' }}>({data.lowestIvValue}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

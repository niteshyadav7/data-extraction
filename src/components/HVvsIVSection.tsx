import React from 'react';
import type { HvVsIvData } from '../types';
import { Scale } from 'lucide-react';

interface HVvsIVSectionProps {
  data: HvVsIvData;
}

export const HVvsIVSection: React.FC<HVvsIVSectionProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={20} color="var(--accent-gold)" />
          Step 15: HV vs IV Volatility Comparison
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Compares realized Historical Volatility (HV) against option market Implied Volatility (ATM IV).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical Volatility (HV)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.hv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Realized 30-Day Index Volatility</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current ATM IV</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            {data.atmIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Market Implied Expiry Volatility</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difference (HV - ATM IV)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: data.difference >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
            {data.difference >= 0 ? `+${data.difference}%` : `${data.difference}%`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Spread between HV and IV</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HV / IV Ratio</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.ratio}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {data.ratio > 1 ? 'HV > IV (Realized > Implied)' : 'IV > HV (Implied > Realized)'}
          </div>
        </div>
      </div>

      <div style={{
        padding: '14px 18px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        fontSize: '0.9rem',
        fontWeight: 600
      }}>
        <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Volatility Regime Interpretation:</span>
        <span style={{ color: 'var(--text-main)' }}>{data.interpretation}</span>
      </div>
    </div>
  );
};

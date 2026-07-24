import React from 'react';
import type { OptionChainSummaryData } from '../types';
import { Layers } from 'lucide-react';

interface OptionChainSummaryProps {
  data: OptionChainSummaryData;
}

export const OptionChainSummary: React.FC<OptionChainSummaryProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="var(--accent-gold)" />
          Step 3: Option Chain Summary
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Call & Put OI */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Call OI</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-green)', marginTop: '4px' }}>
            {data.totalCallOi.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Put OI</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-red)', marginTop: '4px' }}>
            {data.totalPutOi.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Call Volume</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-green)', marginTop: '4px' }}>
            {data.totalCallVolume.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Put Volume</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-red)', marginTop: '4px' }}>
            {data.totalPutVolume.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Highest OI Strikes */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest CE OI Strike</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestCeOiStrike} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.highestCeOiValue.toLocaleString('en-IN')} OI)</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest PE OI Strike</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestPeOiStrike} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.highestPeOiValue.toLocaleString('en-IN')} OI)</span>
          </div>
        </div>

        {/* Highest Volume Strikes */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest CE Volume Strike</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestCeVolStrike} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.highestCeVolValue.toLocaleString('en-IN')} Vol)</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest PE Volume Strike</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestPeVolStrike} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.highestPeVolValue.toLocaleString('en-IN')} Vol)</span>
          </div>
        </div>

        {/* Highest IVs */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest CE IV</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestCeIvValue}% <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.highestCeIvStrike})</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest PE IV</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestPeIvValue}% <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.highestPeIvStrike})</span>
          </div>
        </div>

        {/* Lowest IVs */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lowest CE IV</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.lowestCeIvValue}% <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.lowestCeIvStrike})</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lowest PE IV</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.lowestPeIvValue}% <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({data.lowestPeIvStrike})</span>
          </div>
        </div>

        {/* ATM Strike */}
        <div style={{ backgroundColor: '#F8F1D8', padding: '14px', borderRadius: '6px', border: '1px solid #E5D5A4' }}>
          <div style={{ fontSize: '0.8rem', color: '#68541A', fontWeight: 600 }}>ATM Strike</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4D3B07', marginTop: '4px' }}>
            {data.atmStrike}
          </div>
        </div>
      </div>
    </div>
  );
};

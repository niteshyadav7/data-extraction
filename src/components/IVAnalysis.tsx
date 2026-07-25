import React from 'react';
import type { IvAnalysisData } from '../types';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface IVAnalysisProps {
  data: IvAnalysisData;
}

export const IVAnalysis: React.FC<IVAnalysisProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-gold)" />
          Step 9: Implied Volatility (IV) & Tail Crash Risk Skew
        </h2>
      </div>

      {/* Tail Risk Skew Alert Banner */}
      <div style={{
        backgroundColor: data.skewRegime === 'CRASH_HEDGING' ? '#FDEDEC' : data.skewRegime === 'BULLISH_FOMO' ? '#E8F5E9' : '#FEF9E7',
        border: `1.5px solid ${data.skewRegime === 'CRASH_HEDGING' ? '#FADBD8' : data.skewRegime === 'BULLISH_FOMO' ? '#A5D6A7' : '#F9E79F'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {data.skewRegime === 'CRASH_HEDGING' ? <AlertTriangle size={20} color="var(--color-red)" /> : <ShieldCheck size={20} color="var(--color-green)" />}
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: data.skewRegime === 'CRASH_HEDGING' ? 'var(--color-red)' : data.skewRegime === 'BULLISH_FOMO' ? 'var(--color-green)' : '#B7950B' }}>
              {data.skewRegime === 'CRASH_HEDGING' ? '🔴 INSTITUTIONAL CRASH HEDGING SKEW (PE IV Spiking)' : data.skewRegime === 'BULLISH_FOMO' ? '🟢 BULLISH CALL BUYING SKEW (CE IV Demand)' : '🟡 BALANCED VOLATILITY SKEW'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {data.skewRegimeLabel} | Put IV Skew: <strong>{data.putIvSkew >= 0 ? `+${data.putIvSkew}%` : `${data.putIvSkew}%`}</strong>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '6px', backgroundColor: '#FFF', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
          Vol Regime: <strong>{data.volatilityRegime.replace('_', ' ')}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Implied India VIX */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1.5px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold-dark)' }}>Implied India VIX</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            {data.impliedVix}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>CBOE/NSE Variance Swap Curve</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ATM IV</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.atmIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Average IV of ATM CE & PE</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average CE IV</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)', marginTop: '4px' }}>
            {data.avgCeIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Call IV Skew: {data.callIvSkew >= 0 ? `+${data.callIvSkew}%` : `${data.callIvSkew}%`}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average PE IV</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-red)', marginTop: '4px' }}>
            {data.avgPeIv}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Put IV Skew: {data.putIvSkew >= 0 ? `+${data.putIvSkew}%` : `${data.putIvSkew}%`}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest IV Strike</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.highestIvStrike} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold-dark)' }}>({data.highestIvValue}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

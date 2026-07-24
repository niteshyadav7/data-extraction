import React from 'react';
import type { PcrAnalysisData } from '../types';
import { Activity } from 'lucide-react';

interface PCRSectionProps {
  data: PcrAnalysisData;
}

export const PCRSection: React.FC<PCRSectionProps> = ({ data }) => {
  const pcr = data.overallPcr;
  let gaugeColor = '#D4AC0D'; // Neutral Gold
  let sentimentLabel = 'Neutral Sentiment';

  if (pcr > 1.2) {
    gaugeColor = '#27AE60'; // Bullish Green
    sentimentLabel = 'Bullish Sentiment (Strong Put Writing)';
  } else if (pcr < 0.8) {
    gaugeColor = '#E74C3C'; // Bearish Red
    sentimentLabel = 'Bearish Sentiment (Heavy Call Buying)';
  }

  // Calculate needle percentage (0.0 PCR = 0%, 1.0 PCR = 50%, 2.0+ PCR = 100%)
  const gaugePercent = Math.min(Math.max((pcr / 2.0) * 100, 5), 95);

  const pressureRatio = data.buyingPressureRatio || 1.0;
  const isBullishPressure = pressureRatio >= 1.0;

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={20} color="var(--accent-gold)" />
        Step 3: Put-Call Ratio (PCR) & Institutional Volume Pressure Ratio
      </h2>

      {/* PCR & Buying Pressure Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* PCR Visual Gauge Meter Card */}
        <div style={{
          backgroundColor: 'var(--bg-main)',
          borderRadius: '10px',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              PCR SENTIMENT GAUGE
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '6px',
              backgroundColor: `${gaugeColor}15`,
              color: gaugeColor,
              border: `1px solid ${gaugeColor}40`
            }}>
              {sentimentLabel}
            </span>
          </div>

          {/* Gauge Bar */}
          <div style={{
            position: 'relative',
            height: '14px',
            borderRadius: '7px',
            background: 'linear-gradient(90deg, #E74C3C 0%, #F39C12 40%, #27AE60 100%)',
            marginTop: '10px',
            marginBottom: '8px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-3px',
              left: `${gaugePercent}%`,
              transform: 'translateX(-50%)',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#FFF',
              border: `3px solid ${gaugeColor}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>0.0 (Bearish)</span>
            <span>1.0 (Neutral)</span>
            <span>2.0+ (Bullish)</span>
          </div>
        </div>

        {/* Institutional Net Volume Pressure Card */}
        <div style={{
          backgroundColor: 'var(--bg-main)',
          borderRadius: '10px',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              INSTITUTIONAL BUYING PRESSURE RATIO
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isBullishPressure ? '#E8F5E9' : '#FDEDEC',
              color: isBullishPressure ? 'var(--color-green)' : 'var(--color-red)',
              border: `1px solid ${isBullishPressure ? '#A5D6A7' : '#FADBD8'}`
            }}>
              {pressureRatio.toFixed(2)}x Ratio
            </span>
          </div>

          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isBullishPressure ? 'var(--color-green)' : 'var(--color-red)', marginTop: '2px' }}>
            {data.buyingPressureInterpretation || 'Balanced Buyer/Seller Pressure'}
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Formula: (CE Vol + PE Chg OI) / (PE Vol + CE Chg OI)
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall PCR</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: gaugeColor, marginTop: '4px' }}>
            {pcr}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Market Interpretation</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
            {data.interpretation}
          </div>
        </div>
      </div>
    </div>
  );
};

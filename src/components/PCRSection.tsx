import React from 'react';
import type { PcrAnalysisData } from '../types';

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

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
        Step 3: Put-Call Ratio (PCR) Analysis
      </h2>

      {/* PCR Visual Gauge Meter */}
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '20px',
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
          margin: '12px 0 8px 0'
        }}>
          {/* Gauge Needle Indicator */}
          <div style={{
            position: 'absolute',
            left: `${gaugePercent}%`,
            top: '-4px',
            transform: 'translateX(-50%)',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#FFF',
            border: `3px solid ${gaugeColor}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            transition: 'left 0.4s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>0.0 (Extremely Bearish)</span>
          <span>0.8 (Neutral Threshold)</span>
          <span>1.2 (Bullish Threshold)</span>
          <span>2.0+ (Strong Bullish)</span>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Status / Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Overall Strike PCR</td>
              <td style={{ fontSize: '1.1rem', fontWeight: 700, color: gaugeColor }}>
                {data.overallPcr.toFixed(2)}
              </td>
              <td>
                <span className={`pill ${data.overallPcr >= 1.0 ? 'pill-green' : 'pill-red'}`}>
                  {data.interpretation}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

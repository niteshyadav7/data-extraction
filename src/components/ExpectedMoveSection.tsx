import React from 'react';
import type { ExpectedMoveData } from '../types';
import { Maximize2, ArrowUp, ArrowDown } from 'lucide-react';

interface ExpectedMoveSectionProps {
  data: ExpectedMoveData;
  spotPrice: number;
  daysToExpiry: number;
  atmIv: number;
}

export const ExpectedMoveSection: React.FC<ExpectedMoveSectionProps> = ({
  data,
  spotPrice,
  daysToExpiry,
  atmIv
}) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Maximize2 size={20} color="var(--accent-gold)" />
          Step 12: Expected Move (Expiry Volatility Cone)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Calculated using formula: <span className="pill-code">Spot × ATM_IV × √(DTE / 365)</span> = ₹{spotPrice} × {atmIv}% × √({daysToExpiry}/365)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div style={{
          backgroundColor: '#F8F1D8',
          border: '1px solid #E5D5A4',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#68541A', fontWeight: 600 }}>Expected Move Range</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#4D3B07', margin: '4px 0' }}>
            ±{data.expectedMovePoints} Points
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#7A6423' }}>
            (±{data.expectedMovePercentage}%)
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-green)',
          border: '1px solid var(--color-green)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUp size={16} /> Upper Expected Boundary
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>
            ₹{data.upperBound.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-green)', marginTop: '2px' }}>
            Expected resistance limit for current expiry
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-red)',
          border: '1px solid var(--color-red)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowDown size={16} /> Lower Expected Boundary
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '4px' }}>
            ₹{data.lowerBound.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-red)', marginTop: '2px' }}>
            Expected support limit for current expiry
          </div>
        </div>
      </div>
    </div>
  );
};

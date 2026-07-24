import React from 'react';
import type { MaxPainData } from '../types';
import { Target, Compass } from 'lucide-react';

interface MaxPainSectionProps {
  data: MaxPainData;
  spotPrice: number;
}

export const MaxPainSection: React.FC<MaxPainSectionProps> = ({ data, spotPrice }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="var(--accent-gold)" />
          Step 5: Max Pain Analysis
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <div style={{
          backgroundColor: '#F8F1D8',
          border: '1px solid #E5D5A4',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#68541A', fontWeight: 600 }}>Max Pain Strike</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#4D3B07', margin: '6px 0' }}>
            {data.maxPainStrike}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7A6423' }}>
            Strike where option buyers lose maximum cumulative value at expiry
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={16} /> Distance From Spot (₹{spotPrice.toLocaleString('en-IN')})
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{data.distanceFromSpot >= 0 ? `+${data.distanceFromSpot}` : data.distanceFromSpot} Points</span>
            <span className={data.distanceFromSpot >= 0 ? 'badge-green' : 'badge-red'}>
              {data.distancePercentage >= 0 ? `+${data.distancePercentage}%` : `${data.distancePercentage}%`}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {data.distanceFromSpot === 0
              ? 'Spot price is exactly at Max Pain Strike.'
              : data.distanceFromSpot > 0
              ? `Max Pain is ${data.distanceFromSpot} points ABOVE current spot price.`
              : `Max Pain is ${Math.abs(data.distanceFromSpot)} points BELOW current spot price.`}
          </div>
        </div>
      </div>
    </div>
  );
};

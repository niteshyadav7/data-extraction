import React from 'react';
import { DollarSign, Calendar, Clock, Activity } from 'lucide-react';
import type { MarketSummaryData } from '../types';

interface MarketSummaryProps {
  data: MarketSummaryData;
}

export const MarketSummary: React.FC<MarketSummaryProps> = ({ data }) => {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-gold)" />
          Step 2: Market Summary
        </h2>

        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            backgroundColor: data.isMarketOpen ? '#E2F0E5' : '#FDE8E8',
            color: data.isMarketOpen ? 'var(--color-green)' : 'var(--color-red)',
            border: `1px solid ${data.isMarketOpen ? 'var(--color-green)' : 'var(--color-red)'}`
          }}
        >
          {data.isMarketOpen ? '🟢 LIVE MARKET SESSION' : '🔴 LAST SESSION CLOSE'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Underlying
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.underlying}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} /> Spot Price
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ₹{data.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Futures Price
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ₹{data.futuresPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Futures Premium / Discount
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: data.futuresPremiumDiscount >= 0 ? 'var(--color-green)' : 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ₹{Math.abs(data.futuresPremiumDiscount).toFixed(2)}
            <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: data.futuresPremiumDiscount >= 0 ? '#E2F0E5' : '#FDE8E8' }}>
              {data.premiumDiscountType}
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} /> Current Expiry
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.currentExpiry}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> Days To Expiry
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-gold-dark)' }}>
            {data.daysToExpiry} Days
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> Exchange Last Traded Feed Time
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.timestamp}
          </div>
        </div>
      </div>
    </div>
  );
};

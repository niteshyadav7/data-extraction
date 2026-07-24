import React from 'react';
import type { MarketSummaryData } from '../types';
import { Activity, Calendar, Clock, DollarSign, Tag, TrendingUp } from 'lucide-react';

interface MarketSummaryProps {
  data: MarketSummaryData;
}

export const MarketSummary: React.FC<MarketSummaryProps> = ({ data }) => {
  const isPremium = data.premiumDiscountType === 'Premium';

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-gold)" />
          Step 2: Market Summary
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={14} /> Underlying
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.underlying}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={14} /> Spot Price
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            ₹{data.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} /> Futures Price
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            ₹{data.futuresPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Futures Premium / Discount
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>₹{data.futuresPremiumDiscount}</span>
            <span className={isPremium ? 'badge-green' : 'badge-red'}>
              {data.premiumDiscountType}
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Current Expiry
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.currentExpiry}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Days To Expiry
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            {data.daysToExpiry} Days
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Current Date
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.currentDate}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Current Time
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            {data.currentTime}
          </div>
        </div>
      </div>
    </div>
  );
};

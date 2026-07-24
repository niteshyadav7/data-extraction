import React from 'react';
import { Settings, Percent, Clock } from 'lucide-react';

interface ConfigBarProps {
  riskFreeRate: number;
  onRateChange: (rate: number) => void;
  timestamp: string;
}

export const ConfigBar: React.FC<ConfigBarProps> = ({ riskFreeRate, onRateChange, timestamp }) => {
  return (
    <div className="card" style={{ marginBottom: '24px', padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={18} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Analytics Engine Configuration</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="riskFreeInput" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Percent size={14} /> Risk-Free Rate (% p.a.):
            </label>
            <input
              id="riskFreeInput"
              type="number"
              step="0.05"
              min="0"
              max="20"
              value={riskFreeRate}
              onChange={(e) => onRateChange(parseFloat(e.target.value) || 0)}
              style={{
                width: '80px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Engine Timestamp:
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{timestamp || new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

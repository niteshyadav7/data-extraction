import React from 'react';
import { Settings, Percent, Clock, Radio, RefreshCw, Activity } from 'lucide-react';
import type { MarketSummaryData } from '../types';

interface ConfigBarProps {
  riskFreeRate: number;
  onRateChange: (rate: number) => void;
  timestamp: string;
  marketSummaryData?: MarketSummaryData;
  isLiveSync: boolean;
  onToggleLiveSync: () => void;
  syncInterval: number;
  onIntervalChange: (seconds: number) => void;
  onManualLiveSync: () => void;
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  riskFreeRate,
  onRateChange,
  timestamp,
  marketSummaryData,
  isLiveSync,
  onToggleLiveSync,
  syncInterval,
  onIntervalChange,
  onManualLiveSync
}) => {
  const isMarketOpen = marketSummaryData ? marketSummaryData.isMarketOpen : false;
  const sessionLabel = marketSummaryData ? marketSummaryData.marketStatusLabel : 'LAST SESSION CLOSE';

  return (
    <div className="card" style={{ marginBottom: '24px', padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Settings size={18} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Analytics Engine</span>

          {/* Session Status Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: isMarketOpen ? '#E2F0E5' : '#FDE8E8',
              color: isMarketOpen ? 'var(--color-green)' : 'var(--color-red)',
              border: `1px solid ${isMarketOpen ? 'var(--color-green)' : 'var(--color-red)'}`
            }}
          >
            <Activity size={12} />
            {sessionLabel}
          </span>

          <button
            onClick={onToggleLiveSync}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              border: isLiveSync ? '1px solid var(--color-green)' : '1px solid var(--border-color)',
              backgroundColor: isLiveSync ? 'var(--bg-green)' : 'var(--bg-main)',
              color: isLiveSync ? 'var(--color-green)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <Radio size={14} className={isLiveSync ? 'animate-pulse' : ''} />
            {isLiveSync ? '🔴 Live Auto-Sync ON' : '⚪ Live Auto-Sync OFF'}
          </button>

          {isLiveSync && (
            <select
              value={syncInterval}
              onChange={(e) => onIntervalChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <option value={60}>Refresh Every 60s</option>
              <option value={180}>Refresh Every 3m</option>
            </select>
          )}

          <button
            onClick={onManualLiveSync}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            title="Fetch live exchange snapshot now"
          >
            <RefreshCw size={12} />
            Sync Now
          </button>
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
                width: '75px',
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
            <Clock size={14} /> Exchange Feed Time:
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {timestamp || '15:30:00 IST'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

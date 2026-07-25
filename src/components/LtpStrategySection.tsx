import React from 'react';
import type { DashboardMetrics } from '../types';
import { calculateLtpReversalStrategy } from '../utils/ltpStrategyEngine';
import { TradeAdjustmentEngine } from './TradeAdjustmentEngine';
import { ArrowLeft, Target, Layers, AlertTriangle } from 'lucide-react';

interface LtpStrategySectionProps {
  metrics: DashboardMetrics | null;
  onBackToDashboard: () => void;
}

export const LtpStrategySection: React.FC<LtpStrategySectionProps> = ({
  metrics,
  onBackToDashboard
}) => {
  if (!metrics || !metrics.completeChain || metrics.completeChain.length < 5) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={32} color="var(--color-red)" style={{ marginBottom: '12px' }} />
          <h3>No Option Chain Market Data Uploaded</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Please upload your 5 required NSE CSV files in Step 1 to calculate the LTP Reversal Strategy.
          </p>
          <button onClick={onBackToDashboard} className="btn-primary">
            Go to Step 1 Upload
          </button>
        </div>
      </div>
    );
  }

  const spot = metrics.marketSummary.spotPrice;
  const symbol = metrics.marketSummary.underlying || 'NIFTY';
  const ltpStrategy = calculateLtpReversalStrategy(metrics.completeChain, spot, symbol);

  if (!ltpStrategy) return null;

  const { strategyResult, eorCeilingStrike, eosFloorStrike, reversalBandwidthPts, reversalMatrixRows } = ltpStrategy;
  const res = strategyResult;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={onBackToDashboard}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> ← Back to Main Dashboard Overview
        </button>

        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Current Exchange Spot: <strong style={{ color: 'var(--text-main)' }}>₹{spot.toLocaleString('en-IN')}</strong>
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-sidebar)', border: '2px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent-gold-dark)',
              color: '#FFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '6px'
            }}>
              <Target size={14} /> PROPRIETARY QUANTITATIVE REVERSAL ENGINE
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📐 LTP Reversal Boundary Arbitrage Studio ({symbol})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Anchors short options at the exact mathematical Extrinsic EOR Reversal Ceiling (₹{eorCeilingStrike}) & EOS Reversal Floor (₹{eosFloorStrike}).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONFLUENCE SCORE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-green)' }}>
                {res.decisionIntelligence.confluenceScore}% EXCELLENT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>REVERSAL CORRIDOR</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {reversalBandwidthPts} Pts Bandwidth
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            EOS ₹{eosFloorStrike} ↔ EOR ₹{eorCeilingStrike}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--color-green)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MAX PROFIT (NET CREDIT)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)' }}>
            +₹{res.maxProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            ₹{res.netCreditPerShare}/share × {res.lotSize}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8E44AD' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DAILY THETA INCOME</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8E44AD' }}>
            +₹{res.greeks.dailyThetaIncome.toLocaleString('en-IN')}/day
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Pure time value decay cashflow
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2980B9' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PROBABILITY OF PROFIT</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2980B9' }}>
            {res.popPercentage}% POP
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Risk/Reward: {res.riskRewardRatio} : 1
          </div>
        </div>
      </div>

      {/* LTP Reversal Boundary Matrix Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-gold-dark)" />
          LTP Target & Extrinsic Reversal Boundary Matrix (Strike-by-Strike)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-color)', fontWeight: 700 }}>
                <th style={{ padding: '10px' }}>Call Target LTP</th>
                <th style={{ padding: '10px' }}>Call Extrinsic</th>
                <th style={{ padding: '10px', color: 'var(--color-red)' }}>EOR Reversal Ceiling</th>
                <th style={{ padding: '10px' }}>STRIKE</th>
                <th style={{ padding: '10px', color: 'var(--color-green)' }}>EOS Reversal Floor</th>
                <th style={{ padding: '10px' }}>Put Extrinsic</th>
                <th style={{ padding: '10px' }}>Put Target LTP</th>
                <th style={{ padding: '10px' }}>Strategy Role</th>
              </tr>
            </thead>
            <tbody>
              {reversalMatrixRows.map((row) => {
                const isShortCall = row.strike === eorCeilingStrike;
                const isShortPut = row.strike === eosFloorStrike;

                let rowBg = 'transparent';
                if (row.isAtm) rowBg = 'rgba(197, 160, 89, 0.12)';
                else if (isShortCall) rowBg = 'rgba(231, 76, 60, 0.08)';
                else if (isShortPut) rowBg = 'rgba(46, 204, 113, 0.08)';

                return (
                  <tr key={row.strike} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rowBg }}>
                    <td style={{ padding: '8px', color: 'var(--color-green)' }}>₹{row.ceTargetLtp}</td>
                    <td style={{ padding: '8px' }}>₹{row.ceExtrinsic}</td>
                    <td style={{ padding: '8px', fontWeight: 800, color: 'var(--color-red)' }}>₹{row.ceEorReversal}</td>

                    <td style={{ padding: '8px', fontWeight: row.isAtm ? 900 : 700 }}>
                      {row.strike} {row.isAtm && <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--accent-gold-dark)', color: '#FFF' }}>ATM</span>}
                    </td>

                    <td style={{ padding: '8px', fontWeight: 800, color: 'var(--color-green)' }}>₹{row.peEosReversal}</td>
                    <td style={{ padding: '8px' }}>₹{row.peExtrinsic}</td>
                    <td style={{ padding: '8px', color: 'var(--color-green)' }}>₹{row.peTargetLtp}</td>

                    <td style={{ padding: '8px', fontWeight: 700 }}>
                      {isShortCall && <span style={{ color: 'var(--color-red)' }}>🔴 Short Call (EOR Ceiling)</span>}
                      {isShortPut && <span style={{ color: 'var(--color-green)' }}>🟢 Short Put (EOS Floor)</span>}
                      {!isShortCall && !isShortPut && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Strategy Legs */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
          Strategy Leg Breakdown ({res.legs.length} Legs)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {res.legs.map((leg, idx) => (
            <div key={idx} style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${leg.action === 'SELL' ? (leg.optionType === 'CE' ? '#FADBD8' : '#D4EFDF') : 'var(--border-color)'}`,
              backgroundColor: leg.action === 'SELL' ? (leg.optionType === 'CE' ? 'rgba(231, 76, 60, 0.04)' : 'rgba(46, 204, 113, 0.04)') : 'var(--bg-main)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '4px' }}>
                <span style={{ color: leg.action === 'SELL' ? (leg.optionType === 'CE' ? 'var(--color-red)' : 'var(--color-green)') : 'var(--text-main)' }}>
                  {leg.action} {leg.strike} {leg.optionType}
                </span>
                <span>₹{leg.ltp}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {leg.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Trade Adjustment Engine */}
      <TradeAdjustmentEngine strategy={res} />
    </div>
  );
};

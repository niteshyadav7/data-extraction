import React, { useState, useEffect } from 'react';
import { Layers, TrendingUp, TrendingDown, Target, Award, AlertCircle } from 'lucide-react';
import { calculateIronCondorStrategy, getDefaultLotSizeForSymbol } from '../utils/strategyEngine';

interface StrategyHubSectionProps {
  optionChain: any[];
  currentSpot: number;
  selectedSymbol?: string;
}

export const StrategyHubSection: React.FC<StrategyHubSectionProps> = ({
  optionChain,
  currentSpot,
  selectedSymbol = 'NIFTY'
}) => {
  const [lotSize, setLotSize] = useState<number>(getDefaultLotSizeForSymbol(selectedSymbol));
  const [wingWidth, setWingWidth] = useState<number>(2);

  // Sync lot size when selectedSymbol changes
  useEffect(() => {
    setLotSize(getDefaultLotSizeForSymbol(selectedSymbol));
  }, [selectedSymbol]);

  if (!optionChain || optionChain.length < 5 || currentSpot <= 0) {
    return (
      <div className="card" style={{ marginBottom: '24px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-red)' }}>
          <AlertCircle size={24} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No Active Market Data for {selectedSymbol.toUpperCase()}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Connect live auto-sync feed or upload 3 NSE CSV files to calculate real-time quantitative option strategies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const result = calculateIronCondorStrategy(optionChain, currentSpot, selectedSymbol, lotSize, wingWidth);

  if (!result) return null;

  return (
    <div className="card" style={{ marginBottom: '24px', width: '100%' }}>
      {/* Strategy Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={22} color="var(--accent-gold)" />
              Step 19: Quantitative Strategy Hub & Payoff Simulator ({selectedSymbol.toUpperCase()})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              100% dynamic strategy recommendations calculated from active live market chain for <strong>{selectedSymbol.toUpperCase()}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#E2F0E5', color: 'var(--color-green)', border: '1px solid var(--color-green)' }}>
              🟢 STRATEGY: IRON CONDOR ({selectedSymbol.toUpperCase()})
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Lot Size & Wing Width */}
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        border: '1.5px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Lot Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {selectedSymbol.toUpperCase()} Contract Lot Size:
          </span>
          <input
            type="number"
            value={lotSize}
            onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
            style={{
              width: '90px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1.5px solid var(--border-color)',
              backgroundColor: '#FFF',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          />
        </div>

        {/* Wing Protection Width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Wing Protection Width:
          </span>
          <select
            value={wingWidth}
            onChange={(e) => setWingWidth(parseInt(e.target.value) || 2)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1.5px solid var(--border-color)',
              backgroundColor: '#FFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <option value={1}>1 Strike Width (Tight Risk)</option>
            <option value={2}>2 Strikes Width (Standard)</option>
            <option value={3}>3 Strikes Width (Wide Protection)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {selectedSymbol.toUpperCase()} Spot: <strong>₹{currentSpot.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Strategy Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Max Profit */}
        <div style={{ backgroundColor: '#E2F0E5', border: '1.5px solid var(--color-green)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} /> MAX PROFIT (NET CREDIT)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>
            +₹{result.maxProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            ₹{result.netCreditPerShare.toFixed(2)} / share (Lot Size {result.lotSize})
          </div>
        </div>

        {/* Card 2: Max Loss */}
        <div style={{ backgroundColor: '#FADBD8', border: '1.5px solid var(--color-red)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} /> MAX RISK / LOSS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '4px' }}>
            -₹{result.maxLoss.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Fully Defined Capped Risk
          </div>
        </div>

        {/* Card 3: Breakeven Range */}
        <div style={{ backgroundColor: '#EBF5FB', border: '1.5px solid #85C1E9', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1B4F72', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} /> BREAKEVEN RANGE
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1B4F72', marginTop: '4px' }}>
            ₹{result.lowerBreakeven.toLocaleString('en-IN')} ↔ ₹{result.upperBreakeven.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Profit Zone ({Math.round(result.upperBreakeven - result.lowerBreakeven)} pts)
          </div>
        </div>

        {/* Card 4: Strategy POP % */}
        <div style={{ backgroundColor: '#FEF9E7', border: '1.5px solid #F9E79F', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B7950B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} /> STRATEGY POP %
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B7950B', marginTop: '4px' }}>
            {result.popPercentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Probability of Profit at Expiry
          </div>
        </div>
      </div>

      {/* Dynamic 4-Leg Order Matrix */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
          📋 Dynamic 4-Leg Order Execution Matrix ({selectedSymbol.toUpperCase()})
        </h3>
        <div className="table-container" style={{ width: '100%', overflowX: 'auto', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <th>Leg #</th>
                <th>Role</th>
                <th>Action</th>
                <th>Option Contract</th>
                <th>Strike Price</th>
                <th>LTP (Premium)</th>
                <th>Delta (Δ)</th>
                <th>Implied Volatility</th>
                <th>Total Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {result.legs.map((leg, idx) => {
                const isSell = leg.action === 'SELL';
                const totalValue = Math.round(leg.ltp * result.lotSize);
                return (
                  <tr key={idx} style={{ backgroundColor: isSell ? 'rgba(244, 67, 54, 0.04)' : 'rgba(76, 175, 80, 0.04)' }}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{leg.role}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: isSell ? '#FADBD8' : '#E2F0E5',
                        color: isSell ? 'var(--color-red)' : 'var(--color-green)',
                        border: `1px solid ${isSell ? 'var(--color-red)' : 'var(--color-green)'}`
                      }}>
                        {leg.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: leg.optionType === 'CE' ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {selectedSymbol.toUpperCase()} {leg.strike} {leg.optionType}
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '0.95rem' }}>{leg.strike}</td>
                    <td style={{ fontWeight: 700 }}>₹{leg.ltp.toFixed(2)}</td>
                    <td style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{leg.delta.toFixed(2)}</td>
                    <td>{leg.iv > 0 ? `${leg.iv.toFixed(1)}%` : '-'}</td>
                    <td style={{ fontWeight: 700, color: isSell ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {isSell ? `+₹${totalValue.toLocaleString('en-IN')}` : `-₹${totalValue.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payoff at Expiry Table Matrix */}
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
          📈 Strategy Expiry Payoff Matrix (PnL Across {selectedSymbol.toUpperCase()} Spot Levels)
        </h3>
        <div className="table-container" style={{ width: '100%', overflowX: 'auto', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <th>Spot Price at Expiry (₹)</th>
                <th>Distance from Current Spot</th>
                <th>Strategy PnL (₹)</th>
                <th>Return on Risk (%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.payoffRows.map((row) => {
                const diff = row.spot - currentSpot;
                const isProfit = row.pnl >= 0;
                return (
                  <tr
                    key={row.spot}
                    style={{
                      backgroundColor: row.isCurrentSpot
                        ? 'var(--accent-pill)'
                        : row.isBreakeven
                        ? '#FEF9E7'
                        : 'transparent',
                      fontWeight: row.isCurrentSpot || row.isBreakeven ? 700 : 400
                    }}
                  >
                    <td style={{ fontWeight: 800, fontSize: row.isCurrentSpot ? '0.95rem' : '0.85rem' }}>
                      ₹{row.spot.toLocaleString('en-IN')}
                      {row.isCurrentSpot && <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--accent-gold-dark)' }}>CURRENT {selectedSymbol.toUpperCase()} SPOT</span>}
                      {row.isBreakeven && <span style={{ fontSize: '0.65rem', display: 'block', color: '#B7950B' }}>BREAKEVEN LEVEL</span>}
                    </td>

                    <td style={{ color: diff >= 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>
                      {diff >= 0 ? `+${diff.toFixed(0)} pts` : `${diff.toFixed(0)} pts`}
                    </td>

                    <td style={{ fontWeight: 800, color: isProfit ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {isProfit ? `+₹${row.pnl.toLocaleString('en-IN')}` : `₹${row.pnl.toLocaleString('en-IN')}`}
                    </td>

                    <td style={{ fontWeight: 700, color: isProfit ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {isProfit ? `+${row.pnlPct}%` : `${row.pnlPct}%`}
                    </td>

                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: isProfit ? '#E2F0E5' : '#FADBD8',
                        color: isProfit ? 'var(--color-green)' : 'var(--color-red)'
                      }}>
                        {isProfit ? 'PROFIT ZONE' : 'LOSS ZONE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { DashboardMetrics } from '../types';
import { calculateLtpReversalStrategy } from '../utils/ltpStrategyEngine';
import { TradeAdjustmentEngine } from './TradeAdjustmentEngine';
import { DisciplineChecklist } from './DisciplineChecklist';
import { ArrowLeft, Layers, AlertTriangle, CheckCircle2, ShieldCheck, Activity, Sparkles, TrendingUp, TrendingDown, Zap, Shield, FileText } from 'lucide-react';

interface LtpStrategySectionProps {
  metrics: DashboardMetrics | null;
  onBackToDashboard: () => void;
}

export const LtpStrategySection: React.FC<LtpStrategySectionProps> = ({
  metrics,
  onBackToDashboard
}) => {
  const [selectedMode, setSelectedMode] = useState<'OPTION_SELLING' | 'OPTION_BUYING_CALL' | 'OPTION_BUYING_PUT' | 'OPTION_BUYING_STRADDLE'>('OPTION_SELLING');
  const [showDiscipline, setShowDiscipline] = useState<boolean>(true);

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
  const ltpStrategy = calculateLtpReversalStrategy(metrics.completeChain, spot, symbol, undefined, selectedMode);

  if (!ltpStrategy) return null;

  const {
    strategyResult,
    mode,
    eorCeilingStrike,
    eorReversalLevel,
    eosFloorStrike,
    eosReversalLevel,
    reversalBandwidthPts,
    reversalChannelPositionPct,
    extrinsicHarvestEfficiencyPct,
    noTradeStatus,
    reversalMatrixRows,
    reversalChecklist
  } = ltpStrategy;

  const res = strategyResult;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBackToDashboard}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> ← Back to Main Dashboard Overview
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowDiscipline(!showDiscipline)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: showDiscipline ? 'var(--accent-gold-dark)' : 'var(--bg-main)',
              color: showDiscipline ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${showDiscipline ? 'var(--accent-gold-dark)' : 'var(--border-color)'}`
            }}
          >
            <FileText size={15} /> {showDiscipline ? 'Hide Discipline Code' : 'Show Discipline Code'}
          </button>

          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Current Exchange Spot: <strong style={{ color: 'var(--text-main)' }}>₹{spot.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* Trader Discipline Code Checklist Component */}
      {showDiscipline && (
        <DisciplineChecklist onClose={() => setShowDiscipline(false)} />
      )}

      {/* NO-TRADE DAY / TRADE PERMISSION BANNER */}
      <div className="card" style={{
        marginBottom: '20px',
        padding: '16px 20px',
        backgroundColor: noTradeStatus.isNoTradeDay ? '#FADBD8' : '#E2F0E5',
        border: `2px solid ${noTradeStatus.isNoTradeDay ? 'var(--color-red)' : 'var(--color-green)'}`,
        boxShadow: `0 4px 14px ${noTradeStatus.isNoTradeDay ? 'rgba(231, 76, 60, 0.15)' : 'rgba(46, 204, 113, 0.15)'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {noTradeStatus.isNoTradeDay ? (
              <AlertTriangle size={28} color="var(--color-red)" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={28} color="var(--color-green)" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 900,
                color: noTradeStatus.isNoTradeDay ? 'var(--color-red)' : 'var(--color-green)'
              }}>
                {noTradeStatus.tradePermissionLabel}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {noTradeStatus.noTradeReason}
              </div>
            </div>
          </div>

          <div style={{
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-main)',
            border: `1.5px solid ${noTradeStatus.isNoTradeDay ? 'var(--color-red)' : 'var(--color-green)'}`,
            fontWeight: 800,
            fontSize: '0.78rem',
            color: noTradeStatus.isNoTradeDay ? 'var(--color-red)' : 'var(--color-green)'
          }}>
            {noTradeStatus.isNoTradeDay ? '⚠️ CAPITAL PROTECTION MODE' : '✅ THETA DECAY OPTIMAL'}
          </div>
        </div>
      </div>

      {/* Mode Selector Bar: Option Selling vs Option Buying */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px', backgroundColor: 'var(--bg-sidebar)' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Execution Strategy Mode (Option Selling vs Option Buying)
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedMode('OPTION_SELLING')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedMode === 'OPTION_SELLING' ? 'var(--accent-gold-dark)' : 'var(--bg-main)',
              color: selectedMode === 'OPTION_SELLING' ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${selectedMode === 'OPTION_SELLING' ? 'var(--accent-gold-dark)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={16} /> 🛡️ Option Selling (Credit Reversal Corridor)
          </button>

          <button
            onClick={() => setSelectedMode('OPTION_BUYING_CALL')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedMode === 'OPTION_BUYING_CALL' ? 'var(--color-green)' : 'var(--bg-main)',
              color: selectedMode === 'OPTION_BUYING_CALL' ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${selectedMode === 'OPTION_BUYING_CALL' ? 'var(--color-green)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={16} /> 🐂 Option Buying: Bullish Call Buyer
          </button>

          <button
            onClick={() => setSelectedMode('OPTION_BUYING_PUT')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedMode === 'OPTION_BUYING_PUT' ? 'var(--color-red)' : 'var(--bg-main)',
              color: selectedMode === 'OPTION_BUYING_PUT' ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${selectedMode === 'OPTION_BUYING_PUT' ? 'var(--color-red)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingDown size={16} /> 🐻 Option Buying: Bearish Put Buyer
          </button>

          <button
            onClick={() => setSelectedMode('OPTION_BUYING_STRADDLE')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedMode === 'OPTION_BUYING_STRADDLE' ? '#8E44AD' : 'var(--bg-main)',
              color: selectedMode === 'OPTION_BUYING_STRADDLE' ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${selectedMode === 'OPTION_BUYING_STRADDLE' ? '#8E44AD' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={16} /> ⚡ Option Buying: Volatility Breakout
          </button>
        </div>
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
              <Sparkles size={14} /> 100% UNIQUE REVERSAL ENGINE
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📐 {res.strategyName} ({symbol})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Anchored at mathematical Extrinsic EOR Reversal Ceiling (₹{eorCeilingStrike}) & EOS Reversal Floor (₹{eosFloorStrike}).
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONFLUENCE SCORE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-green)' }}>
              {res.decisionIntelligence.confluenceScore}% EXCELLENT
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MAX PROFIT TARGET</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)' }}>
            +₹{res.maxProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode.startsWith('OPTION_BUYING') ? `Buyer Reward/Risk: ${ltpStrategy.buyerRewardRiskRatioText}` : `Net Credit ₹${res.netCreditPerShare}/share × ${res.lotSize}`}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8E44AD' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DAILY THETA & LEVERAGE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: res.greeks.dailyThetaIncome >= 0 ? '#8E44AD' : 'var(--color-red)' }}>
            {res.greeks.dailyThetaIncome >= 0 ? `+₹${res.greeks.dailyThetaIncome.toLocaleString('en-IN')}/day` : `-₹${Math.abs(res.greeks.dailyThetaIncome).toLocaleString('en-IN')}/day`}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode.startsWith('OPTION_BUYING') ? `${ltpStrategy.deltaThetaLeverageRatio} pts/day to beat Theta` : `${extrinsicHarvestEfficiencyPct}% Extrinsic Efficiency`}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2980B9' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{mode.startsWith('OPTION_BUYING') ? 'INTRINSIC VALUE SHIELD' : 'PROBABILITY OF PROFIT'}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2980B9' }}>
            {mode.startsWith('OPTION_BUYING') ? `${ltpStrategy.intrinsicValueRatioPct}% Intrinsic` : `${res.popPercentage}% POP`}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode.startsWith('OPTION_BUYING') ? 'Shielded against Theta decay' : `Risk/Reward: ${res.riskRewardRatio} : 1`}
          </div>
        </div>
      </div>

      {/* Visual Reversal Channel Position Gauge Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} color="var(--accent-gold-dark)" /> Reversal Corridor Position Gauge
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-green)' }}>
            Spot is in the {reversalChannelPositionPct}% Center Sweet Spot
          </span>
        </div>

        <div style={{
          height: '14px',
          backgroundColor: 'var(--bg-main)',
          borderRadius: '7px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, reversalChannelPositionPct))}%`,
            backgroundColor: 'var(--color-green)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          <span>🟢 EOS Floor: ₹{eosFloorStrike} (Level: ₹{eosReversalLevel})</span>
          <span>📍 Current Spot: ₹{spot.toLocaleString('en-IN')}</span>
          <span>🔴 EOR Ceiling: ₹{eorCeilingStrike} (Level: ₹{eorReversalLevel})</span>
        </div>
      </div>

      {/* Institutional Reversal Alignment Checklist */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--color-green)" />
          Institutional Reversal Alignment Checklist (5 Verification Tests)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {reversalChecklist.map((item, idx) => (
            <div key={idx} style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: item.passed ? 'rgba(46, 204, 113, 0.05)' : 'rgba(231, 76, 60, 0.05)',
              border: `1px solid ${item.passed ? '#ABEBC6' : '#FADBD8'}`,
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <CheckCircle2 size={18} color={item.passed ? 'var(--color-green)' : 'var(--color-red)'} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.details}</div>
              </div>
            </div>
          ))}
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

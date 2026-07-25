import React from 'react';
import type { StrategyResult } from '../utils/strategyEngine';
import {
  calculateIronCondorStrategy,
  calculateIronButterflyStrategy,
  calculateBullPutCreditSpread,
  calculateBearCallCreditSpread,
  calculateShortStrangleStrategy,
  calculateRatioPutSpreadStrategy,
  calculateCalendarSpreadStrategy
} from '../utils/strategyEngine';
import { Trophy, Award, ArrowRight } from 'lucide-react';

interface StrategyComparisonStudioProps {
  optionChain: any[];
  nextExpiryOptionChain?: any[];
  currentSpot: number;
  selectedSymbol?: string;
  supportResistance?: any;
  maxPainStrike?: number;
  expectedMoveBounds?: { upper: number; lower: number };
  onSelectStrategy: (strategyKey: string) => void;
}

export const StrategyComparisonStudio: React.FC<StrategyComparisonStudioProps> = ({
  optionChain,
  nextExpiryOptionChain,
  currentSpot,
  selectedSymbol = 'NIFTY',
  supportResistance,
  maxPainStrike,
  expectedMoveBounds,
  onSelectStrategy
}) => {
  if (!optionChain || optionChain.length < 5 || currentSpot <= 0) return null;

  // Calculate all 7 Quantitative Strategies
  const ic = calculateIronCondorStrategy(optionChain, currentSpot, selectedSymbol, undefined, 2, supportResistance, maxPainStrike, expectedMoveBounds);
  const ib = calculateIronButterflyStrategy(optionChain, currentSpot, selectedSymbol, undefined, 2, maxPainStrike);
  const bp = calculateBullPutCreditSpread(optionChain, currentSpot, selectedSymbol, undefined, 2, supportResistance);
  const bc = calculateBearCallCreditSpread(optionChain, currentSpot, selectedSymbol, undefined, 2, supportResistance);
  const ss = calculateShortStrangleStrategy(optionChain, currentSpot, selectedSymbol, undefined, supportResistance);
  const rp = calculateRatioPutSpreadStrategy(optionChain, currentSpot, selectedSymbol, undefined, supportResistance);
  const cs = calculateCalendarSpreadStrategy(optionChain, currentSpot, selectedSymbol, undefined, nextExpiryOptionChain);

  const rawList: { key: string; result: StrategyResult | null; bias: 'NEUTRAL' | 'BULLISH' | 'BEARISH' }[] = [
    { key: 'IRON_CONDOR', result: ic, bias: 'NEUTRAL' },
    { key: 'IRON_BUTTERFLY', result: ib, bias: 'NEUTRAL' },
    { key: 'BULL_PUT_CREDIT', result: bp, bias: 'BULLISH' },
    { key: 'BEAR_CALL_CREDIT', result: bc, bias: 'BEARISH' },
    { key: 'SHORT_STRANGLE', result: ss, bias: 'NEUTRAL' },
    { key: 'RATIO_PUT_SPREAD', result: rp, bias: 'BEARISH' },
    { key: 'CALENDAR_SPREAD', result: cs, bias: 'NEUTRAL' }
  ];

  const validStrategies = rawList
    .filter((item): item is { key: string; result: StrategyResult; bias: 'NEUTRAL' | 'BULLISH' | 'BEARISH' } => item.result !== null)
    .sort((a, b) => (b.result.decisionIntelligence.confluenceScore * 10 + b.result.popPercentage) - (a.result.decisionIntelligence.confluenceScore * 10 + a.result.popPercentage));

  const topStrategy = validStrategies[0];

  return (
    <div className="card" style={{ marginBottom: '28px', border: '1.5px solid var(--accent-gold)' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={22} color="var(--accent-gold-dark)" />
            Strategy Comparison Studio & Ranking Matrix
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            All 7 quantitative derivative strategies calculated and ranked side-by-side for {selectedSymbol.toUpperCase()} (Spot: ₹{currentSpot.toLocaleString('en-IN')}).
          </p>
        </div>

        {topStrategy && (
          <div style={{ backgroundColor: '#FEF9E7', border: '1px solid #F9E79F', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} /> #1 TOP RANKED: {topStrategy.result.strategyName} ({topStrategy.result.decisionIntelligence.confluenceScore}% Confluence)
          </div>
        )}
      </div>

      {/* Top Ranked Strategy Highlight Banner */}
      {topStrategy && (
        <div style={{
          backgroundColor: 'rgba(197, 160, 89, 0.08)',
          border: '1.5px solid var(--accent-gold)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
              🥇 #1 Recommended Strategy Execution for Today
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {topStrategy.result.strategyName}
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {topStrategy.result.decisionIntelligence.executiveSummary}
            </div>
          </div>

          <button
            onClick={() => onSelectStrategy(topStrategy.key)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Launch {topStrategy.result.strategyName} Studio <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Side-by-Side Strategy Ranking Matrix Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px 14px' }}>Rank</th>
              <th style={{ padding: '12px 14px' }}>Strategy Name</th>
              <th style={{ padding: '12px 14px' }}>Regime Bias</th>
              <th style={{ padding: '12px 14px' }}>POP %</th>
              <th style={{ padding: '12px 14px' }}>Risk / Reward</th>
              <th style={{ padding: '12px 14px' }}>Max Profit</th>
              <th style={{ padding: '12px 14px' }}>Max Loss</th>
              <th style={{ padding: '12px 14px' }}>Daily Theta (+₹/day)</th>
              <th style={{ padding: '12px 14px' }}>Confluence Score</th>
              <th style={{ padding: '12px 14px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {validStrategies.map((item, idx) => {
              const res = item.result;
              const isTop = idx === 0;
              const rankNum = idx + 1;

              return (
                <tr key={item.key} style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: isTop ? 'rgba(197, 160, 89, 0.06)' : 'transparent',
                  fontWeight: isTop ? 700 : 500
                }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: isTop ? 'var(--accent-gold-dark)' : 'var(--text-muted)'
                    }}>
                      {isTop ? '🏆 #1' : `#${rankNum}`}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{res.strategyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Breakevens: ₹{res.lowerBreakeven} ↔ ₹{res.upperBreakeven}</div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.bias === 'BULLISH' ? '#E2F0E5' : item.bias === 'BEARISH' ? '#FADBD8' : '#FEF9E7',
                      color: item.bias === 'BULLISH' ? 'var(--color-green)' : item.bias === 'BEARISH' ? 'var(--color-red)' : '#B7950B'
                    }}>
                      {item.bias}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontWeight: 800, color: res.popPercentage >= 70 ? 'var(--color-green)' : 'var(--text-main)' }}>
                      {res.popPercentage}%
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    1 : {res.riskRewardRatio}
                  </td>

                  <td style={{ padding: '12px 14px', color: 'var(--color-green)', fontWeight: 700 }}>
                    +₹{res.maxProfit.toLocaleString('en-IN')}
                  </td>

                  <td style={{ padding: '12px 14px', color: 'var(--color-red)', fontWeight: 700 }}>
                    -₹{res.maxLoss.toLocaleString('en-IN')}
                  </td>

                  <td style={{ padding: '12px 14px', color: 'var(--accent-gold-dark)', fontWeight: 800 }}>
                    +₹{Math.max(0, res.greeks.dailyThetaIncome)}/day
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: res.decisionIntelligence.confluenceScore >= 80 ? 'var(--color-green)' : 'var(--accent-gold-dark)' }}>
                        {res.decisionIntelligence.confluenceScore}%
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({res.decisionIntelligence.confidenceRating.split(' ')[0]})</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => onSelectStrategy(item.key)}
                      className={isTop ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: '0.78rem', padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Open Studio <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

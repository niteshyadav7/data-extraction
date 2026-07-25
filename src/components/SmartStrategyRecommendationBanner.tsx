import React from 'react';
import type { DashboardMetrics } from '../types';
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
import { Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SmartStrategyRecommendationBannerProps {
  metrics: DashboardMetrics;
  onSelectStrategy: (strategyKey: string) => void;
}

export const SmartStrategyRecommendationBanner: React.FC<SmartStrategyRecommendationBannerProps> = ({
  metrics,
  onSelectStrategy
}) => {
  if (!metrics || !metrics.completeChain || metrics.completeChain.length < 5) return null;

  const spot = metrics.marketSummary.spotPrice;
  const symbol = metrics.marketSummary.underlying || 'NIFTY';

  // Evaluate all 7 strategies dynamically using REAL parsed CSV metrics
  const ic = calculateIronCondorStrategy(metrics.completeChain, spot, symbol, undefined, 2, metrics.supportResistance, metrics.maxPain.maxPainStrike, metrics.expectedMove ? { upper: metrics.expectedMove.upperBound, lower: metrics.expectedMove.lowerBound } : undefined);
  const ib = calculateIronButterflyStrategy(metrics.completeChain, spot, symbol, undefined, 2, metrics.maxPain.maxPainStrike);
  const bp = calculateBullPutCreditSpread(metrics.completeChain, spot, symbol, undefined, 2, metrics.supportResistance);
  const bc = calculateBearCallCreditSpread(metrics.completeChain, spot, symbol, undefined, 2, metrics.supportResistance);
  const ss = calculateShortStrangleStrategy(metrics.completeChain, spot, symbol, undefined, metrics.supportResistance);
  const rp = calculateRatioPutSpreadStrategy(metrics.completeChain, spot, symbol, undefined, metrics.supportResistance);
  const cs = calculateCalendarSpreadStrategy(metrics.completeChain, spot, symbol, undefined, metrics.nextExpiryChain);

  const rawList: { key: string; result: StrategyResult | null }[] = [
    { key: 'IRON_CONDOR', result: ic },
    { key: 'IRON_BUTTERFLY', result: ib },
    { key: 'BULL_PUT_CREDIT', result: bp },
    { key: 'BEAR_CALL_CREDIT', result: bc },
    { key: 'SHORT_STRANGLE', result: ss },
    { key: 'RATIO_PUT_SPREAD', result: rp },
    { key: 'CALENDAR_SPREAD', result: cs }
  ];

  const validStrategies = rawList
    .filter((item): item is { key: string; result: StrategyResult } => item.result !== null)
    .sort((a, b) => (b.result.decisionIntelligence.confluenceScore * 10 + b.result.popPercentage) - (a.result.decisionIntelligence.confluenceScore * 10 + a.result.popPercentage));

  if (validStrategies.length === 0) return null;

  const top = validStrategies[0];
  const topRes = top.result;

  // Real Data Confluence Reasoning Bullets
  const realReasons: string[] = [];

  if (metrics.fiiDiiAnalysis) {
    realReasons.push(`FII Institutional Stance: ${metrics.fiiDiiAnalysis.stanceLabel} (FII Futures Long Ratio: ${metrics.fiiDiiAnalysis.fiiLongRatioPct}%)`);
  }
  if (metrics.pcrAnalysis) {
    realReasons.push(`Market PCR (OI): ${metrics.pcrAnalysis.overallPcr} (${metrics.pcrAnalysis.interpretation})`);
  }
  if (metrics.maxPain) {
    const distToMp = Math.abs(spot - metrics.maxPain.maxPainStrike);
    realReasons.push(`Max Pain Strike: ₹${metrics.maxPain.maxPainStrike} (Spot is ${distToMp.toFixed(0)} pts from Max Pain Pin)`);
  }
  if (topRes.greeks.dailyThetaIncome > 0) {
    realReasons.push(`Daily Theta Cashflow: +₹${topRes.greeks.dailyThetaIncome.toLocaleString('en-IN')}/day (${topRes.popPercentage}% POP)`);
  }

  return (
    <div className="card" style={{
      marginBottom: '24px',
      backgroundColor: 'rgba(197, 160, 89, 0.08)',
      border: '2px solid var(--accent-gold)',
      boxShadow: '0 4px 16px rgba(197, 160, 89, 0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent-gold-dark)',
              color: '#FFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Trophy size={14} /> 100% REAL DATA DYNAMIC RECOMMENDATION
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-green)' }}>
              {topRes.decisionIntelligence.confluenceScore}% Confluence Score ({topRes.decisionIntelligence.confidenceRating})
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Today's #1 Recommended Strategy Execution: <span style={{ color: 'var(--accent-gold-dark)' }}>{topRes.strategyName}</span>
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '10px' }}>
            {topRes.decisionIntelligence.executiveSummary}
          </p>

          {/* Real Metrics Confluence Alignment Bullets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
            {realReasons.map((reason, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                <CheckCircle2 size={14} color="var(--color-green)" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => onSelectStrategy(top.key)}
            className="btn-primary"
            style={{
              padding: '12px 22px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(197, 160, 89, 0.3)'
            }}
          >
            Launch {topRes.strategyName} Studio <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

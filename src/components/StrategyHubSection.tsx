import React, { useState, useEffect } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Compass,
  BarChart3
} from 'lucide-react';
import {
  calculateIronCondorStrategy,
  calculateIronButterflyStrategy,
  calculateBullPutCreditSpread,
  calculateBearCallCreditSpread,
  calculateBullCallSpread,
  calculateBearPutSpread,
  getDefaultLotSizeForSymbol,
  type StrategyResult
} from '../utils/strategyEngine';

interface StrategyHubSectionProps {
  optionChain: any[];
  currentSpot: number;
  selectedSymbol?: string;
  supportResistance?: any;
  maxPainStrike?: number;
  expectedMoveBounds?: { upper: number; lower: number };
  initialTab?: 'IRON_CONDOR' | 'IRON_BUTTERFLY' | 'BULL_PUT_CREDIT' | 'BEAR_CALL_CREDIT' | 'BULL_CALL' | 'BEAR_PUT' | 'ALL';
  onBackToDashboard?: () => void;
}

export const StrategyHubSection: React.FC<StrategyHubSectionProps> = ({
  optionChain,
  currentSpot,
  selectedSymbol = 'NIFTY',
  supportResistance,
  maxPainStrike,
  expectedMoveBounds,
  initialTab = 'IRON_CONDOR',
  onBackToDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'IRON_CONDOR' | 'IRON_BUTTERFLY' | 'BULL_PUT_CREDIT' | 'BEAR_CALL_CREDIT' | 'BULL_CALL' | 'BEAR_PUT'>(
    initialTab === 'ALL' || initialTab === 'IRON_CONDOR' ? 'IRON_CONDOR' : initialTab
  );
  const [lotSize, setLotSize] = useState<number>(getDefaultLotSizeForSymbol(selectedSymbol));
  const [wingWidth, setWingWidth] = useState<number>(2);

  // Sync lot size when selectedSymbol changes
  useEffect(() => {
    setLotSize(getDefaultLotSizeForSymbol(selectedSymbol));
  }, [selectedSymbol]);

  // Sync activeTab if initialTab changes
  useEffect(() => {
    if (initialTab !== 'ALL') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!optionChain || optionChain.length < 5 || currentSpot <= 0) {
    return (
      <div className="card" style={{ marginBottom: '24px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back to Main Dashboard
            </button>
          )}
        </div>

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

  let result: StrategyResult | null = null;
  if (activeTab === 'IRON_CONDOR') {
    result = calculateIronCondorStrategy(
      optionChain,
      currentSpot,
      selectedSymbol,
      lotSize,
      wingWidth,
      supportResistance,
      maxPainStrike,
      expectedMoveBounds
    );
  } else if (activeTab === 'IRON_BUTTERFLY') {
    result = calculateIronButterflyStrategy(
      optionChain,
      currentSpot,
      selectedSymbol,
      lotSize,
      wingWidth,
      maxPainStrike
    );
  } else if (activeTab === 'BULL_PUT_CREDIT') {
    result = calculateBullPutCreditSpread(
      optionChain,
      currentSpot,
      selectedSymbol,
      lotSize,
      wingWidth,
      supportResistance
    );
  } else if (activeTab === 'BEAR_CALL_CREDIT') {
    result = calculateBearCallCreditSpread(
      optionChain,
      currentSpot,
      selectedSymbol,
      lotSize,
      wingWidth,
      supportResistance
    );
  } else if (activeTab === 'BULL_CALL') {
    result = calculateBullCallSpread(optionChain, currentSpot, selectedSymbol, lotSize);
  } else if (activeTab === 'BEAR_PUT') {
    result = calculateBearPutSpread(optionChain, currentSpot, selectedSymbol, lotSize);
  }

  if (!result) return null;

  const decision = result.decisionIntelligence;

  return (
    <div className="card" style={{ marginBottom: '24px', width: '100%' }}>
      {/* Back Button & Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> ← Back to Main Dashboard Overview
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={24} color="var(--accent-gold)" />
              Institutional Strategy Studio & Decision Intelligence ({selectedSymbol.toUpperCase()})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Quantitative trade synthesis, Confluence Score %, Pros & Cons matrix, and Actionable Execution Plan.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: decision.confidenceRating === 'HIGH CONFIDENCE' ? '#E2F0E5' : '#FEF9E7',
              color: decision.confidenceRating === 'HIGH CONFIDENCE' ? 'var(--color-green)' : '#B7950B',
              border: `1px solid ${decision.confidenceRating === 'HIGH CONFIDENCE' ? 'var(--color-green)' : '#F9E79F'}`
            }}>
              ⚡ {decision.confidenceRating} ({decision.confluenceScore}% CONFLUENCE)
            </span>

            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', backgroundColor: 'var(--bg-main)', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              Spot: <strong>₹{currentSpot.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Strategy Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('IRON_CONDOR')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'IRON_CONDOR' ? 'var(--accent-gold)' : 'var(--bg-main)',
            color: activeTab === 'IRON_CONDOR' ? '#FFF' : 'var(--text-main)',
            border: `1.5px solid ${activeTab === 'IRON_CONDOR' ? 'var(--accent-gold)' : 'var(--border-color)'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} /> 🟢 Iron Condor (Neutral Income)
        </button>

        <button
          onClick={() => setActiveTab('IRON_BUTTERFLY')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'IRON_BUTTERFLY' ? 'var(--color-blue)' : 'var(--bg-main)',
            color: activeTab === 'IRON_BUTTERFLY' ? '#FFF' : 'var(--text-main)',
            border: `1.5px solid ${activeTab === 'IRON_BUTTERFLY' ? 'var(--color-blue)' : 'var(--border-color)'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <Award size={16} /> 🦋 Iron Butterfly (Max Pain Pinning)
        </button>

        <button
          onClick={() => setActiveTab('BULL_PUT_CREDIT')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'BULL_PUT_CREDIT' ? 'var(--color-green)' : 'var(--bg-main)',
            color: activeTab === 'BULL_PUT_CREDIT' ? '#FFF' : 'var(--text-main)',
            border: `1.5px solid ${activeTab === 'BULL_PUT_CREDIT' ? 'var(--color-green)' : 'var(--border-color)'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <TrendingUp size={16} /> 🛡️ Bull Put Credit Spread (Support Credit)
        </button>

        <button
          onClick={() => setActiveTab('BEAR_CALL_CREDIT')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'BEAR_CALL_CREDIT' ? 'var(--color-red)' : 'var(--bg-main)',
            color: activeTab === 'BEAR_CALL_CREDIT' ? '#FFF' : 'var(--text-main)',
            border: `1.5px solid ${activeTab === 'BEAR_CALL_CREDIT' ? 'var(--color-red)' : 'var(--border-color)'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <TrendingDown size={16} /> 📉 Bear Call Credit Spread (Resistance Credit)
        </button>

        <button
          onClick={() => setActiveTab('BULL_CALL')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'BULL_CALL' ? 'var(--color-green)' : 'var(--bg-main)',
            color: activeTab === 'BULL_CALL' ? '#FFF' : 'var(--text-main)',
            border: `1.5px solid ${activeTab === 'BULL_CALL' ? 'var(--color-green)' : 'var(--border-color)'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <TrendingUp size={16} /> 📈 Bull Call Spread (Bullish Breakout)
        </button>

        <button
          onClick={() => setActiveTab('BEAR_PUT')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'BEAR_PUT' ? 'var(--color-red)' : 'var(--bg-main)',
            color: activeTab === 'BEAR_PUT' ? '#FFF' : 'var(--text-main)',
            border: `1.5px solid ${activeTab === 'BEAR_PUT' ? 'var(--color-red)' : 'var(--border-color)'}`,
            transition: 'all 0.15s ease'
          }}
        >
          <TrendingDown size={16} /> 📉 Bear Put Spread (Bearish Breakdown)
        </button>
      </div>

      {/* SECTION 1: EXECUTIVE DECISION SUMMARY & CONFLUENCE GAUGE */}
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '24px',
        border: '1.5px solid var(--accent-gold)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--accent-gold-dark)" />
            Executive Trade Summary & Quantitative Confluence Analysis
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Trade Confluence Score:
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-gold-dark)' }}>
              {decision.confluenceScore}%
            </span>
          </div>
        </div>

        {/* Confluence Gauge Progress Bar */}
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{
            width: `${decision.confluenceScore}%`,
            height: '100%',
            backgroundColor: decision.confluenceScore >= 80 ? 'var(--color-green)' : 'var(--accent-gold)',
            borderRadius: '4px',
            transition: 'width 0.4s ease'
          }} />
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
          {decision.executiveSummary}
        </p>
      </div>

      {/* SECTION 2: PROS & CONS MATRIX TABLE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* PROS CARD (Green) */}
        <div style={{
          backgroundColor: '#E2F0E5',
          border: '1.5px solid var(--color-green)',
          borderRadius: '10px',
          padding: '18px 20px'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> PROS / TAILWINDS (QUANTITATIVE EDGE)
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {decision.pros.map((pro, i) => (
              <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        {/* CONS CARD (Red) */}
        <div style={{
          backgroundColor: '#FADBD8',
          border: '1.5px solid var(--color-red)',
          borderRadius: '10px',
          padding: '18px 20px'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} /> CONS / HEADWINDS (QUANTITATIVE RISKS)
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {decision.cons.map((con, i) => (
              <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION 3: ACTIONABLE INSTITUTIONAL EXECUTION PLAN */}
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '10px',
        padding: '18px 20px',
        marginBottom: '24px',
        border: '1.5px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="var(--accent-gold-dark)" /> Institutional Actionable Execution & Management Plan
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {/* Entry Zone */}
          <div style={{ backgroundColor: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold-dark)', marginBottom: '4px' }}>
              📍 RECOMMENDED ENTRY ZONE
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: '1.4' }}>
              {decision.executionPlan.entryZone}
            </div>
          </div>

          {/* Profit Target */}
          <div style={{ backgroundColor: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-green)', marginBottom: '4px' }}>
              🎯 PROFIT TARGET EXIT (50% - 70%)
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: '1.4' }}>
              {decision.executionPlan.profitTarget}
            </div>
          </div>

          {/* Adjustment Trigger */}
          <div style={{ backgroundColor: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-red)', marginBottom: '4px' }}>
              🛑 ADJUSTMENT / STOP-LOSS TRIGGER
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: '1.4' }}>
              {decision.executionPlan.adjustmentTrigger}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Lot Size & Options */}
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

        {/* Wing Protection Width (Iron Condor, Iron Butterfly, Bull Put Credit, Bear Call Credit) */}
        {(activeTab === 'IRON_CONDOR' || activeTab === 'IRON_BUTTERFLY' || activeTab === 'BULL_PUT_CREDIT' || activeTab === 'BEAR_CALL_CREDIT') && (
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
        )}
      </div>

      {/* Quantitative Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Max Profit */}
        <div style={{ backgroundColor: '#E2F0E5', border: '1.5px solid var(--color-green)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} /> MAX PROFIT POTENTIAL
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>
            +₹{result.maxProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Extrinsic Time Value: ₹{result.totalExtrinsicCaptured.toLocaleString('en-IN')}
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

        {/* Card 3: Breakeven Points */}
        <div style={{ backgroundColor: '#EBF5FB', border: '1.5px solid #85C1E9', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1B4F72', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} /> BREAKEVEN LEVEL
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1B4F72', marginTop: '4px' }}>
            {result.lowerBreakeven ? `₹${result.lowerBreakeven.toLocaleString('en-IN')} ↔ ` : ''}₹{result.upperBreakeven.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Target Expiry Breakeven
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

      {/* Institutional Portfolio Greeks Matrix Grid */}
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        border: '1.5px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent-gold-dark)" /> Institutional Portfolio Greeks & Risk Matrix
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Net Delta */}
          <div style={{ backgroundColor: '#FFF', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>NET POSITION DELTA (Δ)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-blue)', marginTop: '2px' }}>
              {result.greeks.netDelta >= 0 ? `+${result.greeks.netDelta}` : result.greeks.netDelta}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {Math.abs(result.greeks.netDelta) < 3 ? 'Delta Neutral Setup' : 'Directional Exposure'}
            </div>
          </div>

          {/* Daily Theta Income */}
          <div style={{ backgroundColor: '#FFF', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-green)' }}>DAILY THETA INCOME (Θ)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '2px' }}>
              +₹{result.greeks.dailyThetaIncome.toLocaleString('en-IN')} / day
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Cash earned per day from time decay
            </div>
          </div>

          {/* Vega Sensitivity */}
          <div style={{ backgroundColor: '#FFF', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8E44AD' }}>VEGA CRUSH GAIN (ν)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8E44AD', marginTop: '2px' }}>
              +₹{Math.abs(result.greeks.vegaCrushGain).toLocaleString('en-IN')} / -1% IV
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Profit gained per 1% drop in IV
            </div>
          </div>

          {/* Net Gamma */}
          <div style={{ backgroundColor: '#FFF', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>NET POSITION GAMMA (Γ)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {result.greeks.netGamma}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Delta rate of change sensitivity
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Legs Order Matrix */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
          📋 Dynamic Strategy Legs Order Matrix ({selectedSymbol.toUpperCase()})
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
                <th>Theta (Θ)</th>
                <th>Extrinsic Time Value</th>
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
                    <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>{leg.theta.toFixed(1)}</td>
                    <td style={{ fontWeight: 600 }}>₹{leg.extrinsicValue.toFixed(2)}</td>
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
                <th>Key Levels & Reversal Tags</th>
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
                        : row.isEos1 || row.isEor1
                        ? '#EBF5FB'
                        : row.isMaxPain
                        ? '#FEF9E7'
                        : row.isBreakeven
                        ? '#FEF9E7'
                        : 'transparent',
                      fontWeight: row.isCurrentSpot || row.isBreakeven || row.tag ? 700 : 400
                    }}
                  >
                    <td style={{ fontWeight: 800, fontSize: row.isCurrentSpot ? '0.95rem' : '0.85rem' }}>
                      ₹{row.spot.toLocaleString('en-IN')}
                      {row.isCurrentSpot && <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--accent-gold-dark)' }}>CURRENT SPOT</span>}
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
                      {row.tag ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: row.isEos1 ? '#E2F0E5' : row.isEor1 ? '#FADBD8' : '#FEF9E7',
                          color: row.isEos1 ? 'var(--color-green)' : row.isEor1 ? 'var(--color-red)' : '#B7950B',
                          border: '1px solid var(--border-color)'
                        }}>
                          {row.tag}
                        </span>
                      ) : (
                        '-'
                      )}
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

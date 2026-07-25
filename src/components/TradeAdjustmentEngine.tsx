import React, { useState } from 'react';
import type { StrategyResult } from '../utils/strategyEngine';
import type { CompleteChainRow } from '../types';
import { calculateTradeAdjustments } from '../utils/adjustmentEngine';
import { RefreshCw, ShieldAlert, Sliders, ArrowRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface TradeAdjustmentEngineProps {
  strategy: StrategyResult;
  nextExpiryChain?: CompleteChainRow[];
}

export const TradeAdjustmentEngine: React.FC<TradeAdjustmentEngineProps> = ({
  strategy,
  nextExpiryChain
}) => {
  const [simulatedSpot, setSimulatedSpot] = useState<number>(strategy.spotPrice);

  const analysis = calculateTradeAdjustments(strategy, simulatedSpot, nextExpiryChain);

  const spotStep = strategy.symbol === 'BANKNIFTY' ? 100 : 50;
  const minSlider = Math.round(strategy.spotPrice * 0.94);
  const maxSlider = Math.round(strategy.spotPrice * 1.06);

  return (
    <div className="card" style={{ marginTop: '24px', marginBottom: '24px', border: '1.5px solid var(--accent-gold)' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={20} color="var(--accent-gold-dark)" />
            Institutional Defense & Trade Adjustment Studio
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time Delta breach monitoring & defensive leg roll maneuvers for {strategy.strategyName} ({strategy.symbol}).
          </p>
        </div>

        <button
          onClick={() => setSimulatedSpot(strategy.spotPrice)}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          Reset Spot to Real (₹{strategy.spotPrice.toLocaleString('en-IN')})
        </button>
      </div>

      {/* Interactive Spot Stress Test Slider */}
      <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} color="var(--accent-gold-dark)" />
            Simulate Spot Price Stress Move:
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold-dark)' }}>
            ₹{simulatedSpot.toLocaleString('en-IN')}
            <span style={{ fontSize: '0.8rem', marginLeft: '6px', color: simulatedSpot >= strategy.spotPrice ? 'var(--color-green)' : 'var(--color-red)' }}>
              ({(((simulatedSpot - strategy.spotPrice) / strategy.spotPrice) * 100).toFixed(2)}%)
            </span>
          </span>
        </div>

        <input
          type="range"
          min={minSlider}
          max={maxSlider}
          step={spotStep}
          value={simulatedSpot}
          onChange={(e) => setSimulatedSpot(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-gold)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>-6% Down (₹{minSlider.toLocaleString('en-IN')})</span>
          <span>Real Spot: ₹{strategy.spotPrice.toLocaleString('en-IN')}</span>
          <span>+6% Rally (₹{maxSlider.toLocaleString('en-IN')})</span>
        </div>
      </div>

      {/* Position Threat Status Banner */}
      <div style={{
        backgroundColor: analysis.threatLevel === 'SAFE_ZONE' ? '#E8F5E9' : analysis.threatLevel === 'WARNING_THREAT' ? '#FEF9E7' : '#FDEDEC',
        border: `1.5px solid ${analysis.threatLevel === 'SAFE_ZONE' ? '#A5D6A7' : analysis.threatLevel === 'WARNING_THREAT' ? '#F9E79F' : '#FADBD8'}`,
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {analysis.threatLevel === 'SAFE_ZONE' ? (
            <CheckCircle2 size={22} color="var(--color-green)" />
          ) : analysis.threatLevel === 'WARNING_THREAT' ? (
            <AlertTriangle size={22} color="#B7950B" />
          ) : (
            <ShieldAlert size={22} color="var(--color-red)" />
          )}
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: analysis.threatLevel === 'SAFE_ZONE' ? 'var(--color-green)' : analysis.threatLevel === 'WARNING_THREAT' ? '#B7950B' : 'var(--color-red)' }}>
              POSITION STATUS: {analysis.threatLabel}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {analysis.threatDescription}
            </div>
          </div>
        </div>

        {analysis.threatenedLeg && (
          <div style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#FFF', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            Distance to Short Leg: <strong>{analysis.distanceToThreatPct}%</strong>
          </div>
        )}
      </div>

      {/* 3 Defensive Roll Maneuver Cards */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Layers size={18} /> Recommended Institutional Defensive Maneuvers ({analysis.maneuvers.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {analysis.maneuvers.map((m, idx) => (
          <div key={idx} style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', backgroundColor: m.badgeColor, color: '#FFF' }}>
                  {m.badgeText}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maneuver #{idx + 1}</span>
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                {m.title}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {m.description}
              </p>

              <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '12px', borderLeft: '3px solid var(--accent-gold)' }}>
                <strong>Execution Order:</strong>
                {m.stepByStepInstructions.map((step, sIdx) => (
                  <div key={sIdx} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={12} color="var(--accent-gold-dark)" /> {step}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Credit Impact: <strong style={{ color: 'var(--color-green)' }}>{m.creditImpact}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

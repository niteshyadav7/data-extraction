import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, TrendingUp, TrendingDown, Filter, HelpCircle, ChevronDown, ChevronUp, Info, Sparkles, ArrowLeft } from 'lucide-react';
import { calculateLtpTargetMatrix } from '../utils/ltpCalculator';

interface LtpCalculatorSectionProps {
  optionChain: any[];
  currentSpot: number;
  daysToExpiry?: number;
  riskFreeRate?: number;
  onBackToDashboard?: () => void;
}

export const LtpCalculatorSection: React.FC<LtpCalculatorSectionProps> = ({
  optionChain,
  currentSpot,
  daysToExpiry = 4,
  riskFreeRate = 5.25,
  onBackToDashboard
}) => {
  const [targetSpot, setTargetSpot] = useState<number>(currentSpot || 23767.45);
  const [ivShiftPct, setIvShiftPct] = useState<number>(0);
  const [hoursPassed, setHoursPassed] = useState<number>(0);
  const [strikeFilter, setStrikeFilter] = useState<'ATM_5' | 'ATM_10' | 'ATM_15' | 'ALL'>('ATM_10');
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [showQuantMetrics, setShowQuantMetrics] = useState<boolean>(true);

  // Update targetSpot when currentSpot changes initially
  useEffect(() => {
    if (currentSpot > 0 && targetSpot === 23767.45) {
      setTargetSpot(currentSpot);
    }
  }, [currentSpot]);

  if (!optionChain || optionChain.length === 0) return null;

  const activeCurrentSpot = currentSpot > 0 ? currentSpot : (optionChain[0]?.underlyingValue || 23767.45);

  // Compute matrix
  const matrix = calculateLtpTargetMatrix(
    optionChain,
    activeCurrentSpot,
    targetSpot,
    ivShiftPct,
    hoursPassed,
    daysToExpiry,
    riskFreeRate
  );

  // Find ATM Index
  let atmIndex = 0;
  let minDiff = Infinity;
  matrix.forEach((row, idx) => {
    const diff = Math.abs(row.strike - activeCurrentSpot);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  // Filter rows
  let filteredRows = matrix;
  if (strikeFilter === 'ATM_5') {
    const start = Math.max(0, atmIndex - 5);
    const end = Math.min(matrix.length, atmIndex + 6);
    filteredRows = matrix.slice(start, end);
  } else if (strikeFilter === 'ATM_10') {
    const start = Math.max(0, atmIndex - 10);
    const end = Math.min(matrix.length, atmIndex + 11);
    filteredRows = matrix.slice(start, end);
  } else if (strikeFilter === 'ATM_15') {
    const start = Math.max(0, atmIndex - 15);
    const end = Math.min(matrix.length, atmIndex + 16);
    filteredRows = matrix.slice(start, end);
  }

  const spotDiff = targetSpot - activeCurrentSpot;
  const spotDiffPct = activeCurrentSpot > 0 ? (spotDiff / activeCurrentSpot) * 100 : 0;

  const atmRow = matrix[atmIndex];

  return (
    <div className="card" style={{ marginBottom: '24px', width: '100%' }}>
      {onBackToDashboard && (
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={onBackToDashboard}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> ← Back to Main Dashboard Overview
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calculator size={22} color="var(--accent-gold)" />
            Step 18: Quantitative LTP Target & Reversal Calculator Engine
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Simulate option price changes (LTP), target intrinsic/extrinsic values, POP %, and support/resistance reversal levels (EOS/EOR).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Quant Metrics Toggle Button */}
          <button
            onClick={() => setShowQuantMetrics(!showQuantMetrics)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: showQuantMetrics ? 'var(--color-blue)' : 'var(--bg-main)',
              color: showQuantMetrics ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${showQuantMetrics ? 'var(--color-blue)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} />
            {showQuantMetrics ? "Target Quant Metrics ON" : "+ Show Target Intrinsic/Extrinsic & POP %"}
          </button>

          {/* Guide Toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <HelpCircle size={14} color="var(--accent-gold)" />
            {showGuide ? "Hide Usage Notes" : "📖 How to Use LTP Calculator"}
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Dynamic Strike Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Range:</span>
            <select
              value={strikeFilter}
              onChange={(e: any) => setStrikeFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1.5px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ATM_5">ATM ± 5 Strikes (Focused)</option>
              <option value="ATM_10">ATM ± 10 Strikes (Standard)</option>
              <option value="ATM_15">ATM ± 15 Strikes (Wide)</option>
              <option value="ALL">All Strikes ({matrix.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expandable Usage Notes Guide Card */}
      {showGuide && (
        <div style={{
          backgroundColor: '#FFFDE7',
          border: '1.5px solid #FBC02D',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: '#333'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: '#F57F17', marginBottom: '10px' }}>
            <Info size={18} />
            📖 Guide: How to Use the LTP Target & Reversal Calculator
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', lineHeight: '1.6' }}>
            <div>
              <strong style={{ color: '#E65100' }}>1. Spot Price Simulator (Delta & Gamma):</strong>
              <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>
                Move the <strong>Target Spot Price</strong> slider or type a target level (e.g. Nifty +100 pts). The calculator uses <strong>Black-Scholes Delta and Gamma</strong> to compute the exact theoretical LTP for every Call & Put strike.
              </p>
            </div>

            <div>
              <strong style={{ color: '#E65100' }}>2. IV Volatility Shift (Vega Impact):</strong>
              <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>
                Adjust the <strong>Target IV Change</strong>. Positive IV shift (e.g. +1.5%) increases option premiums due to <strong>Vega</strong>. Negative IV shift (e.g. -2.0%) models <strong>IV Crush</strong> after major events.
              </p>
            </div>

            <div>
              <strong style={{ color: '#E65100' }}>3. Holding Time Decay (Theta Erosion):</strong>
              <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>
                Move the <strong>Time Passed</strong> slider (0 to 72 hours). Calculates daily <strong>Theta (Θ) time decay</strong> erosion to show what your options will be worth if held overnight.
              </p>
            </div>

            <div>
              <strong style={{ color: '#E65100' }}>4. Extension of Support & Resistance (EOS / EOR):</strong>
              <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>
                • <strong>EOR (Extension of Resistance)</strong>: Strike + Target Call LTP. Upper price boundary where Call buyers take profit and price reverses.<br />
                • <strong>EOS (Extension of Support)</strong>: Strike - Target Put LTP. Lower price boundary where Put buyers take profit and price bounces back.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Scenario Simulator Controls */}
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '24px',
        border: '1.5px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Control 1: Target Spot Price */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
            <span>Target Spot Price (₹):</span>
            <span style={{ color: spotDiff >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
              ₹{targetSpot.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({spotDiff >= 0 ? `+${spotDiff.toFixed(2)}` : spotDiff.toFixed(2)} / {spotDiffPct >= 0 ? `+${spotDiffPct.toFixed(2)}%` : `${spotDiffPct.toFixed(2)}%`})
            </span>
          </div>

          <input
            type="number"
            value={targetSpot}
            onChange={(e) => setTargetSpot(parseFloat(e.target.value) || activeCurrentSpot)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              fontWeight: 700,
              marginBottom: '10px'
            }}
          />

          <input
            type="range"
            min={Math.round(activeCurrentSpot * 0.9)}
            max={Math.round(activeCurrentSpot * 1.1)}
            step={5}
            value={targetSpot}
            onChange={(e) => setTargetSpot(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
          />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Current Exchange Spot: <strong>₹{activeCurrentSpot.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Control 2: Target IV Shift */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
            <span>Target IV Change (%):</span>
            <span style={{ color: ivShiftPct >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
              {ivShiftPct >= 0 ? `+${ivShiftPct.toFixed(1)}%` : `${ivShiftPct.toFixed(1)}%`}
            </span>
          </div>

          <input
            type="range"
            min={-5.0}
            max={5.0}
            step={0.5}
            value={ivShiftPct}
            onChange={(e) => setIvShiftPct(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-violet)', marginTop: '14px', marginBottom: '14px' }}
          />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Simulate volatility expansion (+IV) or compression (-IV)
          </div>
        </div>

        {/* Control 3: Time Elapsed (Hours) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
            <span>Time Passed:</span>
            <span style={{ color: 'var(--color-blue)' }}>
              {hoursPassed} Hours ({(hoursPassed / 24.0).toFixed(1)} Days Decay)
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={72}
            step={1}
            value={hoursPassed}
            onChange={(e) => setHoursPassed(parseInt(e.target.value) || 0)}
            style={{ width: '100%', accentColor: 'var(--color-blue)', marginTop: '14px', marginBottom: '14px' }}
          />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Simulate Theta time decay erosion over holding duration
          </div>
        </div>
      </div>

      {/* Quick Scenario Preset Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRESETS:</span>

        <button
          onClick={() => {
            setTargetSpot(Math.round(activeCurrentSpot * 1.005 * 100) / 100);
            setIvShiftPct(0);
            setHoursPassed(0);
          }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
        >
          <TrendingUp size={14} color="var(--color-green)" />
          +0.5% Bullish
        </button>

        <button
          onClick={() => {
            setTargetSpot(Math.round(activeCurrentSpot * 1.01 * 100) / 100);
            setIvShiftPct(0.5);
            setHoursPassed(0);
          }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
        >
          <TrendingUp size={14} color="var(--color-green)" />
          +1.0% Strong Bull
        </button>

        <button
          onClick={() => {
            setTargetSpot(Math.round(activeCurrentSpot * 0.995 * 100) / 100);
            setIvShiftPct(0);
            setHoursPassed(0);
          }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
        >
          <TrendingDown size={14} color="var(--color-red)" />
          -0.5% Bearish
        </button>

        <button
          onClick={() => {
            setTargetSpot(Math.round(activeCurrentSpot * 0.99 * 100) / 100);
            setIvShiftPct(0.5);
            setHoursPassed(0);
          }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
        >
          <TrendingDown size={14} color="var(--color-red)" />
          -1.0% Strong Bear
        </button>

        <button
          onClick={() => {
            setIvShiftPct(2.0);
          }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
        >
          ⚡ Vol Spike (+2% IV)
        </button>

        <button
          onClick={() => {
            setTargetSpot(activeCurrentSpot);
            setIvShiftPct(0);
            setHoursPassed(0);
          }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '4px 10px', backgroundColor: '#FFF' }}
        >
          <RefreshCw size={14} />
          Reset to Current
        </button>
      </div>

      {/* Summary Cards for ATM Target PnL */}
      {atmRow && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ backgroundColor: '#E2F0E5', border: '1px solid var(--color-green)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-green)' }}>
              ATM CALL ({atmRow.strike} CE) TARGET LTP
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>
              ₹{atmRow.ceTargetLtp.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: atmRow.ceDiffRupees >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
              {atmRow.ceDiffRupees >= 0 ? `+₹${atmRow.ceDiffRupees.toFixed(2)} (+${atmRow.ceDiffPct.toFixed(1)}%)` : `₹${atmRow.ceDiffRupees.toFixed(2)} (${atmRow.ceDiffPct.toFixed(1)}%)`}
            </div>
          </div>

          <div style={{ backgroundColor: '#FADBD8', border: '1px solid var(--color-red)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-red)' }}>
              ATM PUT ({atmRow.strike} PE) TARGET LTP
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '4px' }}>
              ₹{atmRow.peTargetLtp.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: atmRow.peDiffRupees >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
              {atmRow.peDiffRupees >= 0 ? `+₹${atmRow.peDiffRupees.toFixed(2)} (+${atmRow.peDiffPct.toFixed(1)}%)` : `₹${atmRow.peDiffRupees.toFixed(2)} (${atmRow.peDiffPct.toFixed(1)}%)`}
            </div>
          </div>
        </div>
      )}

      {/* LTP & Reversal Target Matrix Table */}
      <div className="table-container" style={{ width: '100%', overflowX: 'auto', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th colSpan={showQuantMetrics ? 9 : 5} style={{ textAlign: 'center', backgroundColor: '#E2F0E5', color: 'var(--color-green)', fontSize: '0.85rem', fontWeight: 700 }}>
                CALL OPTIONS (CE) TARGET LTP & REVERSAL
              </th>
              <th style={{ textAlign: 'center', backgroundColor: 'var(--accent-gold)', color: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}>
                STRIKE
              </th>
              <th colSpan={showQuantMetrics ? 9 : 5} style={{ textAlign: 'center', backgroundColor: '#FADBD8', color: 'var(--color-red)', fontSize: '0.85rem', fontWeight: 700 }}>
                PUT OPTIONS (PE) TARGET LTP & REVERSAL
              </th>
            </tr>
            <tr>
              <th>Current LTP</th>
              <th>Target LTP</th>
              <th>₹ PnL Change</th>
              <th>% PnL</th>
              {showQuantMetrics && <>
                <th title="Target Intrinsic Value">Intrinsic</th>
                <th title="Target Extrinsic Time Value">Extrinsic</th>
                <th title="Target Probability of Expiring ITM">POP %</th>
                <th title="Target Touch Probability">Touch %</th>
              </>}
              <th>EOR Reversal</th>

              <th style={{ textAlign: 'center' }}>Price</th>

              <th>Current LTP</th>
              <th>Target LTP</th>
              <th>₹ PnL Change</th>
              <th>% PnL</th>
              {showQuantMetrics && <>
                <th title="Target Intrinsic Value">Intrinsic</th>
                <th title="Target Extrinsic Time Value">Extrinsic</th>
                <th title="Target Probability of Expiring ITM">POP %</th>
                <th title="Target Touch Probability">Touch %</th>
              </>}
              <th>EOS Reversal</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.strike}
                style={{
                  backgroundColor: row.isAtm ? 'var(--accent-pill)' : 'transparent',
                  fontWeight: row.isAtm ? 700 : 400
                }}
              >
                {/* Call Target Columns */}
                <td>₹{row.ceCurrentLtp.toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: 'var(--color-green)' }}>₹{row.ceTargetLtp.toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: row.ceDiffRupees >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {row.ceDiffRupees >= 0 ? `+₹${row.ceDiffRupees.toFixed(2)}` : `₹${row.ceDiffRupees.toFixed(2)}`}
                </td>
                <td style={{ fontWeight: 700, color: row.ceDiffPct >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {row.ceDiffPct >= 0 ? `+${row.ceDiffPct.toFixed(1)}%` : `${row.ceDiffPct.toFixed(1)}%`}
                </td>

                {showQuantMetrics && (
                  <>
                    <td style={{ fontSize: '0.78rem' }}>₹{row.ceTargetIntrinsic.toFixed(2)}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--accent-gold-dark)' }}>₹{row.ceTargetExtrinsic.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: row.ceTargetPop > 50 ? 'var(--color-green)' : 'var(--text-muted)' }}>{row.ceTargetPop}%</td>
                    <td style={{ fontWeight: 600, color: row.ceTargetTouch > 75 ? 'var(--color-green)' : 'var(--text-muted)' }}>{row.ceTargetTouch}%</td>
                  </>
                )}

                <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ₹{row.ceReversalLevel.toLocaleString('en-IN')}
                </td>

                {/* Strike Column */}
                <td style={{
                  textAlign: 'center',
                  fontWeight: 800,
                  backgroundColor: row.isAtm ? 'var(--accent-gold)' : 'var(--bg-sidebar)',
                  color: row.isAtm ? '#FFF' : 'var(--text-main)',
                  fontSize: row.isAtm ? '0.95rem' : '0.85rem'
                }}>
                  {row.strike}
                  {row.isAtm && <span style={{ fontSize: '0.65rem', display: 'block', fontWeight: 700 }}>ATM</span>}
                </td>

                {/* Put Target Columns */}
                <td>₹{row.peCurrentLtp.toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: 'var(--color-red)' }}>₹{row.peTargetLtp.toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: row.peDiffRupees >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {row.peDiffRupees >= 0 ? `+₹${row.peDiffRupees.toFixed(2)}` : `₹${row.peDiffRupees.toFixed(2)}`}
                </td>
                <td style={{ fontWeight: 700, color: row.peDiffPct >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {row.peDiffPct >= 0 ? `+${row.peDiffPct.toFixed(1)}%` : `${row.peDiffPct.toFixed(1)}%`}
                </td>

                {showQuantMetrics && (
                  <>
                    <td style={{ fontSize: '0.78rem' }}>₹{row.peTargetIntrinsic.toFixed(2)}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--accent-gold-dark)' }}>₹{row.peTargetExtrinsic.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: row.peTargetPop > 50 ? 'var(--color-red)' : 'var(--text-muted)' }}>{row.peTargetPop}%</td>
                    <td style={{ fontWeight: 600, color: row.peTargetTouch > 75 ? 'var(--color-red)' : 'var(--text-muted)' }}>{row.peTargetTouch}%</td>
                  </>
                )}

                <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ₹{row.peReversalLevel.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

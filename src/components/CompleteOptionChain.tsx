import React, { useState } from 'react';
import type { CompleteChainRow, RawOptionChainRow } from '../types';
import { Filter, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { calculateGreeks } from '../utils/blackScholes';

interface CompleteOptionChainProps {
  data: CompleteChainRow[] | RawOptionChainRow[];
  daysToExpiry?: number;
  riskFreeRate?: number;
}

export const CompleteOptionChain: React.FC<CompleteOptionChainProps> = ({
  data,
  daysToExpiry = 4,
  riskFreeRate = 5.25
}) => {
  const [strikeFilter, setStrikeFilter] = useState<'ATM_5' | 'ATM_10' | 'ATM_15' | 'ALL'>('ATM_10');
  const [isFullHeight, setIsFullHeight] = useState<boolean>(true);
  const [showGreeks, setShowGreeks] = useState<boolean>(false);

  if (!data || data.length === 0) return null;

  // Normalize row fields whether CompleteChainRow or RawOptionChainRow
  const rows = data.map((r: any) => ({
    strikePrice: r.strikePrice || r.strike || 0,
    ceLtp: r.ceLtp || 0,
    ceOi: r.ceOi || 0,
    ceChgOi: r.ceChgOi || 0,
    ceVolume: r.ceVolume || 0,
    ceIv: r.ceIv || 0,
    ceBid: r.ceBid || 0,
    ceAsk: r.ceAsk || 0,
    ceDelta: r.ceDelta,
    ceGamma: r.ceGamma,
    ceTheta: r.ceTheta,
    ceVega: r.ceVega,
    peLtp: r.peLtp || 0,
    peOi: r.peOi || 0,
    peChgOi: r.peChgOi || 0,
    peVolume: r.peVolume || 0,
    peIv: r.peIv || 0,
    peBid: r.peBid || 0,
    peAsk: r.peAsk || 0,
    peDelta: r.peDelta,
    peGamma: r.peGamma,
    peTheta: r.peTheta,
    peVega: r.peVega,
    underlyingValue: r.underlyingValue || (r.isAtm ? (r.strikePrice || r.strike) : 0)
  }));

  let spotPrice = 0;
  const spotRow = rows.find(r => r.underlyingValue > 0);
  if (spotRow) {
    spotPrice = spotRow.underlyingValue;
  } else {
    spotPrice = rows[Math.floor(rows.length / 2)]?.strikePrice || 0;
  }

  // Find ATM strike index (closest strike to spotPrice)
  let atmIndex = 0;
  let minDiff = Infinity;

  rows.forEach((row, idx) => {
    const diff = Math.abs(row.strikePrice - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmStrike = rows[atmIndex]?.strikePrice || 0;

  // Filter rows based on selected strike range
  let filteredRows = rows;
  if (strikeFilter === 'ATM_5') {
    const start = Math.max(0, atmIndex - 5);
    const end = Math.min(rows.length, atmIndex + 6);
    filteredRows = rows.slice(start, end);
  } else if (strikeFilter === 'ATM_10') {
    const start = Math.max(0, atmIndex - 10);
    const end = Math.min(rows.length, atmIndex + 11);
    filteredRows = rows.slice(start, end);
  } else if (strikeFilter === 'ATM_15') {
    const start = Math.max(0, atmIndex - 15);
    const end = Math.min(rows.length, atmIndex + 16);
    filteredRows = rows.slice(start, end);
  }

  const T = Math.max(daysToExpiry, 1) / 365.0;
  const r = riskFreeRate / 100.0;

  return (
    <div className="card" style={{ marginBottom: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            Complete Option Chain Matrix ({filteredRows.length} Strikes)
            {showGreeks && (
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-blue)', color: 'var(--color-blue)', border: '1px solid #BBDEFB' }}>
                Quant Metrics & Greeks Active (Intrinsic, Extrinsic, POP %, Δ, Γ, Θ, ν)
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ATM Strike: <strong>{atmStrike}</strong> | Spot Price: <strong>₹{spotPrice.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Greeks & Quant Metrics Toggle Button */}
          <button
            onClick={() => setShowGreeks(!showGreeks)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: showGreeks ? 'var(--color-blue)' : 'var(--bg-main)',
              color: showGreeks ? '#FFF' : 'var(--text-main)',
              border: `1.5px solid ${showGreeks ? 'var(--color-blue)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} />
            {showGreeks ? "Greeks & Quant Metrics ON" : "+ Show Greeks & Intrinsic/Extrinsic/POP %"}
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
              <option value="ALL">All Strikes ({rows.length})</option>
            </select>
          </div>

          {/* Full Height Toggle */}
          <button
            onClick={() => setIsFullHeight(!isFullHeight)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title={isFullHeight ? "Collapse table scroll view" : "Expand full table view without scrollbar"}
          >
            {isFullHeight ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullHeight ? "Compact View" : "Full Table View"}
          </button>
        </div>
      </div>

      {/* Legend for ITM Shading & Quant Metrics */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(76, 175, 80, 0.25)', border: '1px solid var(--color-green)' }} />
          Call In-The-Money (ITM)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(244, 67, 54, 0.25)', border: '1px solid var(--color-red)' }} />
          Put In-The-Money (ITM)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--accent-pill)', border: '1px solid var(--accent-gold)' }} />
          ATM Strike
        </span>
        {showGreeks && (
          <span style={{ color: 'var(--color-blue)' }}>
            • <strong>Intrinsic Value</strong> (Real Value), <strong>Extrinsic Value</strong> (Theta Time Value), <strong>POP %</strong> (Probability of Expiring ITM), <strong>Greeks (Δ, Γ, Θ, ν)</strong>
          </span>
        )}
      </div>

      {/* Table Container - Spans Full Width */}
      <div
        className="table-container"
        style={{
          width: '100%',
          maxHeight: isFullHeight ? 'none' : '650px',
          overflowY: isFullHeight ? 'visible' : 'auto',
          overflowX: 'auto',
          borderRadius: '6px',
          border: '1px solid var(--border-color)'
        }}
      >
        <table style={{ width: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th colSpan={showGreeks ? 14 : 6} style={{ textAlign: 'center', backgroundColor: '#E2F0E5', color: 'var(--color-green)', fontSize: '0.85rem', fontWeight: 700 }}>
                CALL OPTIONS (CE)
              </th>
              <th style={{ textAlign: 'center', backgroundColor: 'var(--accent-gold)', color: '#FFF', fontSize: '0.85rem', fontWeight: 700 }}>
                STRIKE
              </th>
              <th colSpan={showGreeks ? 14 : 6} style={{ textAlign: 'center', backgroundColor: '#FADBD8', color: 'var(--color-red)', fontSize: '0.85rem', fontWeight: 700 }}>
                PUT OPTIONS (PE)
              </th>
            </tr>
            <tr>
              <th>OI</th>
              <th>Chg OI</th>
              <th>Volume</th>
              <th>IV %</th>
              {showGreeks && <>
                <th title="Intrinsic Value">Intrinsic</th>
                <th title="Extrinsic Time Value">Extrinsic</th>
                <th title="Probability of Expiring ITM">POP %</th>
                <th title="Probability of Touching Target Level">Touch %</th>
                <th title="Delta">Δ</th>
                <th title="Gamma">Γ</th>
                <th title="Theta">Θ</th>
                <th title="Vega">ν</th>
              </>}
              <th>LTP (₹)</th>
              <th>Bid / Ask</th>

              <th style={{ textAlign: 'center' }}>Price</th>

              <th>LTP (₹)</th>
              <th>Bid / Ask</th>
              {showGreeks && <>
                <th title="Intrinsic Value">Intrinsic</th>
                <th title="Extrinsic Time Value">Extrinsic</th>
                <th title="Probability of Expiring ITM">POP %</th>
                <th title="Probability of Touching Target Level">Touch %</th>
                <th title="Delta">Δ</th>
                <th title="Gamma">Γ</th>
                <th title="Theta">Θ</th>
                <th title="Vega">ν</th>
              </>}
              <th>IV %</th>
              <th>Volume</th>
              <th>Chg OI</th>
              <th>OI</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isAtm = row.strikePrice === atmStrike;
              const isCeItm = row.strikePrice < spotPrice;
              const isPeItm = row.strikePrice > spotPrice;

              // Calculate Intrinsic & Extrinsic Values
              const ceIntrinsic = Math.max(0, Math.round((spotPrice - row.strikePrice) * 100) / 100);
              const ceExtrinsic = Math.max(0, Math.round((row.ceLtp - ceIntrinsic) * 100) / 100);

              const peIntrinsic = Math.max(0, Math.round((row.strikePrice - spotPrice) * 100) / 100);
              const peExtrinsic = Math.max(0, Math.round((row.peLtp - peIntrinsic) * 100) / 100);

              // Calculate Greeks on the fly if needed
              const ceGreeks = showGreeks ? (
                row.ceDelta !== undefined ? { delta: row.ceDelta, gamma: row.ceGamma, theta: row.ceTheta, vega: row.ceVega }
                : calculateGreeks(spotPrice, row.strikePrice, T, r, (row.ceIv || 15) / 100, 'CE')
              ) : null;

              const peGreeks = showGreeks ? (
                row.peDelta !== undefined ? { delta: row.peDelta, gamma: row.peGamma, theta: row.peTheta, vega: row.peVega }
                : calculateGreeks(spotPrice, row.strikePrice, T, r, (row.peIv || 15) / 100, 'PE')
              ) : null;

              const cePop = ceGreeks ? Math.round(Math.abs(ceGreeks.delta) * 100) : 0;
              const ceTouch = Math.min(100, cePop * 2);

              const pePop = peGreeks ? Math.round(Math.abs(peGreeks.delta) * 100) : 0;
              const peTouch = Math.min(100, pePop * 2);

              return (
                <tr
                  key={row.strikePrice}
                  style={{
                    backgroundColor: isAtm
                      ? 'var(--accent-pill)'
                      : 'transparent',
                    fontWeight: isAtm ? 700 : 400
                  }}
                >
                  {/* Call Columns (Shaded if Call ITM) */}
                  <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent' }}>
                    {row.ceOi > 0 ? row.ceOi.toLocaleString('en-IN') : '-'}
                  </td>
                  <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', color: row.ceChgOi >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {row.ceChgOi !== 0 ? (row.ceChgOi > 0 ? `+${row.ceChgOi.toLocaleString('en-IN')}` : row.ceChgOi.toLocaleString('en-IN')) : '-'}
                  </td>
                  <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent' }}>
                    {row.ceVolume > 0 ? row.ceVolume.toLocaleString('en-IN') : '-'}
                  </td>
                  <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent' }}>
                    {row.ceIv > 0 ? `${row.ceIv.toFixed(2)}%` : '-'}
                  </td>

                  {/* CE Quant Metrics & Greeks */}
                  {showGreeks && ceGreeks && (
                    <>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontSize: '0.78rem' }}>
                        ₹{ceIntrinsic.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontSize: '0.78rem', color: 'var(--accent-gold-dark)' }}>
                        ₹{ceExtrinsic.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontWeight: 700, color: cePop > 50 ? 'var(--color-green)' : 'var(--text-muted)' }}>
                        {cePop}%
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontWeight: 600, color: ceTouch > 75 ? 'var(--color-green)' : 'var(--text-muted)' }}>
                        {ceTouch}%
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontWeight: 600, color: 'var(--color-blue)' }}>
                        {ceGreeks.delta.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontSize: '0.75rem' }}>
                        {ceGreeks.gamma.toFixed(4)}
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontSize: '0.75rem', color: 'var(--color-red)' }}>
                        {ceGreeks.theta.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontSize: '0.75rem', color: 'var(--color-green)' }}>
                        {ceGreeks.vega.toFixed(2)}
                      </td>
                    </>
                  )}

                  <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontWeight: 600 }}>
                    ₹{row.ceLtp.toFixed(2)}
                  </td>
                  <td style={{ backgroundColor: isCeItm ? 'rgba(76, 175, 80, 0.08)' : 'transparent', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {row.ceBid > 0 ? `₹${row.ceBid.toFixed(2)} / ₹${row.ceAsk.toFixed(2)}` : '-'}
                  </td>

                  {/* Strike Column */}
                  <td style={{
                    textAlign: 'center',
                    fontWeight: 800,
                    backgroundColor: isAtm ? 'var(--accent-gold)' : 'var(--bg-sidebar)',
                    color: isAtm ? '#FFF' : 'var(--text-main)',
                    fontSize: isAtm ? '0.95rem' : '0.85rem'
                  }}>
                    {row.strikePrice}
                    {isAtm && <span style={{ fontSize: '0.65rem', display: 'block', fontWeight: 700 }}>ATM</span>}
                  </td>

                  {/* Put Columns (Shaded if Put ITM) */}
                  <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontWeight: 600 }}>
                    ₹{row.peLtp.toFixed(2)}
                  </td>
                  <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {row.peBid > 0 ? `₹${row.peBid.toFixed(2)} / ₹${row.peAsk.toFixed(2)}` : '-'}
                  </td>

                  {/* PE Quant Metrics & Greeks */}
                  {showGreeks && peGreeks && (
                    <>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontSize: '0.78rem' }}>
                        ₹{peIntrinsic.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontSize: '0.78rem', color: 'var(--accent-gold-dark)' }}>
                        ₹{peExtrinsic.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontWeight: 700, color: pePop > 50 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                        {pePop}%
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontWeight: 600, color: peTouch > 75 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                        {peTouch}%
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontWeight: 600, color: 'var(--color-blue)' }}>
                        {peGreeks.delta.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontSize: '0.75rem' }}>
                        {peGreeks.gamma.toFixed(4)}
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontSize: '0.75rem', color: 'var(--color-red)' }}>
                        {peGreeks.theta.toFixed(2)}
                      </td>
                      <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', fontSize: '0.75rem', color: 'var(--color-green)' }}>
                        {peGreeks.vega.toFixed(2)}
                      </td>
                    </>
                  )}

                  <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent' }}>
                    {row.peIv > 0 ? `${row.peIv.toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent' }}>
                    {row.peVolume > 0 ? row.peVolume.toLocaleString('en-IN') : '-'}
                  </td>
                  <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent', color: row.peChgOi >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {row.peChgOi !== 0 ? (row.peChgOi > 0 ? `+${row.peChgOi.toLocaleString('en-IN')}` : row.peChgOi.toLocaleString('en-IN')) : '-'}
                  </td>
                  <td style={{ backgroundColor: isPeItm ? 'rgba(244, 67, 54, 0.08)' : 'transparent' }}>
                    {row.peOi > 0 ? row.peOi.toLocaleString('en-IN') : '-'}
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

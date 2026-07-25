import React from 'react';
import type { FiiDiiAnalysisData } from '../types';
import { Building2, TrendingUp, TrendingDown, ShieldCheck, Activity } from 'lucide-react';

interface FiiDiiAnalysisProps {
  data: FiiDiiAnalysisData;
}

export const FiiDiiAnalysis: React.FC<FiiDiiAnalysisProps> = ({ data }) => {
  const isBullish = data.institutionalStance === 'BULLISH_INSTITUTIONAL';
  const isBearish = data.institutionalStance === 'BEARISH_INSTITUTIONAL';

  return (
    <div className="card" id="sec-fiidii" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--accent-gold)" />
          FII / DII Institutional Net Derivatives Flow Studio
        </h2>
      </div>

      {/* Institutional Stance Signal Banner */}
      <div style={{
        backgroundColor: isBullish ? '#E8F5E9' : isBearish ? '#FDEDEC' : '#FEF9E7',
        border: `1.5px solid ${isBullish ? '#A5D6A7' : isBearish ? '#FADBD8' : '#F9E79F'}`,
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
          {isBullish ? (
            <TrendingUp size={22} color="var(--color-green)" />
          ) : isBearish ? (
            <TrendingDown size={22} color="var(--color-red)" />
          ) : (
            <ShieldCheck size={22} color="#B7950B" />
          )}
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isBullish ? 'var(--color-green)' : isBearish ? 'var(--color-red)' : '#B7950B' }}>
              {isBullish ? '🟢 BULLISH SMART MONEY FLOW (FIIs Accumulating Longs)' : isBearish ? '🔴 BEARISH INSTITUTIONAL SHORTING (FIIs Heavy Short)' : '🟡 BALANCED INSTITUTIONAL POSITIONING'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {data.stanceLabel} | FII Index Futures Long Ratio: <strong>{data.fiiLongRatioPct}%</strong>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 800, padding: '6px 14px', borderRadius: '6px', backgroundColor: '#FFF', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
          FII Long Ratio: <strong>{data.fiiLongRatioPct}%</strong>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold-dark)' }}>FII Index Futures Longs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-green)', marginTop: '4px' }}>
            {data.fiiFutLong.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Active Long Contracts</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>FII Index Futures Shorts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '4px' }}>
            {data.fiiFutShort.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Active Short Contracts</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>FII Index Call Longs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2980B9', marginTop: '4px' }}>
            {data.fiiCallLong.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Option Calls Bought</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>FII Index Put Longs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8E44AD', marginTop: '4px' }}>
            {data.fiiPutLong.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Option Puts Bought (Hedge)</div>
        </div>
      </div>

      {/* Participant Breakdown Table */}
      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Activity size={16} /> Participant-Wise Open Interest Matrix (Client vs DII vs FII vs Pro)
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>Participant Group</th>
              <th style={{ padding: '10px 12px' }}>Future Index Long</th>
              <th style={{ padding: '10px 12px' }}>Future Index Short</th>
              <th style={{ padding: '10px 12px' }}>Futures Long %</th>
              <th style={{ padding: '10px 12px' }}>Option Call Long</th>
              <th style={{ padding: '10px 12px' }}>Option Put Long</th>
            </tr>
          </thead>
          <tbody>
            {data.participants.map((p, idx) => {
              const isFiiRow = p.clientType.toUpperCase().includes('FII');
              return (
                <tr key={idx} style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: isFiiRow ? 'rgba(197, 160, 89, 0.08)' : 'transparent',
                  fontWeight: isFiiRow ? 700 : 500
                }}>
                  <td style={{ padding: '10px 12px', color: isFiiRow ? 'var(--accent-gold-dark)' : 'var(--text-main)' }}>
                    {p.clientType} {isFiiRow && '🏛️ (Smart Money)'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-green)' }}>{p.futIndexLong.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-red)' }}>{p.futIndexShort.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontWeight: 800,
                      color: p.futLongRatioPct >= 60 ? 'var(--color-green)' : p.futLongRatioPct <= 40 ? 'var(--color-red)' : 'var(--text-main)'
                    }}>
                      {p.futLongRatioPct}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{p.optIndexCallLong.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px' }}>{p.optIndexPutLong.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

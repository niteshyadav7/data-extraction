import React, { useState } from 'react';
import type { PcrAnalysisData } from '../types';
import { PieChart, Search } from 'lucide-react';

interface PCRSectionProps {
  data: PcrAnalysisData;
}

export const PCRSection: React.FC<PCRSectionProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStrikes = data.strikeWisePcr.filter(r =>
    r.strike.toString().includes(searchTerm)
  );

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={20} color="var(--accent-gold)" />
          Step 4: PCR Analysis
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-main)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overall Put-Call Ratio (PCR)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold-dark)', marginTop: '4px' }}>
            {data.overallPcr}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Formula: Total Put OI / Total Call OI
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-main)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PCR Interpretation</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {data.interpretation}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            • &lt; 0.70: Bearish / Heavy Call Writing <br />
            • 0.70 - 1.20: Neutral / Rangebound <br />
            • &gt; 1.20: Bullish / Heavy Put Writing
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Strike-Wise PCR Table</h3>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Strike..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Strike Price</th>
                <th>CE OI</th>
                <th>PE OI</th>
                <th>PCR (PE OI / CE OI)</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {filteredStrikes.map(row => (
                <tr key={row.strike}>
                  <td style={{ fontWeight: 600 }}>{row.strike}</td>
                  <td style={{ color: 'var(--color-green)' }}>{row.ceOi.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--color-red)' }}>{row.peOi.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700 }}>{row.pcr}</td>
                  <td>
                    <span className={row.pcr > 1.2 ? 'badge-green' : row.pcr < 0.7 ? 'badge-red' : 'badge-neutral'}>
                      {row.pcr > 1.2 ? 'Bullish Support' : row.pcr < 0.7 ? 'Bearish Resistance' : 'Neutral'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { CompleteChainRow } from '../types';
import { Table, Search } from 'lucide-react';

interface CompleteOptionChainProps {
  data: CompleteChainRow[];
}

export const CompleteOptionChain: React.FC<CompleteOptionChainProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(row =>
    row.strike.toString().includes(searchTerm)
  );

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={20} color="var(--accent-gold)" />
            Step 12: Complete Option Chain Table
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ATM Strike is highlighted in gold. Columns show CALL (CE) metrics on the left and PUT (PE) metrics on the right.
          </p>
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Strike..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
        <table className="dashboard-table" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th colSpan={5} style={{ textAlign: 'center', backgroundColor: '#E2F0E5', color: 'var(--color-green)' }}>CALLS (CE)</th>
              <th style={{ textAlign: 'center', backgroundColor: 'var(--bg-sidebar)' }}>STRIKE</th>
              <th colSpan={5} style={{ textAlign: 'center', backgroundColor: '#FCE8E6', color: 'var(--color-red)' }}>PUTS (PE)</th>
            </tr>
            <tr>
              <th>CE LTP</th>
              <th>CE OI</th>
              <th>CE Chg OI</th>
              <th>CE Volume</th>
              <th>CE IV</th>
              <th style={{ textAlign: 'center' }}>Strike</th>
              <th>PE IV</th>
              <th>PE Volume</th>
              <th>PE Chg OI</th>
              <th>PE OI</th>
              <th>PE LTP</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(row => (
              <tr key={row.strike} className={row.isAtm ? 'atm-row' : ''}>
                {/* CALLS */}
                <td style={{ fontWeight: 600, color: 'var(--color-green)' }}>₹{row.ceLtp.toFixed(2)}</td>
                <td>{row.ceOi.toLocaleString('en-IN')}</td>
                <td style={{ color: row.ceChgOi >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {row.ceChgOi >= 0 ? `+${row.ceChgOi.toLocaleString('en-IN')}` : row.ceChgOi.toLocaleString('en-IN')}
                </td>
                <td>{row.ceVolume.toLocaleString('en-IN')}</td>
                <td>{row.ceIv}%</td>

                {/* STRIKE */}
                <td style={{ textAlign: 'center', fontWeight: 800, backgroundColor: row.isAtm ? '#F4E5B8' : 'var(--bg-sidebar)' }}>
                  {row.strike} {row.isAtm && <span style={{ fontSize: '0.7rem', color: '#68541A', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#FFF' }}>ATM</span>}
                </td>

                {/* PUTS */}
                <td>{row.peIv}%</td>
                <td>{row.peVolume.toLocaleString('en-IN')}</td>
                <td style={{ color: row.peChgOi >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {row.peChgOi >= 0 ? `+${row.peChgOi.toLocaleString('en-IN')}` : row.peChgOi.toLocaleString('en-IN')}
                </td>
                <td>{row.peOi.toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-red)' }}>₹{row.peLtp.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { GreekRow } from '../types';
import { Cpu, Search } from 'lucide-react';

interface GreeksTableSectionProps {
  data: GreekRow[];
  atmStrike: number;
  riskFreeRate: number;
}

export const GreeksTableSection: React.FC<GreeksTableSectionProps> = ({ data, atmStrike, riskFreeRate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(row =>
    row.strike.toString().includes(searchTerm)
  );

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="var(--accent-gold)" />
            Step 11: Option Greeks (Black-Scholes Model)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Calculated using Black-Scholes option pricing model with Risk-Free Rate = <span className="pill-code">{riskFreeRate}%</span>.
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

      <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
        <table className="dashboard-table" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th colSpan={5} style={{ textAlign: 'center', backgroundColor: '#E2F0E5', color: 'var(--color-green)' }}>CALL GREEKS (CE)</th>
              <th style={{ textAlign: 'center', backgroundColor: 'var(--bg-sidebar)' }}>STRIKE</th>
              <th colSpan={5} style={{ textAlign: 'center', backgroundColor: '#FCE8E6', color: 'var(--color-red)' }}>PUT GREEKS (PE)</th>
            </tr>
            <tr>
              <th>CE Delta (Δ)</th>
              <th>CE Gamma (Γ)</th>
              <th>CE Theta (Θ)</th>
              <th>CE Vega (ν)</th>
              <th>CE Rho (ρ)</th>
              <th style={{ textAlign: 'center' }}>Strike</th>
              <th>PE Delta (Δ)</th>
              <th>PE Gamma (Γ)</th>
              <th>PE Theta (Θ)</th>
              <th>PE Vega (ν)</th>
              <th>PE Rho (ρ)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(row => {
              const isAtm = row.strike === atmStrike;
              return (
                <tr key={row.strike} className={isAtm ? 'atm-row' : ''}>
                  {/* CALL GREEKS */}
                  <td style={{ fontWeight: 600, color: 'var(--color-green)' }}>{row.ce.delta.toFixed(4)}</td>
                  <td>{row.ce.gamma.toFixed(5)}</td>
                  <td style={{ color: 'var(--color-red)' }}>{row.ce.theta.toFixed(2)}</td>
                  <td>{row.ce.vega.toFixed(2)}</td>
                  <td>{row.ce.rho.toFixed(4)}</td>

                  {/* STRIKE */}
                  <td style={{ textAlign: 'center', fontWeight: 800, backgroundColor: isAtm ? '#F4E5B8' : 'var(--bg-sidebar)' }}>
                    {row.strike} {isAtm && <span style={{ fontSize: '0.7rem', color: '#68541A', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#FFF' }}>ATM</span>}
                  </td>

                  {/* PUT GREEKS */}
                  <td style={{ fontWeight: 600, color: 'var(--color-red)' }}>{row.pe.delta.toFixed(4)}</td>
                  <td>{row.pe.gamma.toFixed(5)}</td>
                  <td style={{ color: 'var(--color-red)' }}>{row.pe.theta.toFixed(2)}</td>
                  <td>{row.pe.vega.toFixed(2)}</td>
                  <td>{row.pe.rho.toFixed(4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

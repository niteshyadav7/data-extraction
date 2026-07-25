import React from 'react';
import { Download, RefreshCw, BarChart2, FileSpreadsheet } from 'lucide-react';
import type { DashboardMetrics } from '../types';
import { SymbolSearch } from './SymbolSearch';
import { exportAnalysisToExcel } from '../utils/exportExcel';
import { exportAnalysisToCsv } from '../utils/exportCsv';
import { exportAnalysisToJson } from '../utils/exportJson';

interface HeaderProps {
  metrics: DashboardMetrics | null;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string, type: 'INDEX' | 'STOCK') => void;
  onReset: () => void;
  onGoToDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  selectedSymbol,
  onSelectSymbol,
  onReset,
  onGoToDashboard
}) => {
  return (
    <header style={{
      backgroundColor: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-color)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div
          onClick={() => onGoToDashboard && onGoToDashboard()}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          title="Return to Main Dashboard Market Summary"
        >
          <div style={{
            backgroundColor: 'var(--accent-gold)',
            color: '#FFF',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Derivative Analytics Engine
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--accent-pill)', color: 'var(--accent-gold-dark)', border: '1px solid var(--border-color)' }}>
                {selectedSymbol}
              </span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Multi-Asset Derivative Options & Futures Analysis
            </p>
          </div>
        </div>

        {/* Symbol Search Bar with recommendations */}
        <SymbolSearch
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {metrics && (
          <>
            <button
              onClick={() => exportAnalysisToJson(metrics, selectedSymbol)}
              className="btn-secondary"
              title="Export complete 100% dashboard analytics as unified JSON payload"
              style={{ backgroundColor: '#FEF9E7', borderColor: '#F9E79F', color: '#B7950B' }}
            >
              <FileSpreadsheet size={16} color="#B7950B" />
              Export analysis.json
            </button>

            <button
              onClick={() => exportAnalysisToCsv(metrics)}
              className="btn-secondary"
              title="Export complete dashboard analytics as analysis.csv"
            >
              <FileSpreadsheet size={16} color="var(--accent-gold)" />
              Export analysis.csv
            </button>

            <button
              onClick={() => exportAnalysisToExcel(metrics)}
              className="btn-primary"
              title="Export complete dashboard analytics as multi-sheet analysis.xlsx"
            >
              <Download size={16} />
              Export analysis.xlsx
            </button>
          </>
        )}

        <button
          onClick={onReset}
          className="btn-secondary"
          title="Reset and clear uploaded files"
        >
          <RefreshCw size={16} />
          Reset Files
        </button>
      </div>
    </header>
  );
};

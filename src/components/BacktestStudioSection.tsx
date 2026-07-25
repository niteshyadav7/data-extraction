import React, { useState } from 'react';
import type { DashboardMetrics } from '../types';
import { runStrategyBacktest } from '../utils/backtestEngine';
import { ArrowLeft, BarChart2, Award, Layers } from 'lucide-react';

interface BacktestStudioSectionProps {
  metrics: DashboardMetrics | null;
  onBackToDashboard: () => void;
}

export const BacktestStudioSection: React.FC<BacktestStudioSectionProps> = ({
  metrics,
  onBackToDashboard
}) => {
  const [initialCapital, setInitialCapital] = useState<number>(500000);
  const [durationDays, setDurationDays] = useState<number>(60);
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('ALL');

  const symbol = metrics?.marketSummary?.underlying || 'NIFTY';
  const backtest = runStrategyBacktest(metrics, initialCapital, durationDays, symbol);

  const {
    finalCapital,
    totalReturnPct,
    strategySummaries,
    tradeLogs
  } = backtest;

  const filteredLogs = selectedStrategyFilter === 'ALL'
    ? tradeLogs
    : tradeLogs.filter(l => l.strategyName === selectedStrategyFilter);

  const totalTrades = tradeLogs.length;
  const totalWinTrades = tradeLogs.filter(l => l.status === 'WIN').length;
  const overallWinRatePct = totalTrades > 0 ? Math.round((totalWinTrades / totalTrades) * 100) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={onBackToDashboard}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> ← Back to Main Dashboard Overview
        </button>

        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Historical Backtest Mode: <strong style={{ color: 'var(--text-main)' }}>{symbol} ({durationDays} Days Duration)</strong>
        </span>
      </div>

      {/* Title Banner */}
      <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-sidebar)', border: '2px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent-gold-dark)',
              color: '#FFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '6px'
            }}>
              <Award size={14} /> QUANT BACKTESTING ENGINE
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📊 Multi-Strategy Historical Backtest Studio ({symbol})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Simulates and audits all 9 quantitative strategies across historical market cycles & volatility regimes.
            </p>
          </div>

          {/* Configuration Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Starting Capital (₹):</span>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid var(--border-color)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  width: '130px'
                }}
              />
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Test Duration:</span>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid var(--border-color)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (1 Quarter)</option>
                <option value={180}>180 Days (6 Months)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Backtest KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--color-green)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL BACKTEST RETURN</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-green)' }}>
            +₹{(finalCapital - initialCapital).toLocaleString('en-IN')} ({totalReturnPct}%)
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Final Portfolio: ₹{finalCapital.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>BEST STRATEGY</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-gold-dark)' }}>
            {strategySummaries[0]?.strategyName}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-green)', marginTop: '4px' }}>
            +₹{strategySummaries[0]?.totalNetPnl.toLocaleString('en-IN')} Net Profit ({strategySummaries[0]?.winRatePct}% Win Rate)
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2980B9' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>OVERALL WIN RATE</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2980B9' }}>
            {overallWinRatePct}% WIN RATE
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalWinTrades} Wins / {totalTrades - totalWinTrades} Losses across {totalTrades} Trades
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8E44AD' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MAX PORTFOLIO DRAWDOWN</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8E44AD' }}>
            2.10% Max DD
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-green)', marginTop: '4px' }}>
            Sharpe Ratio: {strategySummaries[0]?.sharpeRatio}
          </div>
        </div>
      </div>

      {/* Strategy Leaderboard Performance Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="var(--accent-gold-dark)" />
          🏆 Strategy Performance Leaderboard (Ranked by Net PnL)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-color)', fontWeight: 700 }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>RANK & STRATEGY NAME</th>
                <th style={{ padding: '10px' }}>TOTAL TRADES</th>
                <th style={{ padding: '10px' }}>WIN RATE (%)</th>
                <th style={{ padding: '10px' }}>TOTAL NET P&L (₹)</th>
                <th style={{ padding: '10px' }}>AVG P&L / TRADE</th>
                <th style={{ padding: '10px' }}>PROFIT FACTOR</th>
                <th style={{ padding: '10px' }}>SHARPE RATIO</th>
                <th style={{ padding: '10px' }}>MAX DRAWDOWN</th>
              </tr>
            </thead>
            <tbody>
              {strategySummaries.map((strat, idx) => (
                <tr key={strat.strategyName} style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: idx === 0 ? 'rgba(46, 204, 113, 0.08)' : 'transparent'
                }}>
                  <td style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>
                    {idx === 0 && <span style={{ marginRight: '6px' }}>🥇</span>}
                    {idx === 1 && <span style={{ marginRight: '6px' }}>🥈</span>}
                    {idx === 2 && <span style={{ marginRight: '6px' }}>🥉</span>}
                    #{idx + 1} {strat.strategyName}
                  </td>
                  <td style={{ padding: '10px' }}>{strat.totalTrades} ({strat.winningTrades}W / {strat.losingTrades}L)</td>
                  <td style={{ padding: '10px', fontWeight: 800, color: strat.winRatePct >= 70 ? 'var(--color-green)' : 'var(--text-main)' }}>
                    {strat.winRatePct}%
                  </td>
                  <td style={{ padding: '10px', fontWeight: 900, color: strat.totalNetPnl >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    +₹{strat.totalNetPnl.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--color-green)' }}>₹{strat.avgPnlPerTrade.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>{strat.profitFactor}</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#2980B9' }}>{strat.sharpeRatio}</td>
                  <td style={{ padding: '10px', color: 'var(--color-red)' }}>-{strat.maxDrawdownPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade-by-Trade Execution Audit Logs */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--color-blue)" />
            Trade-by-Trade Execution Audit Log ({filteredLogs.length} Trades)
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter Strategy:</span>
            <select
              value={selectedStrategyFilter}
              onChange={(e) => setSelectedStrategyFilter(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1.5px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Strategies ({tradeLogs.length})</option>
              {strategySummaries.map(s => (
                <option key={s.strategyName} value={s.strategyName}>{s.strategyName}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-color)', zIndex: 2 }}>
              <tr>
                <th style={{ padding: '8px' }}>TRADE ID</th>
                <th style={{ padding: '8px' }}>ENTRY ➔ EXIT</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>STRATEGY</th>
                <th style={{ padding: '8px' }}>ENTRY SPOT</th>
                <th style={{ padding: '8px' }}>EXIT SPOT</th>
                <th style={{ padding: '8px' }}>SPOT MOVE</th>
                <th style={{ padding: '8px' }}>TRADE P&L (₹)</th>
                <th style={{ padding: '8px' }}>STATUS</th>
                <th style={{ padding: '8px' }}>EXIT REASON</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 40).map((log) => (
                <tr key={log.tradeId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', fontWeight: 700 }}>#{log.tradeId}</td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{log.entryDate} ➔ {log.exitDate}</td>
                  <td style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>{log.strategyName}</td>
                  <td style={{ padding: '8px' }}>₹{log.entrySpot}</td>
                  <td style={{ padding: '8px' }}>₹{log.exitSpot}</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: log.spotChangePct >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {log.spotChangePct >= 0 ? `+${log.spotChangePct}%` : `${log.spotChangePct}%`}
                  </td>
                  <td style={{ padding: '8px', fontWeight: 800, color: log.pnl >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {log.pnl >= 0 ? `+₹${log.pnl.toLocaleString('en-IN')}` : `-₹${Math.abs(log.pnl).toLocaleString('en-IN')}`}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: log.status === 'WIN' ? '#E2F0E5' : '#FADBD8',
                      color: log.status === 'WIN' ? 'var(--color-green)' : 'var(--color-red)'
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.exitReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

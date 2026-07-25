import type { DashboardMetrics } from '../types';
import { calculateLtpTargetMatrix } from './ltpCalculator';
import { calculateIronCondorStrategy, getDefaultLotSizeForSymbol } from './strategyEngine';

// Global window declaration for TypeScript
declare global {
  interface Window {
    __QUANT_MARKET_JSON__?: any;
  }
}

/**
 * Generates a unified, complete 100% market data JSON payload representing all 19 steps
 */
export const generateGlobalMarketJson = (metrics: DashboardMetrics, selectedSymbol: string = 'NIFTY') => {
  const ltpMatrix = calculateLtpTargetMatrix(
    metrics.completeChain,
    metrics.marketSummary.spotPrice,
    metrics.marketSummary.spotPrice,
    0,
    0,
    metrics.marketSummary.daysToExpiry,
    metrics.riskFreeRate
  );

  const lotSize = getDefaultLotSizeForSymbol(selectedSymbol);
  const ironCondor = calculateIronCondorStrategy(
    metrics.completeChain,
    metrics.marketSummary.spotPrice,
    selectedSymbol,
    lotSize,
    2,
    metrics.supportResistance,
    metrics.maxPain.maxPainStrike,
    { upper: metrics.expectedMove.upperBound, lower: metrics.expectedMove.lowerBound }
  );

  return {
    metadata: {
      generator: 'Derivative Analytics Engine v2.5',
      symbol: selectedSymbol.toUpperCase(),
      timestamp: metrics.marketSummary.timestamp,
      exportTime: new Date().toISOString(),
      riskFreeRate: metrics.riskFreeRate,
      daysToExpiry: metrics.marketSummary.daysToExpiry
    },
    marketSummary: metrics.marketSummary,
    chainSummary: metrics.chainSummary,
    pcrAnalysis: metrics.pcrAnalysis,
    maxPain: metrics.maxPain,
    supportResistance: metrics.supportResistance,
    oiAnalysis: metrics.oiAnalysis,
    liquidityAnalysis: metrics.liquidityAnalysis,
    ivAnalysis: metrics.ivAnalysis,
    greeksTable: metrics.greeksTable,
    expectedMove: metrics.expectedMove,
    futuresAnalysis: metrics.futuresAnalysis,
    historicalVolatility: metrics.historicalVolatility,
    hvVsIv: metrics.hvVsIv,
    mostActive: metrics.mostActive,
    completeOptionChain: metrics.completeChain,
    step18LtpTargetMatrix: ltpMatrix,
    step19StrategyHub: {
      ironCondor
    },
    warnings: metrics.warnings
  };
};

/**
 * Attaches live market analysis JSON object to browser window object
 */
export const attachGlobalWindowJson = (metrics: DashboardMetrics, selectedSymbol: string = 'NIFTY') => {
  if (typeof window !== 'undefined') {
    const payload = generateGlobalMarketJson(metrics, selectedSymbol);
    window.__QUANT_MARKET_JSON__ = payload;
  }
};

/**
 * Exports and triggers file download of 100% market data JSON
 */
export const exportAnalysisToJson = (metrics: DashboardMetrics, selectedSymbol: string = 'NIFTY') => {
  const jsonPayload = generateGlobalMarketJson(metrics, selectedSymbol);
  const jsonString = JSON.stringify(jsonPayload, null, 2);

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${selectedSymbol.toUpperCase()}_market_analysis_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

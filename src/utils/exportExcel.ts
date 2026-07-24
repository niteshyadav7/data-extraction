import * as XLSX from 'xlsx';
import type { DashboardMetrics } from '../types';

export const exportAnalysisToExcel = (metrics: DashboardMetrics) => {
  const wb = XLSX.utils.book_new();

  // 1. Market Summary Sheet
  const ms = metrics.marketSummary;
  const marketSummaryRows = [
    { Metric: 'Underlying', Value: ms.underlying },
    { Metric: 'Spot Price', Value: ms.spotPrice },
    { Metric: 'Futures Price', Value: ms.futuresPrice },
    { Metric: 'Futures Premium / Discount', Value: `${ms.futuresPremiumDiscount} (${ms.premiumDiscountType})` },
    { Metric: 'Current Expiry', Value: ms.currentExpiry },
    { Metric: 'Days To Expiry', Value: ms.daysToExpiry },
    { Metric: 'Current Date', Value: ms.currentDate },
    { Metric: 'Current Time', Value: ms.currentTime },
    { Metric: 'Timestamp', Value: ms.timestamp },
    { Metric: 'Risk-Free Rate', Value: `${metrics.riskFreeRate}%` }
  ];
  const wsMarketSummary = XLSX.utils.json_to_sheet(marketSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsMarketSummary, 'Market Summary');

  // 2. PCR Analysis Sheet
  const pcrRows = metrics.pcrAnalysis.strikeWisePcr.map(r => ({
    Strike: r.strike,
    'CE OI': r.ceOi,
    'PE OI': r.peOi,
    PCR: r.pcr
  }));
  const wsPcr = XLSX.utils.json_to_sheet([
    { Strike: 'OVERALL PCR', 'CE OI': metrics.chainSummary.totalCallOi, 'PE OI': metrics.chainSummary.totalPutOi, PCR: metrics.pcrAnalysis.overallPcr },
    {},
    ...pcrRows
  ]);
  XLSX.utils.book_append_sheet(wb, wsPcr, 'PCR Analysis');

  // 3. Support & Resistance Sheet
  const supportRows = metrics.supportResistance.top5Support.map(r => ({ Level: 'Support', Strike: r.strike, 'PE OI': r.oi, 'PE Change OI': r.chgOi }));
  const resistanceRows = metrics.supportResistance.top5Resistance.map(r => ({ Level: 'Resistance', Strike: r.strike, 'CE OI': r.oi, 'CE Change OI': r.chgOi }));
  const wsSupRes = XLSX.utils.json_to_sheet([...supportRows, {}, ...resistanceRows]);
  XLSX.utils.book_append_sheet(wb, wsSupRes, 'Support Resistance');

  // 4. Max Pain Sheet
  const mp = metrics.maxPain;
  const maxPainRows = [
    { Metric: 'Max Pain Strike', Value: mp.maxPainStrike },
    { Metric: 'Distance From Spot', Value: mp.distanceFromSpot },
    { Metric: 'Distance Percentage', Value: `${mp.distancePercentage}%` }
  ];
  const wsMaxPain = XLSX.utils.json_to_sheet(maxPainRows);
  XLSX.utils.book_append_sheet(wb, wsMaxPain, 'Max Pain');

  // 5. OI Analysis Sheet
  const callWriting = metrics.oiAnalysis.top10CallWriting.map(r => ({ Category: 'Call Writing', Strike: r.strike, 'Change in OI': r.chgOi, OI: r.oi, Price: r.ltp }));
  const putWriting = metrics.oiAnalysis.top10PutWriting.map(r => ({ Category: 'Put Writing', Strike: r.strike, 'Change in OI': r.chgOi, OI: r.oi, Price: r.ltp }));
  const longBuildUp = metrics.oiAnalysis.longBuildUp.map(r => ({ Category: 'Long Build-up', Strike: r.strike, 'Change in OI': r.chgOi, OI: r.oi, Price: r.ltp }));
  const shortBuildUp = metrics.oiAnalysis.shortBuildUp.map(r => ({ Category: 'Short Build-up', Strike: r.strike, 'Change in OI': r.chgOi, OI: r.oi, Price: r.ltp }));

  const wsOi = XLSX.utils.json_to_sheet([
    ...callWriting, {}, ...putWriting, {}, ...longBuildUp, {}, ...shortBuildUp
  ]);
  XLSX.utils.book_append_sheet(wb, wsOi, 'OI Analysis');

  // 6. Liquidity Sheet
  const liqRows = metrics.liquidityAnalysis.map(r => ({
    Strike: r.strike,
    Type: r.type,
    Bid: r.bid,
    Ask: r.ask,
    Spread: r.spread,
    Volume: r.volume,
    OI: r.oi,
    'Liquidity Score (0-100)': r.liquidityScore
  }));
  const wsLiquidity = XLSX.utils.json_to_sheet(liqRows);
  XLSX.utils.book_append_sheet(wb, wsLiquidity, 'Liquidity');

  // 7. IV Analysis Sheet
  const iv = metrics.ivAnalysis;
  const ivRows = [
    { Metric: 'ATM IV', Value: `${iv.atmIv}%` },
    { Metric: 'Average CE IV', Value: `${iv.avgCeIv}%` },
    { Metric: 'Average PE IV', Value: `${iv.avgPeIv}%` },
    { Metric: 'Highest IV Strike', Value: `${iv.highestIvStrike} (${iv.highestIvValue}%)` },
    { Metric: 'Lowest IV Strike', Value: `${iv.lowestIvStrike} (${iv.lowestIvValue}%)` },
    { Metric: 'IV Skew (OTM Put - OTM Call)', Value: `${iv.ivSkew}%` }
  ];
  const wsIv = XLSX.utils.json_to_sheet(ivRows);
  XLSX.utils.book_append_sheet(wb, wsIv, 'IV Analysis');

  // 8. Greeks Table Sheet
  const greeksRows = metrics.greeksTable.map(r => ({
    Strike: r.strike,
    'CE Delta': r.ce.delta,
    'CE Gamma': r.ce.gamma,
    'CE Theta': r.ce.theta,
    'CE Vega': r.ce.vega,
    'CE Rho': r.ce.rho,
    'PE Delta': r.pe.delta,
    'PE Gamma': r.pe.gamma,
    'PE Theta': r.pe.theta,
    'PE Vega': r.pe.vega,
    'PE Rho': r.pe.rho
  }));
  const wsGreeks = XLSX.utils.json_to_sheet(greeksRows);
  XLSX.utils.book_append_sheet(wb, wsGreeks, 'Option Greeks');

  // 9. Expected Move Sheet
  const em = metrics.expectedMove;
  const emRows = [
    { Metric: 'Expected Move (Points)', Value: em.expectedMovePoints },
    { Metric: 'Expected Move (%)', Value: `${em.expectedMovePercentage}%` },
    { Metric: 'Upper Target Boundary', Value: em.upperBound },
    { Metric: 'Lower Target Boundary', Value: em.lowerBound }
  ];
  const wsEm = XLSX.utils.json_to_sheet(emRows);
  XLSX.utils.book_append_sheet(wb, wsEm, 'Expected Move');

  // 10. Futures Analysis Sheet
  const fut = metrics.futuresAnalysis;
  const futRows = [
    { Metric: 'Open', Value: fut.open },
    { Metric: 'High', Value: fut.high },
    { Metric: 'Low', Value: fut.low },
    { Metric: 'LTP', Value: fut.ltp },
    { Metric: 'Volume', Value: fut.volume },
    { Metric: 'Open Interest', Value: fut.openInterest },
    { Metric: 'Premium', Value: fut.premium },
    { Metric: 'Discount', Value: fut.discount },
    { Metric: 'Basis %', Value: `${fut.basisPct}%` },
    { Metric: 'Status', Value: fut.status }
  ];
  const wsFut = XLSX.utils.json_to_sheet(futRows);
  XLSX.utils.book_append_sheet(wb, wsFut, 'Futures Analysis');

  // 11. Historical Volatility Sheet
  const hv = metrics.historicalVolatility;
  const hvRows = hv.candles.map(c => ({
    Date: c.date,
    Open: c.open,
    High: c.high,
    Low: c.low,
    Close: c.close,
    Volume: c.volume,
    'Daily Log Return': c.logReturn
  }));
  const wsHv = XLSX.utils.json_to_sheet([
    { Date: 'ANNUALIZED HV', Open: `${hv.annualizedHv}%`, High: `Daily StdDev: ${hv.dailyStdDev}`, Low: `Lookback: ${hv.lookbackDays} days`, Close: `Source: ${hv.source}` },
    {},
    ...hvRows
  ]);
  XLSX.utils.book_append_sheet(wb, wsHv, 'Historical Volatility');

  // 12. HV vs IV Comparison Sheet
  const hvi = metrics.hvVsIv;
  const hviRows = [
    { Metric: 'Historical Volatility (HV)', Value: `${hvi.hv}%` },
    { Metric: 'Current ATM IV', Value: `${hvi.atmIv}%` },
    { Metric: 'Difference (HV - IV)', Value: `${hvi.difference}%` },
    { Metric: 'HV / IV Ratio', Value: hvi.ratio },
    { Metric: 'Regime Interpretation', Value: hvi.interpretation }
  ];
  const wsHvi = XLSX.utils.json_to_sheet(hviRows);
  XLSX.utils.book_append_sheet(wb, wsHvi, 'HV vs IV');

  // 13. Complete Option Chain Sheet
  const chainRows = metrics.completeChain.map(r => ({
    'CE Delta': r.ceDelta,
    'CE Gamma': r.ceGamma,
    'CE Theta': r.ceTheta,
    'CE Vega': r.ceVega,
    'CE LTP': r.ceLtp,
    'CE OI': r.ceOi,
    'CE Change OI': r.ceChgOi,
    'CE Volume': r.ceVolume,
    'CE IV': r.ceIv,
    Strike: r.strike,
    'PE IV': r.peIv,
    'PE Volume': r.peVolume,
    'PE Change OI': r.peChgOi,
    'PE OI': r.peOi,
    'PE LTP': r.peLtp,
    'PE Delta': r.peDelta,
    'PE Gamma': r.peGamma,
    'PE Theta': r.peTheta,
    'PE Vega': r.peVega,
    'ATM Tag': r.isAtm ? 'ATM' : ''
  }));
  const wsChain = XLSX.utils.json_to_sheet(chainRows);
  XLSX.utils.book_append_sheet(wb, wsChain, 'Option Chain');

  // Trigger file download
  XLSX.writeFile(wb, 'analysis.xlsx');
};

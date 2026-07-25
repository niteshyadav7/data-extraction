import type { DashboardMetrics } from '../types';
import { calculateLtpTargetMatrix } from './ltpCalculator';

/**
 * Escapes CSV cell value for proper CSV formatting
 */
const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts array of objects or rows into a CSV string block
 */
const rowsToCsvBlock = (headers: string[], rows: any[][]): string => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map(r => r.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\n');
};

export const exportAnalysisToCsv = (metrics: DashboardMetrics) => {
  const sections: string[] = [];

  // Title Header
  sections.push(`"NIFTY OPTIONS ANALYSIS DASHBOARD - FULL DERIVATIVE REPORT"`);
  sections.push(`"Timestamp",${escapeCsvCell(metrics.marketSummary.timestamp)}`);
  sections.push(`"Risk-Free Rate",${escapeCsvCell(`${metrics.riskFreeRate}%`)}`);
  sections.push('');

  // 1. Market Summary
  const ms = metrics.marketSummary;
  sections.push(`"=== 1. MARKET SUMMARY ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value'],
    [
      ['Underlying', ms.underlying],
      ['Spot Price', ms.spotPrice],
      ['Futures Price', ms.futuresPrice],
      ['Futures Premium / Discount', `${ms.futuresPremiumDiscount} (${ms.premiumDiscountType})`],
      ['Current Expiry', ms.currentExpiry],
      ['Days To Expiry', ms.daysToExpiry],
      ['Current Date', ms.currentDate],
      ['Current Time', ms.currentTime],
      ['Engine Timestamp', ms.timestamp]
    ]
  ));
  sections.push('');

  // 2. Option Chain Summary
  const cs = metrics.chainSummary;
  sections.push(`"=== 2. OPTION CHAIN SUMMARY ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value', 'Details'],
    [
      ['Total Call OI', cs.totalCallOi, 'Contracts'],
      ['Total Put OI', cs.totalPutOi, 'Contracts'],
      ['Total Call Volume', cs.totalCallVolume, 'Contracts'],
      ['Total Put Volume', cs.totalPutVolume, 'Contracts'],
      ['Highest CE OI Strike', cs.highestCeOiStrike, `${cs.highestCeOiValue} OI`],
      ['Highest PE OI Strike', cs.highestPeOiStrike, `${cs.highestPeOiValue} OI`],
      ['Highest CE Volume Strike', cs.highestCeVolStrike, `${cs.highestCeVolValue} Vol`],
      ['Highest PE Volume Strike', cs.highestPeVolStrike, `${cs.highestPeVolValue} Vol`],
      ['Highest CE IV', `${cs.highestCeIvValue}%`, `Strike ${cs.highestCeIvStrike}`],
      ['Highest PE IV', `${cs.highestPeIvValue}%`, `Strike ${cs.highestPeIvStrike}`],
      ['Lowest CE IV', `${cs.lowestCeIvValue}%`, `Strike ${cs.lowestCeIvStrike}`],
      ['Lowest PE IV', `${cs.lowestPeIvValue}%`, `Strike ${cs.lowestPeIvStrike}`],
      ['ATM Strike', cs.atmStrike, 'Closest to Spot']
    ]
  ));
  sections.push('');

  // 3. PCR & Institutional Pressure Analysis
  const pcr = metrics.pcrAnalysis;
  sections.push(`"=== 3. PCR & INSTITUTIONAL PRESSURE ANALYSIS ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value', 'Interpretation'],
    [
      ['Overall PCR', pcr.overallPcr, pcr.interpretation],
      ['Institutional Buying Pressure Ratio', `${pcr.buyingPressureRatio || 1.0}x`, pcr.buyingPressureInterpretation || 'Balanced Buyer/Seller Pressure']
    ]
  ));
  sections.push(rowsToCsvBlock(
    ['Strike', 'CE OI', 'PE OI', 'PCR (PE OI / CE OI)'],
    pcr.strikeWisePcr.map(r => [r.strike, r.ceOi, r.peOi, r.pcr])
  ));
  sections.push('');

  // 4. Max Pain Analysis
  const mp = metrics.maxPain;
  sections.push(`"=== 4. MAX PAIN ANALYSIS ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value'],
    [
      ['Max Pain Strike', mp.maxPainStrike],
      ['Distance From Spot', mp.distanceFromSpot],
      ['Distance Percentage', `${mp.distancePercentage}%`]
    ]
  ));
  sections.push('');

  // 5. Support & Resistance & 4-Level Reversal Zones
  const sr = metrics.supportResistance;
  const topSupport1 = sr.top5Support[0]?.strike || 0;
  const topSupport2 = sr.top5Support[1]?.strike || 0;
  const topResist1 = sr.top5Resistance[0]?.strike || 0;
  const topResist2 = sr.top5Resistance[1]?.strike || 0;
  const atmRow = metrics.completeChain.find(r => r.strike === cs.atmStrike);
  const atmCeLtp = atmRow?.ceLtp || 250;
  const atmPeLtp = atmRow?.peLtp || 250;

  const eos1 = topSupport1 > 0 ? Math.round(topSupport1 - atmPeLtp) : 0;
  const eos2 = topSupport2 > 0 ? Math.round(topSupport2 - atmPeLtp) : 0;
  const eor1 = topResist1 > 0 ? Math.round(topResist1 + atmCeLtp) : 0;
  const eor2 = topResist2 > 0 ? Math.round(topResist2 + atmCeLtp) : 0;

  sections.push(`"=== 5. SUPPORT & RESISTANCE & REVERSAL LEVELS ==="`);
  sections.push(rowsToCsvBlock(
    ['Reversal Level', 'Calculated Price (₹)', 'Formula Details'],
    [
      ['EOS1 (Primary Support Reversal)', eos1, `Strike ${topSupport1} - ATM PE LTP (₹${atmPeLtp.toFixed(1)})`],
      ['EOS2 (Secondary Support Reversal)', eos2, `Strike ${topSupport2} - ATM PE LTP (₹${atmPeLtp.toFixed(1)})`],
      ['EOR1 (Primary Resistance Reversal)', eor1, `Strike ${topResist1} + ATM CE LTP (₹${atmCeLtp.toFixed(1)})`],
      ['EOR2 (Secondary Resistance Reversal)', eor2, `Strike ${topResist2} + ATM CE LTP (₹${atmCeLtp.toFixed(1)})`]
    ]
  ));
  sections.push(`"TOP 5 SUPPORT LEVELS (PE OI)"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'PE OI', 'PE Change OI'],
    sr.top5Support.map((r, i) => [`#${i + 1}`, r.strike, r.oi, r.chgOi])
  ));
  sections.push(`"TOP 5 RESISTANCE LEVELS (CE OI)"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'CE OI', 'CE Change OI'],
    sr.top5Resistance.map((r, i) => [`#${i + 1}`, r.strike, r.oi, r.chgOi])
  ));
  sections.push('');

  // 6. OI Analysis
  const oi = metrics.oiAnalysis;
  sections.push(`"=== 6. OPEN INTEREST (OI) ANALYSIS ==="`);
  sections.push(`"TOP 10 CALL WRITING"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'Change in OI', 'Total OI', 'LTP'],
    oi.top10CallWriting.map((r, i) => [`#${i + 1}`, r.strike, r.type, r.chgOi, r.oi, r.ltp])
  ));
  sections.push(`"TOP 10 PUT WRITING"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'Change in OI', 'Total OI', 'LTP'],
    oi.top10PutWriting.map((r, i) => [`#${i + 1}`, r.strike, r.type, r.chgOi, r.oi, r.ltp])
  ));
  sections.push(`"LONG BUILD-UP"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'Change in OI', 'Total OI', 'LTP'],
    oi.longBuildUp.map((r, i) => [`#${i + 1}`, r.strike, r.type, r.chgOi, r.oi, r.ltp])
  ));
  sections.push(`"SHORT BUILD-UP"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'Change in OI', 'Total OI', 'LTP'],
    oi.shortBuildUp.map((r, i) => [`#${i + 1}`, r.strike, r.type, r.chgOi, r.oi, r.ltp])
  ));
  sections.push('');

  // 7. Liquidity Analysis
  sections.push(`"=== 7. LIQUIDITY ANALYSIS ==="`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'Bid', 'Ask', 'Spread', 'Volume', 'OI', 'Liquidity Score (0-100)'],
    metrics.liquidityAnalysis.map((r, i) => [`#${i + 1}`, r.strike, r.type, r.bid, r.ask, r.spread, r.volume, r.oi, r.liquidityScore])
  ));
  sections.push('');

  // 8. Implied Volatility Analysis & Tail Crash Risk
  const iv = metrics.ivAnalysis;
  sections.push(`"=== 8. IMPLIED VOLATILITY (IV) & TAIL CRASH RISK ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value'],
    [
      ['ATM IV', `${iv.atmIv}%`],
      ['Average CE IV', `${iv.avgCeIv}%`],
      ['Average PE IV', `${iv.avgPeIv}%`],
      ['Highest IV Strike', `${iv.highestIvStrike} (${iv.highestIvValue}%)`],
      ['Lowest IV Strike', `${iv.lowestIvStrike} (${iv.lowestIvValue}%)`],
      ['IV Skew (OTM Put - OTM Call)', `${iv.ivSkew}%`],
      ['Tail Risk Skew (2% OTM PE - 2% OTM CE)', `${iv.tailRiskSkew || Math.round((iv.avgPeIv - iv.avgCeIv) * 100) / 100}%`],
      ['Tail Crash Risk Status', (iv.tailRiskSkew || 0) > 3.0 ? '🔴 TAIL CRASH RISK WARNING (PE IV Spiking)' : '🟢 NORMAL MARKET VOLATILITY SKEW']
    ]
  ));
  sections.push('');

  // 9. Black-Scholes Option Greeks
  sections.push(`"=== 9. OPTION GREEKS (BLACK-SCHOLES) ==="`);
  sections.push(rowsToCsvBlock(
    ['Strike', 'CE Delta', 'CE Gamma', 'CE Theta', 'CE Vega', 'CE Rho', 'PE Delta', 'PE Gamma', 'PE Theta', 'PE Vega', 'PE Rho'],
    metrics.greeksTable.map(r => [
      r.strike,
      r.ce.delta, r.ce.gamma, r.ce.theta, r.ce.vega, r.ce.rho,
      r.pe.delta, r.pe.gamma, r.pe.theta, r.pe.vega, r.pe.rho
    ])
  ));
  sections.push('');

  // 10. Expected Move
  const em = metrics.expectedMove;
  sections.push(`"=== 10. EXPECTED MOVE ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value'],
    [
      ['Expected Move Points', em.expectedMovePoints],
      ['Expected Move Percentage', `${em.expectedMovePercentage}%`],
      ['Upper Boundary', em.upperBound],
      ['Lower Boundary', em.lowerBound]
    ]
  ));
  sections.push('');

  // 11. Futures Analysis
  const fut = metrics.futuresAnalysis;
  sections.push(`"=== 11. FUTURES ANALYSIS ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value'],
    [
      ['Open', fut.open],
      ['High', fut.high],
      ['Low', fut.low],
      ['LTP', fut.ltp],
      ['Volume', fut.volume],
      ['Open Interest', fut.openInterest],
      ['Premium', fut.premium],
      ['Discount', fut.discount],
      ['Basis %', `${fut.basisPct}%`],
      ['Status', fut.status]
    ]
  ));
  sections.push('');

  // 12. Historical Volatility & HV vs IV
  const hv = metrics.historicalVolatility;
  const hvi = metrics.hvVsIv;
  sections.push(`"=== 12. HISTORICAL VOLATILITY & HV VS IV ==="`);
  sections.push(rowsToCsvBlock(
    ['Metric', 'Value'],
    [
      ['Annualized HV', `${hv.annualizedHv}%`],
      ['Daily Std Dev', hv.dailyStdDev],
      ['Lookback Days', hv.lookbackDays],
      ['Current ATM IV', `${hvi.atmIv}%`],
      ['Difference (HV - IV)', `${hvi.difference}%`],
      ['HV / IV Ratio', hvi.ratio],
      ['Volatility Regime', hvi.interpretation]
    ]
  ));
  sections.push('');

  // 13. Most Active Options
  const ma = metrics.mostActive;
  sections.push(`"=== 13. MOST ACTIVE OPTION CONTRACTS ==="`);
  sections.push(`"TOP 10 BY TRADED VOLUME"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'LTP', 'Volume', 'OI'],
    ma.top10ByVolume.map((r: any, i: number) => [`#${i + 1}`, r.strike, r.type, r.ltp, r.volume, r.oi])
  ));
  sections.push(`"TOP 10 BY OPEN INTEREST"`);
  sections.push(rowsToCsvBlock(
    ['Rank', 'Strike', 'Type', 'LTP', 'Volume', 'OI'],
    ma.top10ByOi.map((r: any, i: number) => [`#${i + 1}`, r.strike, r.type, r.ltp, r.volume, r.oi])
  ));
  sections.push('');

  // 14. Complete Option Chain Table with Quant Metrics
  sections.push(`"=== 14. COMPLETE OPTION CHAIN TABLE WITH QUANT METRICS ==="`);
  sections.push(rowsToCsvBlock(
    [
      'CE Intrinsic', 'CE Extrinsic', 'CE POP %', 'CE Touch %', 'CE Delta', 'CE Gamma', 'CE Theta', 'CE Vega', 'CE LTP', 'CE OI', 'CE Chg OI', 'CE Volume', 'CE IV',
      'Strike',
      'PE IV', 'PE Volume', 'PE Chg OI', 'PE OI', 'PE LTP', 'PE Intrinsic', 'PE Extrinsic', 'PE POP %', 'PE Touch %', 'PE Delta', 'PE Gamma', 'PE Theta', 'PE Vega', 'ATM Tag'
    ],
    metrics.completeChain.map(r => {
      const ceIntrinsic = Math.max(0, Math.round((ms.spotPrice - r.strike) * 100) / 100);
      const ceExtrinsic = Math.max(0, Math.round((r.ceLtp - ceIntrinsic) * 100) / 100);
      const cePop = Math.round(Math.abs(r.ceDelta) * 100);
      const ceTouch = Math.min(100, cePop * 2);

      const peIntrinsic = Math.max(0, Math.round((r.strike - ms.spotPrice) * 100) / 100);
      const peExtrinsic = Math.max(0, Math.round((r.peLtp - peIntrinsic) * 100) / 100);
      const pePop = Math.round(Math.abs(r.peDelta) * 100);
      const peTouch = Math.min(100, pePop * 2);

      return [
        ceIntrinsic, ceExtrinsic, `${cePop}%`, `${ceTouch}%`, r.ceDelta, r.ceGamma, r.ceTheta, r.ceVega, r.ceLtp, r.ceOi, r.ceChgOi, r.ceVolume, r.ceIv,
        r.strike,
        r.peIv, r.peVolume, r.peChgOi, r.peOi, r.peLtp, peIntrinsic, peExtrinsic, `${pePop}%`, `${peTouch}%`, r.peDelta, r.peGamma, r.peTheta, r.peVega, r.isAtm ? 'ATM' : ''
      ];
    })
  ));
  sections.push('');

  // 15. Step 18 LTP Target & Reversal Calculator Matrix
  const ltpMatrix = calculateLtpTargetMatrix(
    metrics.completeChain,
    ms.spotPrice,
    ms.spotPrice, // base target
    0, // iv shift
    0, // hours
    ms.daysToExpiry,
    metrics.riskFreeRate
  );

  sections.push(`"=== 15. STEP 18 LTP TARGET & REVERSAL CALCULATOR MATRIX ==="`);
  sections.push(rowsToCsvBlock(
    [
      'CE Current LTP', 'CE Target LTP', 'CE ₹ PnL', 'CE % PnL', 'CE Target Intrinsic', 'CE Target Extrinsic', 'CE Target POP %', 'CE Target Touch %', 'EOR Reversal Level',
      'Strike',
      'PE Current LTP', 'PE Target LTP', 'PE ₹ PnL', 'PE % PnL', 'PE Target Intrinsic', 'PE Target Extrinsic', 'PE Target POP %', 'PE Target Touch %', 'EOS Reversal Level'
    ],
    ltpMatrix.map(r => [
      r.ceCurrentLtp, r.ceTargetLtp, r.ceDiffRupees, `${r.ceDiffPct}%`, r.ceTargetIntrinsic, r.ceTargetExtrinsic, `${r.ceTargetPop}%`, `${r.ceTargetTouch}%`, r.ceReversalLevel,
      r.strike,
      r.peCurrentLtp, r.peTargetLtp, r.peDiffRupees, `${r.peDiffPct}%`, r.peTargetIntrinsic, r.peTargetExtrinsic, `${r.peTargetPop}%`, `${r.peTargetTouch}%`, r.peReversalLevel
    ])
  ));
  sections.push('');

  // 16. Data Quality Warnings Audit
  const w = metrics.warnings;
  sections.push(`"=== 16. DATA QUALITY WARNINGS AUDIT ==="`);
  sections.push(rowsToCsvBlock(
    ['Category', 'Issue Count'],
    [
      ['Missing Values', w.missingValuesCount],
      ['Duplicate Rows', w.duplicateRowsCount],
      ['Invalid IV', w.invalidIvCount],
      ['Negative OI', w.negativeOiCount],
      ['Negative Volume', w.negativeVolumeCount]
    ]
  ));

  // Trigger browser download for analysis.csv
  const csvContent = sections.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'analysis.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

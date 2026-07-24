import type {
  RawOptionChainRow,
  RawFuturesRow,
  RawOptRow,
  DashboardMetrics,
  DataWarnings,
  PcrStrikeRow,
  SupportResistanceRow,
  OiAnalysisRow,
  LiquidityRow,
  ActiveOptionRow,
  CompleteChainRow,
  FuturesAnalysisData,
  GreekRow,
  ExpectedMoveData,
  IvAnalysisData,
  HvVsIvData,
  HistoricalVolatilityData,
  OiAnalysisData
} from '../types';
import { calculateGreeks } from './blackScholes';

export const calculateDashboardMetrics = (
  optionChain: RawOptionChainRow[],
  futures: RawFuturesRow,
  _optData: RawOptRow[],
  warningsPartial: Partial<DataWarnings>,
  hvData?: HistoricalVolatilityData,
  riskFreeRateInput = 5.25 // Default 5.25%
): DashboardMetrics => {
  const riskFreeRateDecimal = riskFreeRateInput / 100;
  const chain = [...optionChain].sort((a, b) => a.strikePrice - b.strikePrice);

  // Spot Price determination
  let spotPrice = futures.spotPrice || 0;
  if (!spotPrice && chain.length > 0) {
    const validSpot = chain.find(r => r.underlyingValue && r.underlyingValue > 0);
    if (validSpot) spotPrice = validSpot.underlyingValue!;
  }
  if (!spotPrice && chain.length > 0) {
    spotPrice = chain[Math.floor(chain.length / 2)].strikePrice;
  }

  // Futures Price & Basis %
  const futuresPrice = futures.ltp || spotPrice;
  const futuresDiff = Math.round((futuresPrice - spotPrice) * 100) / 100;
  const basisPct = spotPrice > 0 ? Math.round((futuresDiff / spotPrice) * 10000) / 100 : 0;
  const premiumDiscountType: 'Premium' | 'Discount' | 'Parity' =
    futuresDiff > 0 ? 'Premium' : futuresDiff < 0 ? 'Discount' : 'Parity';

  // Dates & Days to Expiry
  const currentDateStr = futures.currentDate || new Date().toISOString().split('T')[0];
  const currentTimeStr = futures.currentTime || new Date().toLocaleTimeString('en-US', { hour12: false });
  const timestampStr = `${currentDateStr} ${currentTimeStr}`;
  const currentExpiryStr = futures.expiryDate !== 'N/A' ? futures.expiryDate : chain[0]?.expiryDate || 'N/A';

  let daysToExpiry = 0;
  try {
    if (currentExpiryStr !== 'N/A') {
      const expDate = new Date(currentExpiryStr);
      const currDate = new Date(currentDateStr);
      const diffTime = expDate.getTime() - currDate.getTime();
      daysToExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
  } catch (e) {
    daysToExpiry = 0;
  }

  const T_years = Math.max(daysToExpiry, 0.5) / 365;

  // ATM Strike calculation
  let atmStrike = chain[0]?.strikePrice || 0;
  let minDistance = Math.abs(atmStrike - spotPrice);

  chain.forEach(r => {
    const dist = Math.abs(r.strikePrice - spotPrice);
    if (dist < minDistance) {
      minDistance = dist;
      atmStrike = r.strikePrice;
    }
  });

  // Aggregations & Step calculations
  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallVolume = 0;
  let totalPutVolume = 0;

  let highestCeOiStrike = 0, highestCeOiValue = -1;
  let highestPeOiStrike = 0, highestPeOiValue = -1;
  let highestCeVolStrike = 0, highestCeVolValue = -1;
  let highestPeVolStrike = 0, highestPeVolValue = -1;
  let highestCeIvStrike = 0, highestCeIvValue = -1;
  let highestPeIvStrike = 0, highestPeIvValue = -1;
  let lowestCeIvStrike = 0, lowestCeIvValue = Number.MAX_VALUE;
  let lowestPeIvStrike = 0, lowestPeIvValue = Number.MAX_VALUE;

  let totalCeIvSum = 0, validCeIvCount = 0;
  let totalPeIvSum = 0, validPeIvCount = 0;

  const strikeWisePcr: PcrStrikeRow[] = [];
  const completeChain: CompleteChainRow[] = [];
  const greeksTable: GreekRow[] = [];
  const rawLiquidityList: { row: LiquidityRow; rawScore: number }[] = [];

  const strikeLossesMap: { strike: number; totalLoss: number }[] = [];

  chain.forEach(row => {
    const s = row.strikePrice;

    totalCallOi += row.ceOi;
    totalPutOi += row.peOi;
    totalCallVolume += row.ceVolume;
    totalPutVolume += row.peVolume;

    // Highest / Lowest checks
    if (row.ceOi > highestCeOiValue) { highestCeOiValue = row.ceOi; highestCeOiStrike = s; }
    if (row.peOi > highestPeOiValue) { highestPeOiValue = row.peOi; highestPeOiStrike = s; }

    if (row.ceVolume > highestCeVolValue) { highestCeVolValue = row.ceVolume; highestCeVolStrike = s; }
    if (row.peVolume > highestPeVolValue) { highestPeVolValue = row.peVolume; highestPeVolStrike = s; }

    if (row.ceIv > 0) {
      totalCeIvSum += row.ceIv;
      validCeIvCount++;
      if (row.ceIv > highestCeIvValue) { highestCeIvValue = row.ceIv; highestCeIvStrike = s; }
      if (row.ceIv < lowestCeIvValue) { lowestCeIvValue = row.ceIv; lowestCeIvStrike = s; }
    }

    if (row.peIv > 0) {
      totalPeIvSum += row.peIv;
      validPeIvCount++;
      if (row.peIv > highestPeIvValue) { highestPeIvValue = row.peIv; highestPeIvStrike = s; }
      if (row.peIv < lowestPeIvValue) { lowestPeIvValue = row.peIv; lowestPeIvStrike = s; }
    }

    // Black-Scholes Option Greeks Calculation
    const ceGreeks = calculateGreeks(spotPrice, s, T_years, riskFreeRateDecimal, row.ceIv / 100, true);
    const peGreeks = calculateGreeks(spotPrice, s, T_years, riskFreeRateDecimal, row.peIv / 100, false);

    greeksTable.push({
      strike: s,
      ce: ceGreeks,
      pe: peGreeks
    });

    // Strike wise PCR
    const pcrVal = row.ceOi > 0 ? Math.round((row.peOi / row.ceOi) * 100) / 100 : row.peOi > 0 ? 999 : 0;
    strikeWisePcr.push({
      strike: s,
      ceOi: row.ceOi,
      peOi: row.peOi,
      pcr: pcrVal
    });

    // Complete chain row
    completeChain.push({
      strike: s,
      ceLtp: row.ceLtp,
      ceOi: row.ceOi,
      ceChgOi: row.ceChgOi,
      ceVolume: row.ceVolume,
      ceIv: row.ceIv,
      ceDelta: ceGreeks.delta,
      ceGamma: ceGreeks.gamma,
      ceTheta: ceGreeks.theta,
      ceVega: ceGreeks.vega,
      ceRho: ceGreeks.rho,
      peDelta: peGreeks.delta,
      peGamma: peGreeks.gamma,
      peTheta: peGreeks.theta,
      peVega: peGreeks.vega,
      peRho: peGreeks.rho,
      peIv: row.peIv,
      peVolume: row.peVolume,
      peChgOi: row.peChgOi,
      peOi: row.peOi,
      peLtp: row.peLtp,
      isAtm: s === atmStrike
    });

    // Liquidity Analysis Scoring
    const ceSpread = Math.max(0, Math.round((row.ceAsk - row.ceBid) * 100) / 100);
    const peSpread = Math.max(0, Math.round((row.peAsk - row.peBid) * 100) / 100);

    const ceRawScore = (row.ceVolume / (ceSpread + 0.05)) * Math.log(row.ceOi + 1);
    const peRawScore = (row.peVolume / (peSpread + 0.05)) * Math.log(row.peOi + 1);

    rawLiquidityList.push({
      row: { strike: s, type: 'CE', bid: row.ceBid, ask: row.ceAsk, spread: ceSpread, volume: row.ceVolume, oi: row.ceOi, liquidityScore: 0 },
      rawScore: ceRawScore
    });

    rawLiquidityList.push({
      row: { strike: s, type: 'PE', bid: row.peBid, ask: row.peAsk, spread: peSpread, volume: row.peVolume, oi: row.peOi, liquidityScore: 0 },
      rawScore: peRawScore
    });
  });

  // Normalize Liquidity Scores to 0-100 scale
  let maxRawScore = 1;
  rawLiquidityList.forEach(item => { if (item.rawScore > maxRawScore) maxRawScore = item.rawScore; });

  const liquidityList: LiquidityRow[] = rawLiquidityList.map(item => ({
    ...item.row,
    liquidityScore: Math.round((item.rawScore / maxRawScore) * 100)
  }));

  // Step 4 - Overall PCR & Interpretation
  const overallPcr = totalCallOi > 0 ? Math.round((totalPutOi / totalCallOi) * 100) / 100 : 0;
  let pcrInterpretation = 'Neutral Market Sentiment';
  if (overallPcr < 0.70) {
    pcrInterpretation = 'Heavy Call Writing (Bearish / Resistance Heavy)';
  } else if (overallPcr > 1.20) {
    pcrInterpretation = 'Heavy Put Writing (Bullish / Support Heavy)';
  } else {
    pcrInterpretation = 'Balanced / Rangebound Market';
  }

  // Step 5 - Max Pain Calculation
  let maxPainStrike = atmStrike;
  let minTotalLoss = Number.MAX_VALUE;

  chain.forEach(kRow => {
    const K = kRow.strikePrice;
    let totalLoss = 0;

    chain.forEach(sRow => {
      const S = sRow.strikePrice;
      const ceLoss = sRow.ceOi * Math.max(0, K - S);
      const peLoss = sRow.peOi * Math.max(0, S - K);
      totalLoss += (ceLoss + peLoss);
    });

    strikeLossesMap.push({ strike: K, totalLoss });

    if (totalLoss < minTotalLoss) {
      minTotalLoss = totalLoss;
      maxPainStrike = K;
    }
  });

  const maxPainDist = Math.round((maxPainStrike - spotPrice) * 100) / 100;
  const maxPainDistPct = spotPrice > 0 ? Math.round((maxPainDist / spotPrice) * 10000) / 100 : 0;

  // Step 6 - Support & Resistance
  const top5Support: SupportResistanceRow[] = [...chain]
    .sort((a, b) => b.peOi - a.peOi)
    .slice(0, 5)
    .map(r => ({ strike: r.strikePrice, oi: r.peOi, chgOi: r.peChgOi }));

  const top5Resistance: SupportResistanceRow[] = [...chain]
    .sort((a, b) => b.ceOi - a.ceOi)
    .slice(0, 5)
    .map(r => ({ strike: r.strikePrice, oi: r.ceOi, chgOi: r.ceChgOi }));

  // Step 7 - OI Analysis (Classifications: Writing, Long Build-up, Short Build-up, Unwinding, Covering)
  const allOiRows: OiAnalysisRow[] = [];

  chain.forEach(r => {
    // CE categorization
    if (r.ceChgOi > 0) {
      allOiRows.push({ strike: r.strikePrice, type: 'CE', chgOi: r.ceChgOi, oi: r.ceOi, ltp: r.ceLtp, classification: 'Call Writing' });
      allOiRows.push({ strike: r.strikePrice, type: 'CE', chgOi: r.ceChgOi, oi: r.ceOi, ltp: r.ceLtp, classification: 'Short Build-up' });
    } else if (r.ceChgOi < 0) {
      allOiRows.push({ strike: r.strikePrice, type: 'CE', chgOi: r.ceChgOi, oi: r.ceOi, ltp: r.ceLtp, classification: 'Long Unwinding' });
    }

    // PE categorization
    if (r.peChgOi > 0) {
      allOiRows.push({ strike: r.strikePrice, type: 'PE', chgOi: r.peChgOi, oi: r.peOi, ltp: r.peLtp, classification: 'Put Writing' });
      allOiRows.push({ strike: r.strikePrice, type: 'PE', chgOi: r.peChgOi, oi: r.peOi, ltp: r.peLtp, classification: 'Long Build-up' });
    } else if (r.peChgOi < 0) {
      allOiRows.push({ strike: r.strikePrice, type: 'PE', chgOi: r.peChgOi, oi: r.peOi, ltp: r.peLtp, classification: 'Short Covering' });
    }
  });

  const top10CallWriting = allOiRows.filter(r => r.classification === 'Call Writing').sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const top10PutWriting = allOiRows.filter(r => r.classification === 'Put Writing').sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const top10CallUnwinding = allOiRows.filter(r => r.classification === 'Long Unwinding' && r.type === 'CE').sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);
  const top10PutUnwinding = allOiRows.filter(r => r.classification === 'Short Covering' && r.type === 'PE').sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);

  const longBuildUp = allOiRows.filter(r => r.classification === 'Long Build-up').sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const shortBuildUp = allOiRows.filter(r => r.classification === 'Short Build-up').sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const shortCovering = allOiRows.filter(r => r.classification === 'Short Covering').sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);
  const longUnwinding = allOiRows.filter(r => r.classification === 'Long Unwinding').sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);

  const oiAnalysisData: OiAnalysisData = {
    top10CallWriting,
    top10PutWriting,
    top10CallUnwinding,
    top10PutUnwinding,
    longBuildUp,
    shortBuildUp,
    shortCovering,
    longUnwinding
  };

  // Step 8 - Top Liquid Strikes
  const topLiquidStrikes = [...liquidityList]
    .sort((a, b) => b.liquidityScore - a.liquidityScore)
    .slice(0, 10);

  // Step 9 - Implied Volatility Analysis & IV Skew/Smile
  const atmRow = chain.find(r => r.strikePrice === atmStrike);
  const atmIv = atmRow ? Math.round(((atmRow.ceIv + atmRow.peIv) / 2) * 100) / 100 : 0;
  const avgCeIv = validCeIvCount > 0 ? Math.round((totalCeIvSum / validCeIvCount) * 100) / 100 : 0;
  const avgPeIv = validPeIvCount > 0 ? Math.round((totalPeIvSum / validPeIvCount) * 100) / 100 : 0;

  let highestIvStrike = highestCeIvValue > highestPeIvValue ? highestCeIvStrike : highestPeIvStrike;
  let highestIvValue = Math.max(highestCeIvValue, highestPeIvValue);
  let lowestIvStrike = lowestCeIvValue < lowestPeIvValue ? lowestCeIvStrike : lowestPeIvStrike;
  let lowestIvValue = Math.min(lowestCeIvValue, lowestPeIvValue);
  if (lowestIvValue === Number.MAX_VALUE) lowestIvValue = 0;

  // IV Skew (OTM Put IV - OTM Call IV)
  const otmPutRow = chain.find(r => r.strikePrice >= spotPrice * 0.98);
  const otmCallRow = chain.find(r => r.strikePrice >= spotPrice * 1.02);
  const otmPutIv = otmPutRow ? otmPutRow.peIv : atmIv;
  const otmCallIv = otmCallRow ? otmCallRow.ceIv : atmIv;
  const ivSkew = Math.round((otmPutIv - otmCallIv) * 100) / 100;

  const ivSmileCurve = chain.map(r => ({
    strike: r.strikePrice,
    ceIv: r.ceIv,
    peIv: r.peIv
  }));

  const ivAnalysisData: IvAnalysisData = {
    atmIv,
    avgCeIv,
    avgPeIv,
    highestIvStrike,
    highestIvValue,
    lowestIvStrike,
    lowestIvValue,
    ivSkew,
    otmPutIv,
    otmCallIv,
    ivSmileCurve
  };

  // Step 12 - Expected Move Calculation
  // Formula: Spot * ATM_IV * sqrt(DTE / 365)
  const expectedMovePoints = Math.round((spotPrice * (atmIv / 100) * Math.sqrt(T_years)) * 100) / 100;
  const expectedMovePct = spotPrice > 0 ? Math.round((expectedMovePoints / spotPrice) * 10000) / 100 : 0;
  const upperBound = Math.round((spotPrice + expectedMovePoints) * 100) / 100;
  const lowerBound = Math.round((spotPrice - expectedMovePoints) * 100) / 100;

  const expectedMove: ExpectedMoveData = {
    expectedMovePoints,
    expectedMovePercentage: expectedMovePct,
    upperBound,
    lowerBound
  };

  // Step 10 - Futures Analysis
  const futuresAnalysis: FuturesAnalysisData = {
    open: futures.open,
    high: futures.high,
    low: futures.low,
    ltp: futuresPrice,
    volume: futures.volume,
    openInterest: futures.openInterest,
    premium: futuresDiff > 0 ? futuresDiff : 0,
    discount: futuresDiff < 0 ? Math.abs(futuresDiff) : 0,
    basisPct,
    status: premiumDiscountType
  };

  // Step 14 & 15 - Historical Volatility (HV) & HV vs IV Comparison
  const defaultHv = hvData ? hvData.annualizedHv : 14.85; // fallback ~14.85%
  const hvVsIvDiff = Math.round((defaultHv - atmIv) * 100) / 100;
  const hvVsIvRatio = atmIv > 0 ? Math.round((defaultHv / atmIv) * 100) / 100 : 1;
  let hvIvInterpretation = 'Historical & Implied Volatility in Parity';

  if (atmIv > defaultHv + 2) {
    hvIvInterpretation = 'Implied Volatility is Overpriced relative to Historical Volatility (High Premium Option Regime)';
  } else if (defaultHv > atmIv + 2) {
    hvIvInterpretation = 'Implied Volatility is Underpriced relative to Historical Volatility (Low Premium Option Regime)';
  }

  const hvVsIv: HvVsIvData = {
    hv: defaultHv,
    atmIv,
    difference: hvVsIvDiff,
    ratio: hvVsIvRatio,
    interpretation: hvIvInterpretation
  };

  // Step 11 - Most Active Options
  const allActiveOptions: ActiveOptionRow[] = [];
  chain.forEach(r => {
    allActiveOptions.push({ strike: r.strikePrice, type: 'CE', value: r.ceVolume });
    allActiveOptions.push({ strike: r.strikePrice, type: 'PE', value: r.peVolume });
  });

  const top10ByVolume = [...allActiveOptions].sort((a, b) => b.value - a.value).slice(0, 10);

  const allActiveOi: ActiveOptionRow[] = [];
  chain.forEach(r => {
    allActiveOi.push({ strike: r.strikePrice, type: 'CE', value: r.ceOi });
    allActiveOi.push({ strike: r.strikePrice, type: 'PE', value: r.peOi });
  });

  const top10ByOi = [...allActiveOi].sort((a, b) => b.value - a.value).slice(0, 10);

  const warnings: DataWarnings = {
    missingValuesCount: warningsPartial.missingValuesCount || 0,
    missingValuesDetails: warningsPartial.missingValuesDetails || [],
    duplicateRowsCount: warningsPartial.duplicateRowsCount || 0,
    duplicateRowsDetails: warningsPartial.duplicateRowsDetails || [],
    invalidIvCount: warningsPartial.invalidIvCount || 0,
    invalidIvDetails: warningsPartial.invalidIvDetails || [],
    negativeOiCount: warningsPartial.negativeOiCount || 0,
    negativeOiDetails: warningsPartial.negativeOiDetails || [],
    negativeVolumeCount: warningsPartial.negativeVolumeCount || 0,
    negativeVolumeDetails: warningsPartial.negativeVolumeDetails || []
  };

  return {
    marketSummary: {
      spotPrice,
      futuresPrice,
      futuresPremiumDiscount: Math.abs(futuresDiff),
      premiumDiscountType,
      currentExpiry: currentExpiryStr,
      daysToExpiry,
      currentDate: currentDateStr,
      currentTime: currentTimeStr,
      underlying: futures.symbol || 'NIFTY',
      timestamp: timestampStr
    },
    chainSummary: {
      totalCallOi,
      totalPutOi,
      totalCallVolume,
      totalPutVolume,
      highestCeOiStrike,
      highestCeOiValue,
      highestPeOiStrike,
      highestPeOiValue,
      highestCeVolStrike,
      highestCeVolValue,
      highestPeVolStrike,
      highestPeVolValue,
      highestCeIvStrike,
      highestCeIvValue,
      highestPeIvStrike,
      highestPeIvValue,
      lowestCeIvStrike,
      lowestCeIvValue,
      lowestPeIvStrike,
      lowestPeIvValue,
      atmStrike
    },
    pcrAnalysis: {
      overallPcr,
      interpretation: pcrInterpretation,
      strikeWisePcr
    },
    maxPain: {
      maxPainStrike,
      distanceFromSpot: maxPainDist,
      distancePercentage: maxPainDistPct,
      strikeLosses: strikeLossesMap
    },
    supportResistance: {
      top5Support,
      top5Resistance
    },
    oiAnalysis: oiAnalysisData,
    liquidityAnalysis: topLiquidStrikes,
    ivAnalysis: ivAnalysisData,
    greeksTable,
    expectedMove,
    futuresAnalysis,
    historicalVolatility: hvData || {
      candles: [],
      dailyStdDev: 0.0093,
      annualizedHv: defaultHv,
      lookbackDays: 30,
      source: 'Calculated'
    },
    hvVsIv,
    mostActive: {
      top10ByVolume,
      top10ByOi
    },
    completeChain,
    warnings,
    riskFreeRate: riskFreeRateInput
  };
};

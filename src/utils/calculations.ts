import type {
  RawOptionChainRow,
  RawFuturesRow,
  RawOptRow,
  DashboardMetrics,
  DataWarnings,
  MarketSummaryData,
  OptionChainSummaryData,
  PcrAnalysisData,
  MaxPainData,
  SupportResistanceData,
  OiAnalysisData,
  OiBuildUpRow,
  LiquidityRow,
  IvAnalysisData,
  GreekRow,
  ExpectedMoveData,
  FuturesAnalysisData,
  HistoricalVolatilityData,
  HvVsIvData,
  MostActiveData,
  CompleteChainRow
} from '../types';
import { calculateBlackScholesGreeks } from './blackScholes';

export const checkIsNseMarketOpen = (now: Date = new Date()): { isOpen: boolean; label: string } => {
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5; // Monday = 1, Friday = 5

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketStart = 9 * 60 + 15; // 09:15 AM
  const marketEnd = 15 * 60 + 30;   // 03:30 PM

  const isOpen = isWeekday && timeInMinutes >= marketStart && timeInMinutes <= marketEnd;

  return {
    isOpen,
    label: isOpen ? 'LIVE SESSION' : 'LAST SESSION CLOSE'
  };
};

export const calculateDashboardMetrics = (
  optionChainData: RawOptionChainRow[],
  futuresData: RawFuturesRow,
  _optData: RawOptRow[],
  warningsPartial: Partial<DataWarnings> = {},
  hvData?: HistoricalVolatilityData,
  riskFreeRatePercent: number = 5.25
): DashboardMetrics => {
  const r = riskFreeRatePercent / 100;

  // 1. Market Summary calculation
  const spotPrice = futuresData.spotPrice || (optionChainData.length > 0 ? optionChainData[0].underlyingValue : 0);
  const futuresPrice = futuresData.ltp || spotPrice;
  const futuresPremiumDiscount = Math.round((futuresPrice - spotPrice) * 100) / 100;
  const premiumDiscountType: 'Premium' | 'Discount' = futuresPremiumDiscount >= 0 ? 'Premium' : 'Discount';

  const currentExpiry = futuresData.expiryDate || (optionChainData.length > 0 ? optionChainData[0].expiryDate : '28-Jul-2026');

  let daysToExpiry = 4;
  if (currentExpiry) {
    const parsedExp = Date.parse(currentExpiry);
    if (!isNaN(parsedExp)) {
      const diffMs = parsedExp - Date.now();
      daysToExpiry = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  const marketStatus = checkIsNseMarketOpen();
  const exchangeTimestamp = futuresData.timestamp || (futuresData.currentDate
    ? `${futuresData.currentDate} ${futuresData.currentTime || '15:30:00'} IST`
    : `${new Date().toLocaleDateString()} 15:30:00 IST`);

  const marketSummary: MarketSummaryData = {
    underlying: futuresData.symbol || 'NIFTY',
    spotPrice,
    futuresPrice,
    futuresPremiumDiscount,
    premiumDiscountType,
    currentExpiry,
    daysToExpiry,
    currentDate: futuresData.currentDate || new Date().toISOString().split('T')[0],
    currentTime: futuresData.currentTime || new Date().toLocaleTimeString(),
    timestamp: exchangeTimestamp,
    isMarketOpen: marketStatus.isOpen,
    marketStatusLabel: marketStatus.label
  };

  const sortedChain = [...optionChainData].sort((a, b) => a.strikePrice - b.strikePrice);
  const strikes = sortedChain.map(rRow => rRow.strikePrice);

  const atmStrike = strikes.length > 0
    ? strikes.reduce((prev, curr) => Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev)
    : 0;

  // 2. Option Chain Summary & PCR
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
  let lowestCeIvStrike = 0, lowestCeIvValue = 999999;
  let lowestPeIvStrike = 0, lowestPeIvValue = 999999;

  const strikeWisePcr: { strike: number; ceOi: number; peOi: number; pcr: number }[] = [];

  sortedChain.forEach(row => {
    totalCallOi += row.ceOi;
    totalPutOi += row.peOi;
    totalCallVolume += row.ceVolume;
    totalPutVolume += row.peVolume;

    if (row.ceOi > highestCeOiValue) { highestCeOiValue = row.ceOi; highestCeOiStrike = row.strikePrice; }
    if (row.peOi > highestPeOiValue) { highestPeOiValue = row.peOi; highestPeOiStrike = row.strikePrice; }

    if (row.ceVolume > highestCeVolValue) { highestCeVolValue = row.ceVolume; highestCeVolStrike = row.strikePrice; }
    if (row.peVolume > highestPeVolValue) { highestPeVolValue = row.peVolume; highestPeVolStrike = row.strikePrice; }

    if (row.ceIv > highestCeIvValue) { highestCeIvValue = row.ceIv; highestCeIvStrike = row.strikePrice; }
    if (row.peIv > highestPeIvValue) { highestPeIvValue = row.peIv; highestPeIvStrike = row.strikePrice; }

    if (row.ceIv > 0 && row.ceIv < lowestCeIvValue) { lowestCeIvValue = row.ceIv; lowestCeIvStrike = row.strikePrice; }
    if (row.peIv > 0 && row.peIv < lowestPeIvValue) { lowestPeIvValue = row.peIv; lowestPeIvStrike = row.strikePrice; }

    const sPcr = row.ceOi > 0 ? Math.round((row.peOi / row.ceOi) * 100) / 100 : 0;
    strikeWisePcr.push({
      strike: row.strikePrice,
      ceOi: row.ceOi,
      peOi: row.peOi,
      pcr: sPcr
    });
  });

  const overallPcr = totalCallOi > 0 ? Math.round((totalPutOi / totalCallOi) * 100) / 100 : 0;
  let pcrInterpretation = 'Neutral Market Sentiment';
  if (overallPcr > 1.3) pcrInterpretation = 'Strong Bullish Sentiment (Heavy Put Writing)';
  else if (overallPcr > 1.0) pcrInterpretation = 'Mild Bullish Sentiment';
  else if (overallPcr < 0.7) pcrInterpretation = 'Strong Bearish Sentiment (Heavy Call Writing)';
  else if (overallPcr < 1.0) pcrInterpretation = 'Mild Bearish Sentiment';

  // Net Institutional Buying vs Selling Pressure Ratio
  const posPeChgOi = sortedChain.reduce((acc, r) => acc + (r.peChgOi > 0 ? r.peChgOi : 0), 0);
  const posCeChgOi = sortedChain.reduce((acc, r) => acc + (r.ceChgOi > 0 ? r.ceChgOi : 0), 0);

  const numPressure = totalCallVolume + posPeChgOi;
  const denPressure = totalPutVolume + posCeChgOi;
  const buyingPressureRatio = denPressure > 0 ? Math.round((numPressure / denPressure) * 100) / 100 : 1.0;

  let buyingPressureInterpretation = 'Balanced Buyer/Seller Pressure';
  if (buyingPressureRatio > 1.25) buyingPressureInterpretation = 'Strong Institutional Buying & Put Writing Pressure';
  else if (buyingPressureRatio < 0.8) buyingPressureInterpretation = 'Strong Institutional Selling & Call Writing Pressure';

  const chainSummary: OptionChainSummaryData = {
    totalCallOi,
    totalPutOi,
    totalCallVolume,
    totalPutVolume,
    highestCeOiStrike, highestCeOiValue,
    highestPeOiStrike, highestPeOiValue,
    highestCeVolStrike, highestCeVolValue,
    highestPeVolStrike, highestPeVolValue,
    highestCeIvStrike, highestCeIvValue,
    highestPeIvStrike, highestPeIvValue,
    lowestCeIvStrike, lowestCeIvValue: lowestCeIvValue === 999999 ? 0 : lowestCeIvValue,
    lowestPeIvStrike, lowestPeIvValue: lowestPeIvValue === 999999 ? 0 : lowestPeIvValue,
    atmStrike
  };

  const pcrAnalysis: PcrAnalysisData = {
    overallPcr,
    interpretation: pcrInterpretation,
    buyingPressureRatio,
    buyingPressureInterpretation,
    strikeWisePcr
  };

  // 3. Max Pain Calculation
  let minLoss = Number.MAX_VALUE;
  let maxPainStrike = atmStrike;
  const strikeWiseLosses: { strike: number; ceLoss: number; peLoss: number; totalLoss: number }[] = [];

  strikes.forEach(testStrike => {
    let ceLoss = 0;
    let peLoss = 0;
    sortedChain.forEach(row => {
      if (testStrike > row.strikePrice) {
        ceLoss += (testStrike - row.strikePrice) * row.ceOi;
      }
      if (testStrike < row.strikePrice) {
        peLoss += (row.strikePrice - testStrike) * row.peOi;
      }
    });
    const totalLoss = ceLoss + peLoss;
    strikeWiseLosses.push({ strike: testStrike, ceLoss, peLoss, totalLoss });

    if (totalLoss < minLoss) {
      minLoss = totalLoss;
      maxPainStrike = testStrike;
    }
  });

  const distPoints = Math.round((maxPainStrike - spotPrice) * 100) / 100;
  const distPct = spotPrice > 0 ? Math.round(((maxPainStrike - spotPrice) / spotPrice) * 10000) / 100 : 0;

  const maxPain: MaxPainData = {
    maxPainStrike,
    distanceFromSpot: distPoints,
    distancePercentage: distPct,
    strikeWiseLosses
  };

  // 4. Support & Resistance
  const top5Support = [...sortedChain]
    .sort((a, b) => b.peOi - a.peOi)
    .slice(0, 5)
    .map(rRow => ({ strike: rRow.strikePrice, oi: rRow.peOi, chgOi: rRow.peChgOi }));

  const top5Resistance = [...sortedChain]
    .sort((a, b) => b.ceOi - a.ceOi)
    .slice(0, 5)
    .map(rRow => ({ strike: rRow.strikePrice, oi: rRow.ceOi, chgOi: rRow.ceChgOi }));

  const supportResistance: SupportResistanceData = { top5Support, top5Resistance };

  // 5. OI Analysis Build-ups
  const ceRows = sortedChain.map(rRow => ({ strike: rRow.strikePrice, type: 'CE' as const, chgOi: rRow.ceChgOi, oi: rRow.ceOi, ltp: rRow.ceLtp }));
  const peRows = sortedChain.map(rRow => ({ strike: rRow.strikePrice, type: 'PE' as const, chgOi: rRow.peChgOi, oi: rRow.peOi, ltp: rRow.peLtp }));

  const top10CallWriting = [...ceRows].sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const top10PutWriting = [...peRows].sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const top10CallUnwinding = [...ceRows].sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);
  const top10PutUnwinding = [...peRows].sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);

  const allOptionRows: OiBuildUpRow[] = [...ceRows, ...peRows];

  const longBuildUp = allOptionRows.filter(rRow => rRow.chgOi > 0 && rRow.ltp > 0).sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const shortBuildUp = allOptionRows.filter(rRow => rRow.chgOi > 0 && rRow.ltp < 0).sort((a, b) => b.chgOi - a.chgOi).slice(0, 10);
  const longUnwinding = allOptionRows.filter(rRow => rRow.chgOi < 0 && rRow.ltp < 0).sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);
  const shortCovering = allOptionRows.filter(rRow => rRow.chgOi < 0 && rRow.ltp > 0).sort((a, b) => a.chgOi - b.chgOi).slice(0, 10);

  const oiAnalysis: OiAnalysisData = {
    top10CallWriting, top10PutWriting,
    top10CallUnwinding, top10PutUnwinding,
    longBuildUp, shortBuildUp, longUnwinding, shortCovering
  };

  // 6. Liquidity Scores
  const liquidityAnalysis: LiquidityRow[] = [];
  sortedChain.forEach(rRow => {
    const ceSpread = Math.max(0, Math.round((rRow.ceAsk - rRow.ceBid) * 100) / 100);
    const ceScore = Math.min(100, Math.max(0, Math.round((rRow.ceVolume / (rRow.ceVolume + 1000) * 60) + ((1 / (ceSpread + 1)) * 40))));
    liquidityAnalysis.push({
      strike: rRow.strikePrice,
      type: 'CE',
      bid: rRow.ceBid,
      ask: rRow.ceAsk,
      spread: ceSpread,
      volume: rRow.ceVolume,
      oi: rRow.ceOi,
      liquidityScore: ceScore
    });

    const peSpread = Math.max(0, Math.round((rRow.peAsk - rRow.peBid) * 100) / 100);
    const peScore = Math.min(100, Math.max(0, Math.round((rRow.peVolume / (rRow.peVolume + 1000) * 60) + ((1 / (peSpread + 1)) * 40))));
    liquidityAnalysis.push({
      strike: rRow.strikePrice,
      type: 'PE',
      bid: rRow.peBid,
      ask: rRow.peAsk,
      spread: peSpread,
      volume: rRow.peVolume,
      oi: rRow.peOi,
      liquidityScore: peScore
    });
  });

  liquidityAnalysis.sort((a, b) => b.liquidityScore - a.liquidityScore);

  // 7. IV Analysis & Direct Implied VIX Calculation
  const atmRow = sortedChain.find(rRow => rRow.strikePrice === atmStrike) || sortedChain[0];
  const atmCeIv = atmRow ? atmRow.ceIv : 0;
  const atmPeIv = atmRow ? atmRow.peIv : 0;
  const atmIv = Math.round(((atmCeIv + atmPeIv) / 2) * 100) / 100;

  const validCeIvs = sortedChain.filter(rRow => rRow.ceIv > 0).map(rRow => rRow.ceIv);
  const validPeIvs = sortedChain.filter(rRow => rRow.peIv > 0).map(rRow => rRow.peIv);

  const avgCeIv = validCeIvs.length > 0 ? Math.round((validCeIvs.reduce((a, b) => a + b, 0) / validCeIvs.length) * 100) / 100 : 0;
  const avgPeIv = validPeIvs.length > 0 ? Math.round((validPeIvs.reduce((a, b) => a + b, 0) / validPeIvs.length) * 100) / 100 : 0;

  const otmPut = sortedChain.find(rRow => rRow.strikePrice <= spotPrice * 0.95);
  const otmCall = sortedChain.find(rRow => rRow.strikePrice >= spotPrice * 1.05);
  const ivSkew = (otmPut && otmCall && otmPut.peIv > 0 && otmCall.ceIv > 0)
    ? Math.round((otmPut.peIv - otmCall.ceIv) * 100) / 100
    : Math.round((avgPeIv - avgCeIv) * 100) / 100;

  // 2% OTM Tail Risk Skew
  const otm2PctPutRow = sortedChain.slice().reverse().find(rRow => rRow.strikePrice <= spotPrice * 0.98) || sortedChain[0];
  const otm2PctCallRow = sortedChain.find(rRow => rRow.strikePrice >= spotPrice * 1.02) || sortedChain[sortedChain.length - 1];
  const otm2PctPutIv = otm2PctPutRow ? otm2PctPutRow.peIv : avgPeIv;
  const otm2PctCallIv = otm2PctCallRow ? otm2PctCallRow.ceIv : avgCeIv;
  const tailRiskSkew = Math.round((otm2PctPutIv - otm2PctCallIv) * 100) / 100;

  const putIvSkew = Math.round((otm2PctPutIv - atmIv) * 100) / 100;
  const callIvSkew = Math.round((otm2PctCallIv - atmIv) * 100) / 100;

  // Compute Theoretical Implied India VIX using CBOE/NSE Variance Formula directly from Chain
  const T = Math.max(daysToExpiry, 0.5) / 365.0;
  const forwardF = futuresPrice > 0 ? futuresPrice : spotPrice * Math.exp(r * T);

  let varianceSum = 0;
  let k0Strike = atmStrike;
  const otmOptionRows = sortedChain.filter(r => r.strikePrice > 0);

  if (otmOptionRows.length >= 3) {
    for (let i = 0; i < otmOptionRows.length; i++) {
      const cur = otmOptionRows[i];
      const prevK = i > 0 ? otmOptionRows[i - 1].strikePrice : cur.strikePrice;
      const nextK = i < otmOptionRows.length - 1 ? otmOptionRows[i + 1].strikePrice : cur.strikePrice;
      const deltaK = (nextK - prevK) / 2.0;

      if (deltaK <= 0) continue;

      let midPrice = 0;
      if (cur.strikePrice < forwardF) {
        midPrice = cur.peLtp > 0 ? cur.peLtp : 0;
      } else if (cur.strikePrice > forwardF) {
        midPrice = cur.ceLtp > 0 ? cur.ceLtp : 0;
      } else {
        midPrice = (cur.ceLtp + cur.peLtp) / 2.0;
        k0Strike = cur.strikePrice;
      }

      if (midPrice > 0) {
        const contrib = (deltaK / (cur.strikePrice * cur.strikePrice)) * Math.exp(r * T) * midPrice;
        varianceSum += contrib;
      }
    }
  }

  let calculatedVixVal = 0;
  if (varianceSum > 0) {
    const rawVar = (2 / T) * varianceSum - (1 / T) * Math.pow((forwardF / (k0Strike || spotPrice)) - 1, 2);
    if (rawVar > 0) {
      calculatedVixVal = Math.round(100 * Math.sqrt(rawVar) * 100) / 100;
    }
  }

  // Fallback to ATM IV if chain pricing is sparse
  const impliedVix = (calculatedVixVal >= 5 && calculatedVixVal <= 80) ? calculatedVixVal : Math.round(atmIv * 100) / 100;

  let skewRegime: 'CRASH_HEDGING' | 'BULLISH_FOMO' | 'NEUTRAL_BALANCED' = 'NEUTRAL_BALANCED';
  let skewRegimeLabel = 'Balanced Volatility Skew';
  if (tailRiskSkew >= 2.0) {
    skewRegime = 'CRASH_HEDGING';
    skewRegimeLabel = `Institutional Crash Hedging (Put IV +${tailRiskSkew}% over Call IV)`;
  } else if (tailRiskSkew <= -1.5) {
    skewRegime = 'BULLISH_FOMO';
    skewRegimeLabel = `Bullish Call Demand Skew (Call IV +${Math.abs(tailRiskSkew)}% over Put IV)`;
  }

  let volatilityRegime: 'HIGH_VOLATILITY' | 'MODERATE_VOLATILITY' | 'LOW_VOLATILITY' = 'MODERATE_VOLATILITY';
  if (impliedVix >= 17.5) {
    volatilityRegime = 'HIGH_VOLATILITY';
  } else if (impliedVix <= 12.0) {
    volatilityRegime = 'LOW_VOLATILITY';
  }

  const ivSmile = sortedChain.map(rRow => ({ strike: rRow.strikePrice, ceIv: rRow.ceIv, peIv: rRow.peIv }));

  const ivAnalysis: IvAnalysisData = {
    atmIv, avgCeIv, avgPeIv,
    highestIvStrike: highestCeIvStrike, highestIvValue: highestCeIvValue,
    lowestIvStrike: lowestCeIvStrike, lowestIvValue: lowestCeIvValue === 999999 ? 0 : lowestCeIvValue,
    ivSkew,
    tailRiskSkew,
    otm2PctPutIv,
    otm2PctCallIv,
    impliedVix,
    putIvSkew,
    callIvSkew,
    skewRegime,
    skewRegimeLabel,
    volatilityRegime,
    ivSmile
  };

  // 8. Black-Scholes Greeks
  const greeksTable: GreekRow[] = sortedChain.map(rRow => {
    const ceSigma = (rRow.ceIv > 0 ? rRow.ceIv : (atmIv > 0 ? atmIv : 14.0)) / 100.0;
    const peSigma = (rRow.peIv > 0 ? rRow.peIv : (atmIv > 0 ? atmIv : 14.0)) / 100.0;

    const ceGreeks = calculateBlackScholesGreeks(spotPrice, rRow.strikePrice, T, r, ceSigma, 'CE');
    const peGreeks = calculateBlackScholesGreeks(spotPrice, rRow.strikePrice, T, r, peSigma, 'PE');

    return {
      strike: rRow.strikePrice,
      ce: ceGreeks,
      pe: peGreeks
    };
  });

  // 9. Expected Move
  const expectedMovePts = Math.round(spotPrice * (atmIv / 100.0) * Math.sqrt(T) * 100) / 100;
  const expectedMovePct = spotPrice > 0 ? Math.round((expectedMovePts / spotPrice) * 10000) / 100 : 0;
  const upperBound = Math.round((spotPrice + expectedMovePts) * 100) / 100;
  const lowerBound = Math.round((spotPrice - expectedMovePts) * 100) / 100;

  const expectedMove: ExpectedMoveData = {
    expectedMovePoints: expectedMovePts,
    expectedMovePercentage: expectedMovePct,
    upperBound, lowerBound
  };

  // 10. Futures Analysis
  const futuresAnalysis: FuturesAnalysisData = {
    open: futuresData.open || spotPrice,
    high: futuresData.high || spotPrice,
    low: futuresData.low || spotPrice,
    ltp: futuresPrice,
    volume: futuresData.volume || 0,
    openInterest: futuresData.openInterest || 0,
    premium: futuresPremiumDiscount > 0 ? futuresPremiumDiscount : 0,
    discount: futuresPremiumDiscount < 0 ? Math.abs(futuresPremiumDiscount) : 0,
    basisPct: spotPrice > 0 ? Math.round((futuresPremiumDiscount / spotPrice) * 10000) / 100 : 0,
    status: premiumDiscountType
  };

  // 11. Historical Volatility & HV vs IV
  const defaultHv: HistoricalVolatilityData = {
    annualizedHv: 14.85,
    dailyStdDev: 0.94,
    lookbackDays: 20,
    candles: [],
    source: 'Yahoo Finance'
  };

  const historicalVolatility = hvData || defaultHv;
  const hvIvDiff = Math.round((historicalVolatility.annualizedHv - atmIv) * 100) / 100;
  const hvIvRatio = atmIv > 0 ? Math.round((historicalVolatility.annualizedHv / atmIv) * 100) / 100 : 1;

  let hvIvInterp = 'Volatilities Balanced';
  if (atmIv > historicalVolatility.annualizedHv * 1.15) hvIvInterp = 'Options Overpriced (High IV Premium over HV)';
  else if (historicalVolatility.annualizedHv > atmIv * 1.15) hvIvInterp = 'Options Underpriced (High Realized HV over IV)';

  const hvVsIv: HvVsIvData = {
    hv: historicalVolatility.annualizedHv,
    atmIv,
    difference: hvIvDiff,
    ratio: hvIvRatio,
    interpretation: hvIvInterp
  };

  // 12. Most Active Options
  const activeCeRows = sortedChain.map(rRow => ({ strike: rRow.strikePrice, type: 'CE' as const, ltp: rRow.ceLtp, volume: rRow.ceVolume, oi: rRow.ceOi, value: Math.round(rRow.ceLtp * rRow.ceVolume) }));
  const activePeRows = sortedChain.map(rRow => ({ strike: rRow.strikePrice, type: 'PE' as const, ltp: rRow.peLtp, volume: rRow.peVolume, oi: rRow.peOi, value: Math.round(rRow.peLtp * rRow.peVolume) }));
  const allActiveRows = [...activeCeRows, ...activePeRows];

  const top10ByVolume = [...allActiveRows].sort((a, b) => b.volume - a.volume).slice(0, 10);
  const top10ByOi = [...allActiveRows].sort((a, b) => b.oi - a.oi).slice(0, 10);

  const mostActive: MostActiveData = { top10ByVolume, top10ByOi };

  // 13. Complete Option Chain Table
  const completeChain: CompleteChainRow[] = sortedChain.map((rRow, i) => {
    const g = greeksTable[i];
    return {
      strike: rRow.strikePrice,
      isAtm: rRow.strikePrice === atmStrike,
      ceOi: rRow.ceOi,
      ceChgOi: rRow.ceChgOi,
      ceVolume: rRow.ceVolume,
      ceIv: rRow.ceIv,
      ceLtp: rRow.ceLtp,
      ceDelta: g.ce.delta,
      ceGamma: g.ce.gamma,
      ceTheta: g.ce.theta,
      ceVega: g.ce.vega,
      peLtp: rRow.peLtp,
      peIv: rRow.peIv,
      peVolume: rRow.peVolume,
      peChgOi: rRow.peChgOi,
      peOi: rRow.peOi,
      peDelta: g.pe.delta,
      peGamma: g.pe.gamma,
      peTheta: g.pe.theta,
      peVega: g.pe.vega
    };
  });

  // 14. Data Audit Warnings
  const missingValuesList = warningsPartial.missingValues || [];
  const duplicateRowsList = warningsPartial.duplicateRows || [];
  const invalidIvList = warningsPartial.invalidIv || [];
  const negativeOiList = warningsPartial.negativeOi || [];
  const negativeVolumeList = warningsPartial.negativeVolume || [];

  const warnings: DataWarnings = {
    missingValues: missingValuesList,
    duplicateRows: duplicateRowsList,
    invalidIv: invalidIvList,
    negativeOi: negativeOiList,
    negativeVolume: negativeVolumeList,
    missingValuesDetails: warningsPartial.missingValuesDetails || missingValuesList,
    duplicateRowsDetails: warningsPartial.duplicateRowsDetails || duplicateRowsList,
    invalidIvDetails: warningsPartial.invalidIvDetails || invalidIvList,
    negativeOiDetails: warningsPartial.negativeOiDetails || negativeOiList,
    negativeVolumeDetails: warningsPartial.negativeVolumeDetails || negativeVolumeList,
    missingValuesCount: missingValuesList.length,
    duplicateRowsCount: duplicateRowsList.length,
    invalidIvCount: invalidIvList.length,
    negativeOiCount: negativeOiList.length,
    negativeVolumeCount: negativeVolumeList.length
  };

  return {
    marketSummary,
    chainSummary,
    pcrAnalysis,
    maxPain,
    supportResistance,
    oiAnalysis,
    liquidityAnalysis,
    ivAnalysis,
    greeksTable,
    expectedMove,
    futuresAnalysis,
    historicalVolatility,
    hvVsIv,
    mostActive,
    completeChain,
    warnings,
    riskFreeRate: riskFreeRatePercent
  };
};

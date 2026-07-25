import { calculateGreeks } from './blackScholes';

export interface LtpTargetRow {
  strike: number;
  isAtm: boolean;
  
  // Call Option Target Metrics
  ceCurrentLtp: number;
  ceTargetLtp: number;
  ceDiffRupees: number;
  ceDiffPct: number;
  ceReversalLevel: number; // EOR (Extension of Resistance)
  ceTargetIntrinsic: number;
  ceTargetExtrinsic: number;
  ceTargetPop: number;
  ceTargetTouch: number;
  
  // Put Option Target Metrics
  peCurrentLtp: number;
  peTargetLtp: number;
  peDiffRupees: number;
  peDiffPct: number;
  peReversalLevel: number; // EOS (Extension of Support)
  peTargetIntrinsic: number;
  peTargetExtrinsic: number;
  peTargetPop: number;
  peTargetTouch: number;
}

export interface InvestingDaddyRegime {
  imaginaryLineAtm: number;
  ultimateSupportUs: number;
  extensionOfSupportEos: number;
  ultimateResistanceUr: number;
  extensionOfResistanceEor: number;
  supportState: 'STRONG_SUPPORT' | 'SUPPORT_WTT' | 'SUPPORT_WTB' | 'STATE_OF_CONFUSION';
  resistanceState: 'STRONG_RESISTANCE' | 'RESISTANCE_WTT' | 'RESISTANCE_WTB' | 'STATE_OF_CONFUSION';
  marketRegimeLabel: string;
  goldenTradeSignal: 'BUY_CALL_AT_EOS' | 'BUY_PUT_AT_EOR' | 'SELL_CREDIT_CORRIDOR' | 'STATE_OF_CONFUSION';
  goldenSignalReason: string;
}

/**
 * Cumulative Normal Distribution Function N(x) using Abramowitz & Stegun approximation
 */
const cdf = (x: number): number => {
  if (x < -7.0) return 0.0;
  if (x > 7.0) return 1.0;

  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
};

/**
 * Calculates theoretical Black-Scholes option price for a given spot, strike, DTE, IV, and risk-free rate.
 */
export const calculateBlackScholesPrice = (
  S: number,
  K: number,
  T: number,
  r: number,
  v: number,
  type: 'CE' | 'PE'
): number => {
  if (T <= 0.0001) {
    return type === 'CE' ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  const sigma = Math.max(0.01, v / 100);
  const sqrtT = Math.sqrt(T);

  const d1 = (Math.log(S / K) + (r / 100 + (sigma * sigma) / 2.0) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  if (type === 'CE') {
    const price = S * cdf(d1) - K * Math.exp(-(r / 100) * T) * cdf(d2);
    return Math.max(0, Math.round(price * 100) / 100);
  } else {
    const price = K * Math.exp(-(r / 100) * T) * cdf(-d2) - S * cdf(-d1);
    return Math.max(0, Math.round(price * 100) / 100);
  }
};

/**
 * Calculates the complete LTP Target Matrix for all strikes in the option chain.
 */
export const calculateLtpTargetMatrix = (
  optionChain: any[],
  currentSpot: number,
  targetSpot: number,
  ivShiftPct: number = 0,
  hoursPassed: number = 0,
  daysToExpiry: number = 4,
  riskFreeRate: number = 5.25
): LtpTargetRow[] => {
  if (!optionChain || optionChain.length === 0) return [];

  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  // Find ATM strike
  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - currentSpot);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmStrike = atmRow.strikePrice || atmRow.strike;

  // Time parameters in years
  const daysPassed = hoursPassed / 24.0;
  const remainingDte = Math.max(0.01, daysToExpiry - daysPassed);
  const baseT = Math.max(0.01, daysToExpiry) / 365.0;
  const targetT = remainingDte / 365.0;

  const r = riskFreeRate;

  return sorted.map((row) => {
    const strike = row.strikePrice || row.strike || 0;

    // IV values
    const ceIvBase = row.ceIv > 0 ? row.ceIv : 14.5;
    const peIvBase = row.peIv > 0 ? row.peIv : 14.5;

    const ceIvTarget = Math.max(1, ceIvBase + ivShiftPct);
    const peIvTarget = Math.max(1, peIvBase + ivShiftPct);

    // Current LTPs
    const ceBasePrice = row.ceLtp > 0 ? row.ceLtp : calculateBlackScholesPrice(currentSpot, strike, baseT, r, ceIvBase, 'CE');
    const peBasePrice = row.peLtp > 0 ? row.peLtp : calculateBlackScholesPrice(currentSpot, strike, baseT, r, peIvBase, 'PE');

    // Target Black-Scholes Prices under simulated scenario
    const ceTargetLtp = calculateBlackScholesPrice(targetSpot, strike, targetT, r, ceIvTarget, 'CE');
    const peTargetLtp = calculateBlackScholesPrice(targetSpot, strike, targetT, r, peIvTarget, 'PE');

    const ceDiffRupees = Math.round((ceTargetLtp - ceBasePrice) * 100) / 100;
    const ceDiffPct = ceBasePrice > 0 ? Math.round(((ceTargetLtp - ceBasePrice) / ceBasePrice) * 100 * 100) / 100 : 0;

    const peDiffRupees = Math.round((peTargetLtp - peBasePrice) * 100) / 100;
    const peDiffPct = peBasePrice > 0 ? Math.round(((peTargetLtp - peBasePrice) / peBasePrice) * 100 * 100) / 100 : 0;

    // Calculate Support/Resistance Reversal Values (EOR / EOS)
    const ceReversalLevel = Math.round(strike + ceTargetLtp);
    const peReversalLevel = Math.round(strike - peTargetLtp);

    // Target Intrinsic & Extrinsic Values
    const ceTargetIntrinsic = Math.max(0, Math.round((targetSpot - strike) * 100) / 100);
    const ceTargetExtrinsic = Math.max(0, Math.round((ceTargetLtp - ceTargetIntrinsic) * 100) / 100);

    const peTargetIntrinsic = Math.max(0, Math.round((strike - targetSpot) * 100) / 100);
    const peTargetExtrinsic = Math.max(0, Math.round((peTargetLtp - peTargetIntrinsic) * 100) / 100);

    // Target POP % and Touch %
    const ceTargetGreeks = calculateGreeks(targetSpot, strike, targetT, r, ceIvTarget, 'CE');
    const ceTargetPop = Math.round(Math.abs(ceTargetGreeks.delta) * 100);
    const ceTargetTouch = Math.min(100, ceTargetPop * 2);

    const peTargetGreeks = calculateGreeks(targetSpot, strike, targetT, r, peIvTarget, 'PE');
    const peTargetPop = Math.round(Math.abs(peTargetGreeks.delta) * 100);
    const peTargetTouch = Math.min(100, peTargetPop * 2);

    return {
      strike,
      isAtm: strike === atmStrike,
      ceCurrentLtp: ceBasePrice,
      ceTargetLtp,
      ceDiffRupees,
      ceDiffPct,
      ceReversalLevel,
      ceTargetIntrinsic,
      ceTargetExtrinsic,
      ceTargetPop,
      ceTargetTouch,
      peCurrentLtp: peBasePrice,
      peTargetLtp,
      peDiffRupees,
      peDiffPct,
      peReversalLevel,
      peTargetIntrinsic,
      peTargetExtrinsic,
      peTargetPop,
      peTargetTouch
    };
  });
};

/**
 * Computes Investing Daddy Style Market Regimes & Reversal Levels (Vinay Tiwari Theory)
 */
export const calculateInvestingDaddyMarketRegime = (
  optionChain: any[],
  currentSpot: number
): InvestingDaddyRegime | null => {
  if (!optionChain || optionChain.length < 5 || currentSpot <= 0) return null;

  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  // Find ATM (Imaginary Line)
  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - currentSpot);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const imaginaryLineAtm = sorted[atmIndex].strikePrice || sorted[atmIndex].strike;

  // Ultimate Resistance (UR) = Max Call OI Strike
  let maxCallOi = -1;
  let urStrike = imaginaryLineAtm + 100;
  let urRow = sorted[atmIndex];

  // Ultimate Support (US) = Max Put OI Strike
  let maxPutOi = -1;
  let usStrike = imaginaryLineAtm - 100;
  let usRow = sorted[atmIndex];

  sorted.forEach(row => {
    const ceOi = row.ceOi || 0;
    const peOi = row.peOi || 0;
    const strike = row.strikePrice || row.strike || 0;

    if (ceOi > maxCallOi) {
      maxCallOi = ceOi;
      urStrike = strike;
      urRow = row;
    }

    if (peOi > maxPutOi) {
      maxPutOi = peOi;
      usStrike = strike;
      usRow = row;
    }
  });

  const ceExtrinsic = Math.max(0, (urRow.ceLtp || 0) - Math.max(0, currentSpot - urStrike));
  const peExtrinsic = Math.max(0, (usRow.peLtp || 0) - Math.max(0, usStrike - currentSpot));

  const extensionOfResistanceEor = Math.round(urStrike + ceExtrinsic);
  const extensionOfSupportEos = Math.round(usStrike - peExtrinsic);

  // WTT vs WTB Analysis
  let supportState: 'STRONG_SUPPORT' | 'SUPPORT_WTT' | 'SUPPORT_WTB' | 'STATE_OF_CONFUSION' = 'STRONG_SUPPORT';
  let resistanceState: 'STRONG_RESISTANCE' | 'RESISTANCE_WTT' | 'RESISTANCE_WTB' | 'STATE_OF_CONFUSION' = 'STRONG_RESISTANCE';

  if (usStrike > imaginaryLineAtm) supportState = 'SUPPORT_WTT';
  else if (usStrike < imaginaryLineAtm - 200) supportState = 'SUPPORT_WTB';

  if (urStrike < imaginaryLineAtm) resistanceState = 'RESISTANCE_WTB';
  else if (urStrike > imaginaryLineAtm + 200) resistanceState = 'RESISTANCE_WTT';

  let marketRegimeLabel = 'STRONG SUPPORT & STRONG RESISTANCE (BOUNDED CORRIDOR)';
  let goldenTradeSignal: 'BUY_CALL_AT_EOS' | 'BUY_PUT_AT_EOR' | 'SELL_CREDIT_CORRIDOR' | 'STATE_OF_CONFUSION' = 'SELL_CREDIT_CORRIDOR';
  let goldenSignalReason = `Market is bounded inside EOS ₹${extensionOfSupportEos} (Put Floor) and EOR ₹${extensionOfResistanceEor} (Call Ceiling). Ideal for rangebound income.`;

  if (supportState === 'SUPPORT_WTT' || resistanceState === 'RESISTANCE_WTT') {
    marketRegimeLabel = 'BULLISH MOMENTUM (WEAK TOWARDS TOP - WTT)';
    goldenTradeSignal = 'BUY_CALL_AT_EOS';
    goldenSignalReason = `Support is WTT towards ₹${usStrike}. Look for Call Buying entry when Spot dips near EOS (₹${extensionOfSupportEos}).`;
  } else if (supportState === 'SUPPORT_WTB' || resistanceState === 'RESISTANCE_WTB') {
    marketRegimeLabel = 'BEARISH BREAKDOWN (WEAK TOWARDS BOTTOM - WTB)';
    goldenTradeSignal = 'BUY_PUT_AT_EOR';
    goldenSignalReason = `Resistance is WTB towards ₹${urStrike}. Look for Put Buying entry when Spot rallies near EOR (₹${extensionOfResistanceEor}).`;
  }

  return {
    imaginaryLineAtm,
    ultimateSupportUs: usStrike,
    extensionOfSupportEos,
    ultimateResistanceUr: urStrike,
    extensionOfResistanceEor,
    supportState,
    resistanceState,
    marketRegimeLabel,
    goldenTradeSignal,
    goldenSignalReason
  };
};

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
  sigma: number,
  optionType: 'CE' | 'PE'
): number => {
  if (S <= 0 || K <= 0) return 0;
  if (T <= 0) T = 0.0001;
  if (sigma <= 0) sigma = 0.01;

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  if (optionType === 'CE') {
    const price = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
    return Math.max(0, Math.round(price * 100) / 100);
  } else {
    const price = K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
    return Math.max(0, Math.round(price * 100) / 100);
  }
};

/**
 * Calculate complete LTP Target Matrix comparing current market prices vs target scenario
 */
export const calculateLtpTargetMatrix = (
  optionChain: any[],
  currentSpot: number,
  targetSpot: number,
  ivShiftPct: number, // e.g. +1.5 or -2.0
  hoursPassed: number, // e.g. 0 to 72 hours
  daysToExpiry: number = 4,
  riskFreeRate: number = 5.25
): LtpTargetRow[] => {
  if (!optionChain || optionChain.length === 0) return [];

  const baseT = Math.max(daysToExpiry, 0.01) / 365.0;
  const targetT = Math.max(daysToExpiry - (hoursPassed / 24.0), 0.001) / 365.0;
  const r = riskFreeRate / 100.0;

  // Find ATM strike
  let atmStrike = 0;
  let minDiff = Infinity;
  optionChain.forEach(row => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - currentSpot);
    if (diff < minDiff) {
      minDiff = diff;
      atmStrike = strike;
    }
  });

  return optionChain.map(row => {
    const strike = row.strikePrice || row.strike || 0;
    const ceIvBase = (row.ceIv && row.ceIv > 0 ? row.ceIv : 15.0) / 100.0;
    const peIvBase = (row.peIv && row.peIv > 0 ? row.peIv : 15.0) / 100.0;

    const ceIvTarget = Math.max(0.01, ceIvBase + (ivShiftPct / 100.0));
    const peIvTarget = Math.max(0.01, peIvBase + (ivShiftPct / 100.0));

    // Base Black-Scholes Prices
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

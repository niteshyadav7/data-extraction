import type { OptionGreeks } from '../types';

/**
 * Standard Normal Probability Density Function N'(x)
 */
const pdf = (x: number): number => {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
};

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
    return (
      1.0 -
      c *
        Math.exp(-0.5 * x * x) *
        t *
        (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))))
    );
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (
      c *
      Math.exp(-0.5 * x * x) *
      t *
      (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))))
    );
  }
};

/**
 * Calculate Black-Scholes Option Greeks
 * @param S Spot Price
 * @param K Strike Price
 * @param T Time to expiry in years (e.g. DTE / 365)
 * @param r Risk Free Rate (decimal, e.g. 0.0525 for 5.25%)
 * @param sigma Implied Volatility (decimal, e.g. 0.15 for 15%)
 * @param isCall boolean true for Call, false for Put
 */
export const calculateGreeks = (
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean
): OptionGreeks => {
  // Prevent division by zero or negative time
  const time = Math.max(T, 0.0001); // minimum time fraction
  const vol = Math.max(sigma, 0.01); // minimum 1% IV

  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * time) / (vol * Math.sqrt(time));
  const d2 = d1 - vol * Math.sqrt(time);

  const nPrimeD1 = pdf(d1);

  // Delta
  const delta = isCall ? cdf(d1) : cdf(d1) - 1;

  // Gamma (same for call & put)
  const gamma = nPrimeD1 / (S * vol * Math.sqrt(time));

  // Theta (per day)
  const term1 = -(S * nPrimeD1 * vol) / (2 * Math.sqrt(time));
  let thetaYear = 0;
  if (isCall) {
    thetaYear = term1 - r * K * Math.exp(-r * time) * cdf(d2);
  } else {
    thetaYear = term1 + r * K * Math.exp(-r * time) * cdf(-d2);
  }
  const theta = thetaYear / 365;

  // Vega (per 1% change in IV)
  const vega = (S * nPrimeD1 * Math.sqrt(time)) / 100;

  // Rho (per 1% change in interest rate)
  let rho = 0;
  if (isCall) {
    rho = (K * time * Math.exp(-r * time) * cdf(d2)) / 100;
  } else {
    rho = (-K * time * Math.exp(-r * time) * cdf(-d2)) / 100;
  }

  return {
    delta: Math.round(delta * 10000) / 10000,
    gamma: Math.round(gamma * 100000) / 100000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
    rho: Math.round(rho * 10000) / 10000
  };
};

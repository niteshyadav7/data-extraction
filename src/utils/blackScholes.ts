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
    return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
};

/**
 * Calculates Black-Scholes Greeks for Call or Put options.
 */
export const calculateGreeks = (
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  optionType: 'CE' | 'PE'
): OptionGreeks => {
  if (T <= 0) T = 0.0001;
  if (sigma <= 0) sigma = 0.01;

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const nPrimeD1 = pdf(d1);

  let delta = 0;
  let theta = 0;
  let rho = 0;

  if (optionType === 'CE') {
    delta = cdf(d1);
    theta = (-(S * nPrimeD1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * cdf(d2)) / 365.0;
    rho = (K * T * Math.exp(-r * T) * cdf(d2)) / 100.0;
  } else {
    delta = cdf(d1) - 1.0;
    theta = (-(S * nPrimeD1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * cdf(-d2)) / 365.0;
    rho = (-K * T * Math.exp(-r * T) * cdf(-d2)) / 100.0;
  }

  const gamma = nPrimeD1 / (S * sigma * Math.sqrt(T));
  const vega = (S * nPrimeD1 * Math.sqrt(T)) / 100.0;

  return {
    delta: Math.round(delta * 10000) / 10000,
    gamma: Math.round(gamma * 100000) / 100000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
    rho: Math.round(rho * 10000) / 10000
  };
};

export const calculateBlackScholesGreeks = calculateGreeks;

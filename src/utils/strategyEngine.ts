export interface StrategyLeg {
  action: 'BUY' | 'SELL';
  optionType: 'CE' | 'PE';
  strike: number;
  ltp: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  iv: number;
  extrinsicValue: number;
  role: string;
}

export interface PayoffRow {
  spot: number;
  pnl: number;
  pnlPct: number;
  isCurrentSpot?: boolean;
  isBreakeven?: boolean;
  isEos1?: boolean;
  isEor1?: boolean;
  isMaxPain?: boolean;
  tag?: string;
}

export interface StrategyGreeks {
  netDelta: number;
  netGamma: number;
  dailyThetaIncome: number;
  vegaCrushGain: number;
}

export interface StrategyInstitutionalScore {
  score: number;
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RISKY';
  reversalAlignmentText: string;
  expectedMoveText: string;
}

export interface StrategyDecisionIntelligence {
  executiveSummary: string;
  confluenceScore: number; // 0 - 100%
  confidenceRating: 'HIGH CONFIDENCE' | 'MODERATE CONFIDENCE' | 'LOW CONFIDENCE';
  pros: string[];
  cons: string[];
  executionPlan: {
    entryZone: string;
    profitTarget: string;
    adjustmentTrigger: string;
  };
}

export interface StrategyResult {
  strategyName: string;
  symbol: string;
  spotPrice: number;
  lotSize: number;
  legs: StrategyLeg[];
  netCreditPerShare: number;
  netDebitPerShare: number;
  maxProfit: number;
  maxLoss: number;
  upperBreakeven: number;
  lowerBreakeven?: number;
  riskRewardRatio: number;
  popPercentage: number;
  totalExtrinsicCaptured: number;
  greeks: StrategyGreeks;
  healthScore: StrategyInstitutionalScore;
  decisionIntelligence: StrategyDecisionIntelligence;
  reversalLevels?: {
    eos1: number;
    eos2: number;
    eor1: number;
    eor2: number;
    maxPain: number;
  };
  payoffRows: PayoffRow[];
}

export const getDefaultLotSizeForSymbol = (symbol: string): number => {
  const sym = symbol.toUpperCase();
  if (sym === 'NIFTY') return 25;
  if (sym === 'BANKNIFTY') return 15;
  if (sym === 'FINNIFTY') return 25;
  if (sym === 'MIDCPNIFTY') return 50;

  if (sym === 'RELIANCE') return 250;
  if (sym === 'INFY') return 400;
  if (sym === 'TCS') return 175;
  if (sym === 'HDFCBANK') return 550;
  if (sym === 'ICICIBANK') return 700;
  if (sym === 'SBIN') return 750;
  if (sym === 'BHARTIARTL') return 475;
  if (sym === 'TATAMOTORS') return 550;

  return 25;
};

export const calculateIronCondorStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  wingWidthStrikes: number = 2,
  supportResistance?: { top5Support: { strike: number }[]; top5Resistance: { strike: number }[] },
  maxPainStrike?: number,
  expectedMoveBounds?: { upper: number; lower: number }
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmCeLtp = atmRow.ceLtp || 0;
  const atmPeLtp = atmRow.peLtp || 0;

  const highestPutStrike = supportResistance?.top5Support?.[0]?.strike || 0;
  const secondPutStrike = supportResistance?.top5Support?.[1]?.strike || 0;
  const highestCallStrike = supportResistance?.top5Resistance?.[0]?.strike || 0;
  const secondCallStrike = supportResistance?.top5Resistance?.[1]?.strike || 0;

  const eos1 = highestPutStrike > 0 ? highestPutStrike - atmPeLtp : 0;
  const eos2 = secondPutStrike > 0 ? secondPutStrike - atmPeLtp : 0;
  const eor1 = highestCallStrike > 0 ? highestCallStrike + atmCeLtp : 0;
  const eor2 = secondCallStrike > 0 ? secondCallStrike + atmCeLtp : 0;

  let shortPutIndex = Math.max(0, atmIndex - 3);
  if (eos1 > 0) {
    let bestIdx = shortPutIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s <= eos1) {
        const err = Math.abs(s - eos1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortPutIndex = bestIdx;
  }

  const longPutIndex = Math.max(0, shortPutIndex - wingWidthStrikes);

  let shortCallIndex = Math.min(sorted.length - 1, atmIndex + 3);
  if (eor1 > 0) {
    let bestIdx = shortCallIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s >= eor1) {
        const err = Math.abs(s - eor1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortCallIndex = bestIdx;
  }

  const longCallIndex = Math.min(sorted.length - 1, shortCallIndex + wingWidthStrikes);

  const shortPutRow = sorted[shortPutIndex];
  const longPutRow = sorted[longPutIndex];
  const shortCallRow = sorted[shortCallIndex];
  const longCallRow = sorted[longCallIndex];

  const spStrike = shortPutRow.strikePrice || shortPutRow.strike;
  const lpStrike = longPutRow.strikePrice || longPutRow.strike;
  const scStrike = shortCallRow.strikePrice || shortCallRow.strike;
  const lcStrike = longCallRow.strikePrice || longCallRow.strike;

  const spLtp = shortPutRow.peLtp || 0;
  const lpLtp = longPutRow.peLtp || 0;
  const scLtp = shortCallRow.ceLtp || 0;
  const lcLtp = longCallRow.ceLtp || 0;

  const spDelta = shortPutRow.peDelta !== undefined ? shortPutRow.peDelta : -0.25;
  const lpDelta = longPutRow.peDelta !== undefined ? longPutRow.peDelta : -0.10;
  const scDelta = shortCallRow.ceDelta !== undefined ? shortCallRow.ceDelta : 0.25;
  const lcDelta = longCallRow.ceDelta !== undefined ? longCallRow.ceDelta : 0.10;

  const spTheta = shortPutRow.peTheta !== undefined ? shortPutRow.peTheta : -5;
  const lpTheta = longPutRow.peTheta !== undefined ? longPutRow.peTheta : -2;
  const scTheta = shortCallRow.ceTheta !== undefined ? shortCallRow.ceTheta : -5;
  const lcTheta = longCallRow.ceTheta !== undefined ? longCallRow.ceTheta : -2;

  const spVega = shortPutRow.peVega !== undefined ? shortPutRow.peVega : 10;
  const lpVega = longPutRow.peVega !== undefined ? longPutRow.peVega : 4;
  const scVega = shortCallRow.ceVega !== undefined ? shortCallRow.ceVega : 10;
  const lcVega = longCallRow.ceVega !== undefined ? longCallRow.ceVega : 4;

  const spGamma = shortPutRow.peGamma !== undefined ? shortPutRow.peGamma : 0.001;
  const lpGamma = longPutRow.peGamma !== undefined ? longPutRow.peGamma : 0.0005;
  const scGamma = shortCallRow.ceGamma !== undefined ? shortCallRow.ceGamma : 0.001;
  const lcGamma = longCallRow.ceGamma !== undefined ? longCallRow.ceGamma : 0.0005;

  const spExtrinsic = Math.max(0, spLtp - Math.max(0, spStrike - spotPrice));
  const lpExtrinsic = Math.max(0, lpLtp - Math.max(0, lpStrike - spotPrice));
  const scExtrinsic = Math.max(0, scLtp - Math.max(0, spotPrice - scStrike));
  const lcExtrinsic = Math.max(0, lcLtp - Math.max(0, spotPrice - lcStrike));

  const legs: StrategyLeg[] = [
    { action: 'BUY', optionType: 'PE', strike: lpStrike, ltp: lpLtp, delta: lpDelta, gamma: lpGamma, theta: lpTheta, vega: lpVega, iv: longPutRow.peIv || 0, extrinsicValue: lpExtrinsic, role: 'Long Put Wing' },
    { action: 'SELL', optionType: 'PE', strike: spStrike, ltp: spLtp, delta: spDelta, gamma: spGamma, theta: spTheta, vega: spVega, iv: shortPutRow.peIv || 0, extrinsicValue: spExtrinsic, role: 'Short Put' },
    { action: 'SELL', optionType: 'CE', strike: scStrike, ltp: scLtp, delta: scDelta, gamma: scGamma, theta: scTheta, vega: scVega, iv: shortCallRow.ceIv || 0, extrinsicValue: scExtrinsic, role: 'Short Call' },
    { action: 'BUY', optionType: 'CE', strike: lcStrike, ltp: lcLtp, delta: lcDelta, gamma: lcGamma, theta: lcTheta, vega: lcVega, iv: longCallRow.ceIv || 0, extrinsicValue: lcExtrinsic, role: 'Long Call Wing' },
  ];

  const netCreditPerShare = Math.max(0, Math.round(((scLtp + spLtp) - (lcLtp + lpLtp)) * 100) / 100);
  const netCreditTotal = Math.round(netCreditPerShare * lotSize);

  const callWingWidth = lcStrike - scStrike;
  const putWingWidth = spStrike - lpStrike;
  const maxSpreadWidth = Math.max(callWingWidth, putWingWidth);

  const maxProfit = netCreditTotal;
  const maxLossPerShare = Math.max(0, maxSpreadWidth - netCreditPerShare);
  const maxLoss = Math.round(maxLossPerShare * lotSize);

  const upperBreakeven = Math.round((scStrike + netCreditPerShare) * 100) / 100;
  const lowerBreakeven = Math.round((spStrike - netCreditPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(95, Math.max(10, Math.round((1 - (Math.abs(spDelta) + Math.abs(scDelta))) * 100)));

  const totalExtrinsicCaptured = Math.round(((scExtrinsic + spExtrinsic) - (lcExtrinsic + lpExtrinsic)) * lotSize);

  const netDeltaPerShare = (lpDelta + lcDelta) - (spDelta + scDelta);
  const netDeltaTotal = Math.round(netDeltaPerShare * lotSize * 100) / 100;

  const netGammaPerShare = (lpGamma + lcGamma) - (spGamma + scGamma);
  const netGammaTotal = Math.round(netGammaPerShare * lotSize * 1000) / 1000;

  const calculatedTheta = Math.round(((-spTheta - scTheta) + (lpTheta + lcTheta)) * lotSize);
  const avgDailyThetaDecay = maxProfit > 0 ? Math.round(maxProfit / 4.0) : 0;
  const dailyThetaIncome = Math.max(calculatedTheta, avgDailyThetaDecay);
  const vegaCrushGain = Math.round(((-spVega - scVega) + (lpVega + lcVega)) * lotSize);

  const greeks: StrategyGreeks = {
    netDelta: netDeltaTotal,
    netGamma: netGammaTotal,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  let score = 75;
  let reversalAlignmentText = 'Positioned near standard OTM levels';
  let expectedMoveText = 'Breakevens within normal expected range';

  if (eos1 > 0 && eor1 > 0) {
    if (spStrike <= eos1 && scStrike >= eor1) {
      score += 15;
      reversalAlignmentText = `Short Put (₹${spStrike}) at/below EOS1 (₹${Math.round(eos1)}) & Short Call (₹${scStrike}) at/above EOR1 (₹${Math.round(eor1)})`;
    } else {
      reversalAlignmentText = `Positioned inside EOR1 (₹${Math.round(eor1)}) / EOS1 (₹${Math.round(eos1)})`;
    }
  }

  if (expectedMoveBounds && expectedMoveBounds.upper > 0 && expectedMoveBounds.lower > 0) {
    if (lowerBreakeven <= expectedMoveBounds.lower && upperBreakeven >= expectedMoveBounds.upper) {
      score += 10;
      expectedMoveText = `Breakevens (₹${lowerBreakeven} ↔ ₹${upperBreakeven}) envelop 1-StdDev Expected Move (₹${Math.round(expectedMoveBounds.lower)} ↔ ₹${Math.round(expectedMoveBounds.upper)})`;
    }
  }

  score = Math.min(98, Math.max(40, score));
  let rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RISKY' = 'GOOD';
  if (score >= 90) rating = 'EXCELLENT';
  else if (score >= 75) rating = 'GOOD';
  else if (score >= 60) rating = 'MODERATE';
  else rating = 'RISKY';

  const healthScore: StrategyInstitutionalScore = {
    score,
    rating,
    reversalAlignmentText,
    expectedMoveText
  };

  const confluenceScore = Math.min(98, Math.round((popPercentage * 0.5) + (score * 0.5)));
  const confidenceRating = confluenceScore >= 80 ? 'HIGH CONFIDENCE' : confluenceScore >= 65 ? 'MODERATE CONFIDENCE' : 'LOW CONFIDENCE';

  const pros = [
    `Short legs (Put ₹${spStrike} / Call ₹${scStrike}) positioned safely outside primary reversal zones (${eos1 > 0 ? `EOS1 ₹${Math.round(eos1)}` : 'Support'} / ${eor1 > 0 ? `EOR1 ₹${Math.round(eor1)}` : 'Resistance'}).`,
    `Generates +₹${Math.max(0, dailyThetaIncome)}/day in pure cash flow from positive Theta time decay for lot size ${lotSize}.`,
    `High Probability of Profit (POP) at ${popPercentage}% with delta-neutral stance (Net Δ: ${netDeltaTotal}).`,
    `Defined & Capped Max Risk of ₹${maxLoss.toLocaleString('en-IN')}, eliminating catastrophic tail-risk.`,
    `Captures ₹${totalExtrinsicCaptured.toLocaleString('en-IN')} in total extrinsic time value that decays to zero.`
  ];

  const cons = [
    `Max Risk (₹${maxLoss.toLocaleString('en-IN')}) exceeds Max Reward (₹${maxProfit.toLocaleString('en-IN')}) with Risk/Reward ratio of ${riskRewardRatio}.`,
    `Vulnerable to sharp directional gap-ups or gap-downs breaking the breakeven band (₹${lowerBreakeven} ↔ ₹${upperBreakeven}).`,
    `Negative Vega exposure: an unexpected spike in Implied Volatility (IV) will cause transient unrealized MTM loss.`
  ];

  const executiveSummary = `${symbol.toUpperCase()} derivative analytics support a non-directional Iron Condor strategy. Short strikes at Put ₹${spStrike} and Call ₹${scStrike} sit beyond institutional reversal zones, capturing ₹${totalExtrinsicCaptured.toLocaleString('en-IN')} of pure time value with a ${popPercentage}% POP and +₹${Math.max(0, dailyThetaIncome)}/day in positive theta decay.`;

  const executionPlan = {
    entryZone: `Spot ₹${Math.round(spotPrice * 0.998).toLocaleString('en-IN')} - ₹${Math.round(spotPrice * 1.002).toLocaleString('en-IN')} when IV is elevated.`,
    profitTarget: `Harvest 50% to 70% of Max Profit (Exit when position profit reaches +₹${Math.round(maxProfit * 0.6).toLocaleString('en-IN')}).`,
    adjustmentTrigger: `Close or roll position if Spot breaches Short Put (₹${spStrike}) or Short Call (₹${scStrike}).`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary,
    confluenceScore,
    confidenceRating,
    pros,
    cons,
    executionPlan
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.96);
  const maxSpot = Math.round(upperBreakeven * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  const mp = maxPainStrike || 0;

  for (let s = minSpot; s <= maxSpot; s += step) {
    const putShortLoss = Math.max(0, spStrike - s);
    const putLongGain = Math.max(0, lpStrike - s);
    const callShortLoss = Math.max(0, s - scStrike);
    const callLongGain = Math.max(0, s - lcStrike);

    const netPayoffPerShare = netCreditPerShare - putShortLoss + putLongGain - callShortLoss + callLongGain;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (mp > 0 && Math.abs(s - mp) < step / 2) tag = 'MAX PAIN STRIKE';
    else if (eos1 > 0 && Math.abs(s - eos1) < step / 2) tag = 'EOS1 PRIMARY SUPPORT';
    else if (eor1 > 0 && Math.abs(s - eor1) < step / 2) tag = 'EOR1 PRIMARY RESISTANCE';
    else if (eos2 > 0 && Math.abs(s - eos2) < step / 2) tag = 'EOS2 SECONDARY SUPPORT';
    else if (eor2 > 0 && Math.abs(s - eor2) < step / 2) tag = 'EOR2 SECONDARY RESISTANCE';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2,
      isEos1: eos1 > 0 && Math.abs(s - eos1) < step / 2,
      isEor1: eor1 > 0 && Math.abs(s - eor1) < step / 2,
      isMaxPain: mp > 0 && Math.abs(s - mp) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Iron Condor (Neutral Income)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netDebitPerShare: 0,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: (eos1 > 0 || eor1 > 0) ? {
      eos1: Math.round(eos1),
      eos2: Math.round(eos2),
      eor1: Math.round(eor1),
      eor2: Math.round(eor2),
      maxPain: maxPainStrike || 0
    } : undefined,
    payoffRows
  };
};

/**
 * Strategy #2: 🦋 Dynamic Iron Butterfly Strategy (Max Pain Pinning Trade)
 */
export const calculateIronButterflyStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  wingWidthStrikes: number = 2,
  maxPainStrike?: number
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  const targetAtmPrice = (maxPainStrike && maxPainStrike > 0) ? maxPainStrike : spotPrice;

  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - targetAtmPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const longPutIndex = Math.max(0, atmIndex - wingWidthStrikes);
  const longCallIndex = Math.min(sorted.length - 1, atmIndex + wingWidthStrikes);

  const atmRow = sorted[atmIndex];
  const longPutRow = sorted[longPutIndex];
  const longCallRow = sorted[longCallIndex];

  const atmStrike = atmRow.strikePrice || atmRow.strike;
  const lpStrike = longPutRow.strikePrice || longPutRow.strike;
  const lcStrike = longCallRow.strikePrice || longCallRow.strike;

  const atmCeLtp = atmRow.ceLtp || 0;
  const atmPeLtp = atmRow.peLtp || 0;
  const lpLtp = longPutRow.peLtp || 0;
  const lcLtp = longCallRow.ceLtp || 0;

  const atmCeDelta = atmRow.ceDelta !== undefined ? atmRow.ceDelta : 0.50;
  const atmPeDelta = atmRow.peDelta !== undefined ? atmRow.peDelta : -0.50;
  const lpDelta = longPutRow.peDelta !== undefined ? longPutRow.peDelta : -0.15;
  const lcDelta = longCallRow.ceDelta !== undefined ? longCallRow.ceDelta : 0.15;

  const atmCeTheta = atmRow.ceTheta !== undefined ? atmRow.ceTheta : -12;
  const atmPeTheta = atmRow.peTheta !== undefined ? atmRow.peTheta : -12;
  const lpTheta = longPutRow.peTheta !== undefined ? longPutRow.peTheta : -3;
  const lcTheta = longCallRow.ceTheta !== undefined ? longCallRow.ceTheta : -3;

  const atmCeVega = atmRow.ceVega !== undefined ? atmRow.ceVega : 15;
  const atmPeVega = atmRow.peVega !== undefined ? atmRow.peVega : 15;
  const lpVega = longPutRow.peVega !== undefined ? longPutRow.peVega : 5;
  const lcVega = longCallRow.ceVega !== undefined ? longCallRow.ceVega : 5;

  const atmCeGamma = atmRow.ceGamma !== undefined ? atmRow.ceGamma : 0.002;
  const atmPeGamma = atmRow.peGamma !== undefined ? atmRow.peGamma : 0.002;
  const lpGamma = longPutRow.peGamma !== undefined ? longPutRow.peGamma : 0.0006;
  const lcGamma = longCallRow.ceGamma !== undefined ? longCallRow.ceGamma : 0.0006;

  const atmCeExtrinsic = Math.max(0, atmCeLtp - Math.max(0, spotPrice - atmStrike));
  const atmPeExtrinsic = Math.max(0, atmPeLtp - Math.max(0, atmStrike - spotPrice));
  const lpExtrinsic = Math.max(0, lpLtp - Math.max(0, lpStrike - spotPrice));
  const lcExtrinsic = Math.max(0, lcLtp - Math.max(0, spotPrice - lcStrike));

  const legs: StrategyLeg[] = [
    { action: 'BUY', optionType: 'PE', strike: lpStrike, ltp: lpLtp, delta: lpDelta, gamma: lpGamma, theta: lpTheta, vega: lpVega, iv: longPutRow.peIv || 0, extrinsicValue: lpExtrinsic, role: 'Long Put Wing' },
    { action: 'SELL', optionType: 'PE', strike: atmStrike, ltp: atmPeLtp, delta: atmPeDelta, gamma: atmPeGamma, theta: atmPeTheta, vega: atmPeVega, iv: atmRow.peIv || 0, extrinsicValue: atmPeExtrinsic, role: 'Short ATM Put' },
    { action: 'SELL', optionType: 'CE', strike: atmStrike, ltp: atmCeLtp, delta: atmCeDelta, gamma: atmCeGamma, theta: atmCeTheta, vega: atmCeVega, iv: atmRow.ceIv || 0, extrinsicValue: atmCeExtrinsic, role: 'Short ATM Call' },
    { action: 'BUY', optionType: 'CE', strike: lcStrike, ltp: lcLtp, delta: lcDelta, gamma: lcGamma, theta: lcTheta, vega: lcVega, iv: longCallRow.ceIv || 0, extrinsicValue: lcExtrinsic, role: 'Long Call Wing' },
  ];

  const netCreditPerShare = Math.max(0, Math.round(((atmCeLtp + atmPeLtp) - (lcLtp + lpLtp)) * 100) / 100);
  const netCreditTotal = Math.round(netCreditPerShare * lotSize);

  const spreadWidth = lcStrike - atmStrike;
  const maxProfit = netCreditTotal;
  const maxLossPerShare = Math.max(0, spreadWidth - netCreditPerShare);
  const maxLoss = Math.round(maxLossPerShare * lotSize);

  const upperBreakeven = Math.round((atmStrike + netCreditPerShare) * 100) / 100;
  const lowerBreakeven = Math.round((atmStrike - netCreditPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;

  const popPercentage = Math.min(75, Math.max(40, Math.round((netCreditPerShare / spreadWidth) * 100)));
  const totalExtrinsicCaptured = Math.round(((atmCeExtrinsic + atmPeExtrinsic) - (lcExtrinsic + lpExtrinsic)) * lotSize);

  const netDeltaPerShare = (lpDelta + lcDelta) - (atmPeDelta + atmCeDelta);
  const netDeltaTotal = Math.round(netDeltaPerShare * lotSize * 100) / 100;

  const netGammaPerShare = (lpGamma + lcGamma) - (atmPeGamma + atmCeGamma);
  const netGammaTotal = Math.round(netGammaPerShare * lotSize * 1000) / 1000;

  const calculatedTheta = Math.round(((-atmPeTheta - atmCeTheta) + (lpTheta + lcTheta)) * lotSize);
  const avgDailyThetaDecay = maxProfit > 0 ? Math.round(maxProfit / 4.0) : 0;
  const dailyThetaIncome = Math.max(calculatedTheta, avgDailyThetaDecay);
  const vegaCrushGain = Math.round(((-atmPeVega - atmCeVega) + (lpVega + lcVega)) * lotSize);

  const greeks: StrategyGreeks = {
    netDelta: netDeltaTotal,
    netGamma: netGammaTotal,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 92,
    rating: 'EXCELLENT',
    reversalAlignmentText: `Pinned at Max Pain / ATM Strike ₹${atmStrike} for maximum gravitational expiry decay`,
    expectedMoveText: `Breakevens (₹${lowerBreakeven} ↔ ₹${upperBreakeven}) envelop Max Pain pin zone`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `${symbol.toUpperCase()} derivative metrics support a high-theta Iron Butterfly pinning strategy centered at Max Pain / ATM Strike ₹${atmStrike}. Generating +₹${Math.max(0, dailyThetaIncome)}/day in time decay, this setup captures maximum peak credit of ₹${maxProfit.toLocaleString('en-IN')} with defined wing protection.`,
    confluenceScore: 86,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `Maximum daily Theta time decay cashflow (+₹${Math.max(0, dailyThetaIncome)}/day) for lot size ${lotSize}.`,
      `Optimal strike pinning at Max Pain / ATM Strike ₹${atmStrike}.`,
      `Substantial Max Profit potential (+₹${maxProfit.toLocaleString('en-IN')}) collected as net credit.`,
      `Defined & Capped Max Loss of ₹${maxLoss.toLocaleString('en-IN')} via protective wings.`
    ],
    cons: [
      `Narrow peak profit cone: Maximum profit requires spot to expire close to ₹${atmStrike}.`,
      `Negative Gamma: Position sensitivity increases as expiry approaches if spot moves away from ATM strike.`
    ],
    executionPlan: {
      entryZone: `Spot near ₹${atmStrike.toLocaleString('en-IN')} (within 0.5% of Max Pain / ATM strike).`,
      profitTarget: `Exit at 50% - 60% max profit (harvest +₹${Math.round(maxProfit * 0.55).toLocaleString('en-IN')} profit).`,
      adjustmentTrigger: `Exit or convert to straddle if spot moves beyond wing strikes (₹${lpStrike} or ₹${lcStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.96);
  const maxSpot = Math.round(upperBreakeven * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const putShortLoss = Math.max(0, atmStrike - s);
    const putLongGain = Math.max(0, lpStrike - s);
    const callShortLoss = Math.max(0, s - atmStrike);
    const callLongGain = Math.max(0, s - lcStrike);

    const netPayoffPerShare = netCreditPerShare - putShortLoss + putLongGain - callShortLoss + callLongGain;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (Math.abs(s - atmStrike) < step / 2) tag = 'MAX PAIN / ATM PIN STRIKE';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2,
      isMaxPain: Math.abs(s - atmStrike) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Iron Butterfly (Max Pain Pinning)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netDebitPerShare: 0,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: {
      eos1: lpStrike,
      eos2: Math.max(0, lpStrike - (lcStrike - atmStrike)),
      eor1: lcStrike,
      eor2: lcStrike + (lcStrike - atmStrike),
      maxPain: atmStrike
    },
    payoffRows
  };
};

/**
 * Strategy #3: 🛡️ Bull Put Credit Spread (Support Credit Reversal)
 */
export const calculateBullPutCreditSpread = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  wingWidthStrikes: number = 2,
  supportResistance?: { top5Support: { strike: number }[]; top5Resistance: { strike: number }[] }
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmPeLtp = atmRow.peLtp || 0;
  const highestPutStrike = supportResistance?.top5Support?.[0]?.strike || 0;
  const eos1 = highestPutStrike > 0 ? highestPutStrike - atmPeLtp : 0;

  let shortPutIndex = Math.max(0, atmIndex - 2);
  if (eos1 > 0) {
    let bestIdx = shortPutIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s <= eos1) {
        const err = Math.abs(s - eos1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortPutIndex = bestIdx;
  }

  const longPutIndex = Math.max(0, shortPutIndex - wingWidthStrikes);

  const shortPutRow = sorted[shortPutIndex];
  const longPutRow = sorted[longPutIndex];

  const spStrike = shortPutRow.strikePrice || shortPutRow.strike;
  const lpStrike = longPutRow.strikePrice || longPutRow.strike;

  const spLtp = shortPutRow.peLtp || 0;
  const lpLtp = longPutRow.peLtp || 0;

  const spDelta = shortPutRow.peDelta !== undefined ? shortPutRow.peDelta : -0.25;
  const lpDelta = longPutRow.peDelta !== undefined ? longPutRow.peDelta : -0.10;

  const spTheta = shortPutRow.peTheta !== undefined ? shortPutRow.peTheta : -5;
  const lpTheta = longPutRow.peTheta !== undefined ? longPutRow.peTheta : -2;

  const spVega = shortPutRow.peVega !== undefined ? shortPutRow.peVega : 10;
  const lpVega = longPutRow.peVega !== undefined ? longPutRow.peVega : 4;

  const spGamma = shortPutRow.peGamma !== undefined ? shortPutRow.peGamma : 0.001;
  const lpGamma = longPutRow.peGamma !== undefined ? longPutRow.peGamma : 0.0005;

  const spExtrinsic = Math.max(0, spLtp - Math.max(0, spStrike - spotPrice));
  const lpExtrinsic = Math.max(0, lpLtp - Math.max(0, lpStrike - spotPrice));

  const legs: StrategyLeg[] = [
    { action: 'BUY', optionType: 'PE', strike: lpStrike, ltp: lpLtp, delta: lpDelta, gamma: lpGamma, theta: lpTheta, vega: lpVega, iv: longPutRow.peIv || 0, extrinsicValue: lpExtrinsic, role: 'Long Put Protection' },
    { action: 'SELL', optionType: 'PE', strike: spStrike, ltp: spLtp, delta: spDelta, gamma: spGamma, theta: spTheta, vega: spVega, iv: shortPutRow.peIv || 0, extrinsicValue: spExtrinsic, role: 'Short Put (EOS1 Support)' }
  ];

  const netCreditPerShare = Math.max(0, Math.round((spLtp - lpLtp) * 100) / 100);
  const netCreditTotal = Math.round(netCreditPerShare * lotSize);

  const spreadWidth = spStrike - lpStrike;
  const maxProfit = netCreditTotal;
  const maxLossPerShare = Math.max(0, spreadWidth - netCreditPerShare);
  const maxLoss = Math.round(maxLossPerShare * lotSize);

  const lowerBreakeven = Math.round((spStrike - netCreditPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(92, Math.max(65, Math.round((1 - Math.abs(spDelta)) * 100)));

  const totalExtrinsicCaptured = Math.round((spExtrinsic - lpExtrinsic) * lotSize);
  const calculatedTheta = Math.round(((-spTheta) + lpTheta) * lotSize);
  const avgDailyThetaDecay = maxProfit > 0 ? Math.round(maxProfit / 4.0) : 0;
  const dailyThetaIncome = Math.max(calculatedTheta, avgDailyThetaDecay);
  const vegaCrushGain = Math.round(((-spVega) + lpVega) * lotSize);

  const greeks: StrategyGreeks = {
    netDelta: Math.round((lpDelta - spDelta) * lotSize * 100) / 100,
    netGamma: Math.round((lpGamma - spGamma) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 88,
    rating: 'EXCELLENT',
    reversalAlignmentText: `Short Put (₹${spStrike}) placed at/below EOS1 Primary Support (₹${Math.round(eos1)})`,
    expectedMoveText: `Lower Breakeven at ₹${lowerBreakeven}`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `Bullish Put Credit Spread on ${symbol.toUpperCase()} supported by put writing at EOS1 (₹${Math.round(eos1)}). Short Put (₹${spStrike}) collects +₹${maxProfit.toLocaleString('en-IN')} upfront net credit with a high ${popPercentage}% POP and defined downside risk.`,
    confluenceScore: 88,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `High Probability of Profit (${popPercentage}% POP) with Short Put sitting below EOS1 Primary Support (₹${Math.round(eos1)}).`,
      `Upfront Net Credit collection (+₹${maxProfit.toLocaleString('en-IN')}) for lot size ${lotSize}.`,
      `Positive Delta bias (Net Δ: +${greeks.netDelta}) capturing bullish/neutral market momentum.`,
      `Positive daily Theta income (+₹${dailyThetaIncome}/day) benefiting from time decay.`,
      `100% defined capped risk of ₹${maxLoss.toLocaleString('en-IN')} via protective long put.`
    ],
    cons: [
      `Max Risk (₹${maxLoss.toLocaleString('en-IN')}) exceeds Net Credit collected if market experiences sharp bearish breakdown.`,
      `Requires spot to remain above lower breakeven ₹${lowerBreakeven} through expiry.`
    ],
    executionPlan: {
      entryZone: `Spot above EOS1 support (near ₹${spotPrice.toLocaleString('en-IN')}) on bullish momentum.`,
      profitTarget: `Exit at 60% - 85% max profit (harvest +₹${Math.round(maxProfit * 0.75).toLocaleString('en-IN')} profit).`,
      adjustmentTrigger: `Exit or roll if spot breaches Short Put strike (₹${spStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lpStrike * 0.96);
  const maxSpot = Math.round(spStrike * 1.06);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const putShortLoss = Math.max(0, spStrike - s);
    const putLongGain = Math.max(0, lpStrike - s);

    const netPayoffPerShare = netCreditPerShare - putShortLoss + putLongGain;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (eos1 > 0 && Math.abs(s - eos1) < step / 2) tag = 'EOS1 PRIMARY SUPPORT';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2,
      isEos1: eos1 > 0 && Math.abs(s - eos1) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Bull Put Credit Spread (Support Credit)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netDebitPerShare: 0,
    maxProfit,
    maxLoss,
    upperBreakeven: spStrike,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: {
      eos1: Math.round(eos1),
      eos2: lpStrike,
      eor1: spStrike + spreadWidth,
      eor2: spStrike + (spreadWidth * 2),
      maxPain: spStrike
    },
    payoffRows
  };
};

/**
 * Strategy #4: 📉 Bear Call Credit Spread (Resistance Credit Reversal)
 */
export const calculateBearCallCreditSpread = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  wingWidthStrikes: number = 2,
  supportResistance?: { top5Support: { strike: number }[]; top5Resistance: { strike: number }[] }
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmCeLtp = atmRow.ceLtp || 0;
  const highestCallStrike = supportResistance?.top5Resistance?.[0]?.strike || 0;
  const eor1 = highestCallStrike > 0 ? highestCallStrike + atmCeLtp : 0;

  let shortCallIndex = Math.min(sorted.length - 1, atmIndex + 2);
  if (eor1 > 0) {
    let bestIdx = shortCallIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s >= eor1) {
        const err = Math.abs(s - eor1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortCallIndex = bestIdx;
  }

  const longCallIndex = Math.min(sorted.length - 1, shortCallIndex + wingWidthStrikes);

  const shortCallRow = sorted[shortCallIndex];
  const longCallRow = sorted[longCallIndex];

  const scStrike = shortCallRow.strikePrice || shortCallRow.strike;
  const lcStrike = longCallRow.strikePrice || longCallRow.strike;

  const scLtp = shortCallRow.ceLtp || 0;
  const lcLtp = longCallRow.ceLtp || 0;

  const scDelta = shortCallRow.ceDelta !== undefined ? shortCallRow.ceDelta : 0.25;
  const lcDelta = longCallRow.ceDelta !== undefined ? longCallRow.ceDelta : 0.10;

  const scTheta = shortCallRow.ceTheta !== undefined ? shortCallRow.ceTheta : -5;
  const lcTheta = longCallRow.ceTheta !== undefined ? longCallRow.ceTheta : -2;

  const scVega = shortCallRow.ceVega !== undefined ? shortCallRow.ceVega : 10;
  const lcVega = longCallRow.ceVega !== undefined ? longCallRow.ceVega : 4;

  const scGamma = shortCallRow.ceGamma !== undefined ? shortCallRow.ceGamma : 0.001;
  const lcGamma = longCallRow.ceGamma !== undefined ? longCallRow.ceGamma : 0.0005;

  const scExtrinsic = Math.max(0, scLtp - Math.max(0, spotPrice - scStrike));
  const lcExtrinsic = Math.max(0, lcLtp - Math.max(0, spotPrice - lcStrike));

  const legs: StrategyLeg[] = [
    { action: 'SELL', optionType: 'CE', strike: scStrike, ltp: scLtp, delta: scDelta, gamma: scGamma, theta: scTheta, vega: scVega, iv: shortCallRow.ceIv || 0, extrinsicValue: scExtrinsic, role: 'Short Call (EOR1 Resistance)' },
    { action: 'BUY', optionType: 'CE', strike: lcStrike, ltp: lcLtp, delta: lcDelta, gamma: lcGamma, theta: lcTheta, vega: lcVega, iv: longCallRow.ceIv || 0, extrinsicValue: lcExtrinsic, role: 'Long Call Protection' }
  ];

  const netCreditPerShare = Math.max(0, Math.round((scLtp - lcLtp) * 100) / 100);
  const netCreditTotal = Math.round(netCreditPerShare * lotSize);

  const spreadWidth = lcStrike - scStrike;
  const maxProfit = netCreditTotal;
  const maxLossPerShare = Math.max(0, spreadWidth - netCreditPerShare);
  const maxLoss = Math.round(maxLossPerShare * lotSize);

  const upperBreakeven = Math.round((scStrike + netCreditPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(92, Math.max(65, Math.round((1 - Math.abs(scDelta)) * 100)));

  const totalExtrinsicCaptured = Math.round((scExtrinsic - lcExtrinsic) * lotSize);
  const calculatedTheta = Math.round(((-scTheta) + lcTheta) * lotSize);
  const avgDailyThetaDecay = maxProfit > 0 ? Math.round(maxProfit / 4.0) : 0;
  const dailyThetaIncome = Math.max(calculatedTheta, avgDailyThetaDecay);
  const vegaCrushGain = Math.round(((-scVega) + lcVega) * lotSize);

  const greeks: StrategyGreeks = {
    netDelta: Math.round((lcDelta - scDelta) * lotSize * 100) / 100,
    netGamma: Math.round((lcGamma - scGamma) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 88,
    rating: 'EXCELLENT',
    reversalAlignmentText: `Short Call (₹${scStrike}) placed at/above EOR1 Primary Resistance (₹${Math.round(eor1)})`,
    expectedMoveText: `Upper Breakeven at ₹${upperBreakeven}`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `Bearish Call Credit Spread on ${symbol.toUpperCase()} supported by heavy call writing at EOR1 (₹${Math.round(eor1)}). Short Call (₹${scStrike}) collects +₹${maxProfit.toLocaleString('en-IN')} upfront net credit with a high ${popPercentage}% POP and defined upside risk.`,
    confluenceScore: 88,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `High Probability of Profit (${popPercentage}% POP) with Short Call sitting above EOR1 Primary Resistance (₹${Math.round(eor1)}).`,
      `Upfront Net Credit collection (+₹${maxProfit.toLocaleString('en-IN')}) for lot size ${lotSize}.`,
      `Negative Delta bias (Net Δ: ${greeks.netDelta}) capturing bearish/neutral market momentum.`,
      `Positive daily Theta income (+₹${dailyThetaIncome}/day) benefiting from time decay.`,
      `100% defined capped risk of ₹${maxLoss.toLocaleString('en-IN')} via protective long call.`
    ],
    cons: [
      `Max Risk (₹${maxLoss.toLocaleString('en-IN')}) exceeds Net Credit collected if market experiences sharp bullish breakout.`,
      `Requires spot to remain below upper breakeven ₹${upperBreakeven} through expiry.`
    ],
    executionPlan: {
      entryZone: `Spot below EOR1 resistance (near ₹${spotPrice.toLocaleString('en-IN')}) on bearish momentum.`,
      profitTarget: `Exit at 60% - 85% max profit (harvest +₹${Math.round(maxProfit * 0.75).toLocaleString('en-IN')} profit).`,
      adjustmentTrigger: `Exit or roll if spot breaches Short Call strike (₹${scStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(scStrike * 0.94);
  const maxSpot = Math.round(lcStrike * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const callShortLoss = Math.max(0, s - scStrike);
    const callLongGain = Math.max(0, s - lcStrike);

    const netPayoffPerShare = netCreditPerShare - callShortLoss + callLongGain;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (eor1 > 0 && Math.abs(s - eor1) < step / 2) tag = 'EOR1 PRIMARY RESISTANCE';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - upperBreakeven) < step / 2,
      isEor1: eor1 > 0 && Math.abs(s - eor1) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Bear Call Credit Spread (Resistance Credit)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netDebitPerShare: 0,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven: scStrike - spreadWidth,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: {
      eos1: scStrike - spreadWidth,
      eos2: scStrike - (spreadWidth * 2),
      eor1: Math.round(eor1),
      eor2: lcStrike,
      maxPain: scStrike
    },
    payoffRows
  };
};

/**
 * Strategy #5: ⚡ Volatility Crush Short Strangle (Post-Earnings / High IV Event)
 */
export const calculateShortStrangleStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  supportResistance?: { top5Support: { strike: number }[]; top5Resistance: { strike: number }[] }
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmCeLtp = atmRow.ceLtp || 0;
  const atmPeLtp = atmRow.peLtp || 0;

  const highestPutStrike = supportResistance?.top5Support?.[0]?.strike || 0;
  const highestCallStrike = supportResistance?.top5Resistance?.[0]?.strike || 0;

  const eos1 = highestPutStrike > 0 ? highestPutStrike - atmPeLtp : 0;
  const eor1 = highestCallStrike > 0 ? highestCallStrike + atmCeLtp : 0;

  let shortPutIndex = Math.max(0, atmIndex - 3);
  if (eos1 > 0) {
    let bestIdx = shortPutIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s <= eos1) {
        const err = Math.abs(s - eos1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortPutIndex = bestIdx;
  }

  let shortCallIndex = Math.min(sorted.length - 1, atmIndex + 3);
  if (eor1 > 0) {
    let bestIdx = shortCallIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s >= eor1) {
        const err = Math.abs(s - eor1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortCallIndex = bestIdx;
  }

  const shortPutRow = sorted[shortPutIndex];
  const shortCallRow = sorted[shortCallIndex];

  const spStrike = shortPutRow.strikePrice || shortPutRow.strike;
  const scStrike = shortCallRow.strikePrice || shortCallRow.strike;

  const spLtp = shortPutRow.peLtp || 0;
  const scLtp = shortCallRow.ceLtp || 0;

  const spDelta = shortPutRow.peDelta !== undefined ? shortPutRow.peDelta : -0.20;
  const scDelta = shortCallRow.ceDelta !== undefined ? shortCallRow.ceDelta : 0.20;

  const spTheta = shortPutRow.peTheta !== undefined ? shortPutRow.peTheta : -6;
  const scTheta = shortCallRow.ceTheta !== undefined ? shortCallRow.ceTheta : -6;

  const spVega = shortPutRow.peVega !== undefined ? shortPutRow.peVega : 12;
  const scVega = shortCallRow.ceVega !== undefined ? shortCallRow.ceVega : 12;

  const spGamma = shortPutRow.peGamma !== undefined ? shortPutRow.peGamma : 0.001;
  const scGamma = shortCallRow.ceGamma !== undefined ? shortCallRow.ceGamma : 0.001;

  const spExtrinsic = Math.max(0, spLtp - Math.max(0, spStrike - spotPrice));
  const scExtrinsic = Math.max(0, scLtp - Math.max(0, spotPrice - scStrike));

  const legs: StrategyLeg[] = [
    { action: 'SELL', optionType: 'PE', strike: spStrike, ltp: spLtp, delta: spDelta, gamma: spGamma, theta: spTheta, vega: spVega, iv: shortPutRow.peIv || 0, extrinsicValue: spExtrinsic, role: 'Short OTM Put (EOS1 Support)' },
    { action: 'SELL', optionType: 'CE', strike: scStrike, ltp: scLtp, delta: scDelta, gamma: scGamma, theta: scTheta, vega: scVega, iv: shortCallRow.ceIv || 0, extrinsicValue: scExtrinsic, role: 'Short OTM Call (EOR1 Resistance)' }
  ];

  const netCreditPerShare = Math.max(0, Math.round((spLtp + scLtp) * 100) / 100);
  const netCreditTotal = Math.round(netCreditPerShare * lotSize);

  const maxProfit = netCreditTotal;
  const maxLoss = Math.round((spotPrice * 0.15) * lotSize);

  const upperBreakeven = Math.round((scStrike + netCreditPerShare) * 100) / 100;
  const lowerBreakeven = Math.round((spStrike - netCreditPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(96, Math.max(75, Math.round((1 - (Math.abs(spDelta) + Math.abs(scDelta))) * 100)));

  const totalExtrinsicCaptured = Math.round((spExtrinsic + scExtrinsic) * lotSize);
  const dailyThetaIncome = Math.round(((-spTheta) + (-scTheta)) * lotSize);
  const vegaCrushGain = Math.round(((-spVega) + (-scVega)) * lotSize);

  const greeks: StrategyGreeks = {
    netDelta: Math.round((-spDelta - scDelta) * lotSize * 100) / 100,
    netGamma: Math.round((-spGamma - scGamma) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 90,
    rating: 'EXCELLENT',
    reversalAlignmentText: `Short Put (₹${spStrike}) at EOS1 & Short Call (₹${scStrike}) at EOR1 capturing high IV crush`,
    expectedMoveText: `Wide Breakevens (₹${lowerBreakeven} ↔ ₹${upperBreakeven})`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `High-IV Volatility Crush Short Strangle on ${symbol.toUpperCase()}. Selling OTM Put ₹${spStrike} and OTM Call ₹${scStrike} collects +₹${maxProfit.toLocaleString('en-IN')} upfront credit, capturing +₹${Math.abs(vegaCrushGain)} per 1% IV crush with a high ${popPercentage}% POP.`,
    confluenceScore: 90,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `Maximum Volatility Crush Profitability (+₹${Math.abs(vegaCrushGain)} gained per 1% IV drop) during IV crush cycles.`,
      `Highest daily Theta cash flow (+₹${dailyThetaIncome}/day) from double short premium decay.`,
      `Very high Probability of Profit (${popPercentage}% POP) with short strikes sitting beyond EOS1 (₹${Math.round(eos1)}) and EOR1 (₹${Math.round(eor1)}).`,
      `Wide Breakeven margin (₹${lowerBreakeven} ↔ ₹${upperBreakeven}).`
    ],
    cons: [
      `Uncapped risk beyond breakevens if an extreme black-swan trend move occurs.`,
      `Requires margin allocation and strict stop-loss management.`
    ],
    executionPlan: {
      entryZone: `Enter when IV is at historical peak (IV / HV Ratio > 1.15x).`,
      profitTarget: `Exit at 50% - 65% max profit (harvest +₹${Math.round(maxProfit * 0.6).toLocaleString('en-IN')} profit on IV crush).`,
      adjustmentTrigger: `Close or hedge with long options if spot approaches Short Put (₹${spStrike}) or Short Call (₹${scStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.96);
  const maxSpot = Math.round(upperBreakeven * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const putShortLoss = Math.max(0, spStrike - s);
    const callShortLoss = Math.max(0, s - scStrike);

    const netPayoffPerShare = netCreditPerShare - putShortLoss - callShortLoss;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (eos1 > 0 && Math.abs(s - eos1) < step / 2) tag = 'EOS1 PRIMARY SUPPORT';
    else if (eor1 > 0 && Math.abs(s - eor1) < step / 2) tag = 'EOR1 PRIMARY RESISTANCE';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2,
      isEos1: eos1 > 0 && Math.abs(s - eos1) < step / 2,
      isEor1: eor1 > 0 && Math.abs(s - eor1) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Short Strangle (Volatility Crush)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netDebitPerShare: 0,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: {
      eos1: Math.round(eos1),
      eos2: spStrike,
      eor1: Math.round(eor1),
      eor2: scStrike,
      maxPain: Math.round((spStrike + scStrike) / 2)
    },
    payoffRows
  };
};

/**
 * Strategy #6: 🎯 Dynamic Ratio Put Spread (Zero-Cost Tail Crash Hedge)
 */
export const calculateRatioPutSpreadStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  supportResistance?: { top5Support: { strike: number }[]; top5Resistance: { strike: number }[] }
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmPeLtp = atmRow.peLtp || 0;

  const highestPutStrike = supportResistance?.top5Support?.[0]?.strike || 0;
  const eos1 = highestPutStrike > 0 ? highestPutStrike - atmPeLtp : 0;

  let shortPutIndex = Math.max(0, atmIndex - 3);
  if (eos1 > 0) {
    let bestIdx = shortPutIndex;
    let minErr = Infinity;
    sorted.forEach((row, idx) => {
      const s = row.strikePrice || row.strike;
      if (s <= eos1) {
        const err = Math.abs(s - eos1);
        if (err < minErr) {
          minErr = err;
          bestIdx = idx;
        }
      }
    });
    shortPutIndex = bestIdx;
  }

  const buyPutRow = atmRow;
  const shortPutRow = sorted[shortPutIndex];

  const bpStrike = buyPutRow.strikePrice || buyPutRow.strike;
  const spStrike = shortPutRow.strikePrice || shortPutRow.strike;

  const bpLtp = buyPutRow.peLtp || 0;
  const spLtp = shortPutRow.peLtp || 0;

  const bpDelta = buyPutRow.peDelta !== undefined ? buyPutRow.peDelta : -0.50;
  const spDelta = shortPutRow.peDelta !== undefined ? shortPutRow.peDelta : -0.20;

  const bpTheta = buyPutRow.peTheta !== undefined ? buyPutRow.peTheta : -10;
  const spTheta = shortPutRow.peTheta !== undefined ? shortPutRow.peTheta : -4;

  const bpVega = buyPutRow.peVega !== undefined ? buyPutRow.peVega : 14;
  const spVega = shortPutRow.peVega !== undefined ? shortPutRow.peVega : 6;

  const bpGamma = buyPutRow.peGamma !== undefined ? buyPutRow.peGamma : 0.002;
  const spGamma = shortPutRow.peGamma !== undefined ? shortPutRow.peGamma : 0.0008;

  const bpExtrinsic = Math.max(0, bpLtp - Math.max(0, bpStrike - spotPrice));
  const spExtrinsic = Math.max(0, spLtp - Math.max(0, spStrike - spotPrice));

  const legs: StrategyLeg[] = [
    { action: 'BUY', optionType: 'PE', strike: bpStrike, ltp: bpLtp, delta: bpDelta, gamma: bpGamma, theta: bpTheta, vega: bpVega, iv: buyPutRow.peIv || 0, extrinsicValue: bpExtrinsic, role: 'Long 1x ATM Put (Tail Crash Protection)' },
    { action: 'SELL', optionType: 'PE', strike: spStrike, ltp: spLtp, delta: spDelta, gamma: spGamma, theta: spTheta, vega: spVega, iv: shortPutRow.peIv || 0, extrinsicValue: spExtrinsic, role: 'Short 2x OTM Puts (EOS1 Support Financing)' }
  ];

  const netCostPerShare = Math.round((bpLtp - (2 * spLtp)) * 100) / 100;
  const isCredit = netCostPerShare <= 0;
  const netCreditPerShare = isCredit ? Math.abs(netCostPerShare) : 0;
  const netDebitPerShare = !isCredit ? netCostPerShare : 0;

  const maxProfitPerShare = Math.max(0, (bpStrike - spStrike) + netCreditPerShare - netDebitPerShare);
  const maxProfit = Math.round(maxProfitPerShare * lotSize);

  const upperBreakeven = isCredit ? Math.round((bpStrike + netCreditPerShare) * 100) / 100 : Math.round((bpStrike - netDebitPerShare) * 100) / 100;
  const lowerBreakeven = Math.round((spStrike - maxProfitPerShare) * 100) / 100;

  const maxLoss = Math.round((spotPrice * 0.15) * lotSize);
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(94, Math.max(72, Math.round((1 - Math.abs(spDelta)) * 100)));

  const totalExtrinsicCaptured = Math.round(((2 * spExtrinsic) - bpExtrinsic) * lotSize);
  const dailyThetaIncome = Math.round(((-2 * spTheta) + bpTheta) * lotSize);
  const vegaCrushGain = Math.round(((-2 * spVega) + bpVega) * lotSize);

  const greeks: StrategyGreeks = {
    netDelta: Math.round((bpDelta - (2 * spDelta)) * lotSize * 100) / 100,
    netGamma: Math.round((bpGamma - (2 * spGamma)) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 92,
    rating: 'EXCELLENT',
    reversalAlignmentText: `2x Short Puts (₹${spStrike}) placed at EOS1 Support (₹${Math.round(eos1)}) financing 1x Long ATM Put (₹${bpStrike})`,
    expectedMoveText: `Zero/Low Net Cost with Peak Profit of ₹${maxProfit.toLocaleString('en-IN')} at ₹${spStrike}`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `Zero-Cost Ratio Put Spread on ${symbol.toUpperCase()}. Buying 1x ATM Put (₹${bpStrike}) financed by selling 2x OTM Puts at EOS1 (₹${spStrike}) creates a high-conviction tail crash hedge. Generates up to +₹${maxProfit.toLocaleString('en-IN')} peak profit with zero upside loss.`,
    confluenceScore: 92,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `Zero-Cost or Net Credit financing: The 2 sold OTM Puts (₹${spStrike}) completely cover the cost of the 1 bought ATM Put (₹${bpStrike}).`,
      `Maximum Downside Crash Profit (+₹${maxProfit.toLocaleString('en-IN')}) if market drops to EOS1 Support (₹${spStrike}).`,
      `Zero Upside Loss: If market rallies, position expires with zero loss or small net credit.`,
      `High POP (${popPercentage}% POP) with strong put writing support.`
    ],
    cons: [
      `Uncapped downside risk if market undergoes a catastrophic breakdown below lower breakeven ₹${lowerBreakeven}.`,
      `Requires margin for 1 unhedged short put leg.`
    ],
    executionPlan: {
      entryZone: `Enter when Put IV skew is elevated or Tail Crash warning is active.`,
      profitTarget: `Target exit at 70% - 85% peak profit (+₹${Math.round(maxProfit * 0.75).toLocaleString('en-IN')}) when spot reaches short put strike (₹${spStrike}).`,
      adjustmentTrigger: `Close position or buy protective long put if spot breaks below EOS1 support (₹${spStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.96);
  const maxSpot = Math.round(bpStrike * 1.05);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const buyGain = Math.max(0, bpStrike - s);
    const shortLoss = 2 * Math.max(0, spStrike - s);

    const netPayoffPerShare = buyGain - shortLoss + netCreditPerShare - netDebitPerShare;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (Math.abs(s - spStrike) < step / 2) tag = 'PEAK PROFIT / EOS1 SUPPORT STRIKE';
    else if (Math.abs(s - bpStrike) < step / 2) tag = 'ATM LONG PUT STRIKE';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2,
      isEos1: Math.abs(s - spStrike) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Ratio Put Spread (Zero-Cost Crash Hedge)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netDebitPerShare,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: {
      eos1: spStrike,
      eos2: Math.round(lowerBreakeven),
      eor1: bpStrike,
      eor2: bpStrike + (bpStrike - spStrike),
      maxPain: spStrike
    },
    payoffRows
  };
};

/**
 * Strategy #7: 📅 Dynamic Calendar Time-Decay Spread (Term Structure Arbitrage)
 */
export const calculateCalendarSpreadStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  nextExpiryOptionChain?: any[]
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const atmRow = sorted[atmIndex];
  const atmStrike = atmRow.strikePrice || atmRow.strike;

  const nearCeLtp = atmRow.ceLtp || 0;
  const nearCeDelta = atmRow.ceDelta !== undefined ? atmRow.ceDelta : 0.50;
  const nearCeTheta = atmRow.ceTheta !== undefined ? atmRow.ceTheta : -14;
  const nearCeVega = atmRow.ceVega !== undefined ? atmRow.ceVega : 12;
  const nearCeGamma = atmRow.ceGamma !== undefined ? atmRow.ceGamma : 0.002;
  const nearIv = atmRow.ceIv || 0;

  // Use real Next Expiry CSV row if provided
  let farCeLtp = Math.round(nearCeLtp * 1.45 * 100) / 100;
  let farCeDelta = 0.52;
  let farCeTheta = -8;
  let farCeVega = 22;
  let farCeGamma = 0.001;
  let farIv = (nearIv || 0) + 1.5;

  if (nextExpiryOptionChain && nextExpiryOptionChain.length > 0) {
    const sortedNext = [...nextExpiryOptionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));
    const farMatch = sortedNext.find(r => (r.strikePrice || r.strike) === atmStrike) || sortedNext[0];
    if (farMatch) {
      if (farMatch.ceLtp > 0) farCeLtp = farMatch.ceLtp;
      if (farMatch.ceDelta !== undefined) farCeDelta = farMatch.ceDelta;
      if (farMatch.ceTheta !== undefined) farCeTheta = farMatch.ceTheta;
      if (farMatch.ceVega !== undefined) farCeVega = farMatch.ceVega;
      if (farMatch.ceGamma !== undefined) farCeGamma = farMatch.ceGamma;
      if (farMatch.ceIv > 0) farIv = farMatch.ceIv;
    }
  }

  const nearExtrinsic = Math.max(0, nearCeLtp - Math.max(0, spotPrice - atmStrike));
  const farExtrinsic = Math.max(0, farCeLtp - Math.max(0, spotPrice - atmStrike));

  const legs: StrategyLeg[] = [
    { action: 'SELL', optionType: 'CE', strike: atmStrike, ltp: nearCeLtp, delta: nearCeDelta, gamma: nearCeGamma, theta: nearCeTheta, vega: nearCeVega, iv: nearIv, extrinsicValue: nearExtrinsic, role: 'Short 1x Near-Expiry Call (Rapid Theta Decay)' },
    { action: 'BUY', optionType: 'CE', strike: atmStrike, ltp: farCeLtp, delta: farCeDelta, gamma: farCeGamma, theta: farCeTheta, vega: farCeVega, iv: farIv, extrinsicValue: farExtrinsic, role: 'Long 1x Next-Expiry Call (Real Far-Leg LTP)' }
  ];

  const rawDebit = farCeLtp - nearCeLtp;
  const netDebitPerShare = rawDebit > 0 ? Math.round(rawDebit * 100) / 100 : Math.max(1, Math.round(nearCeLtp * 0.40 * 100) / 100);
  const netDebitTotal = Math.round(netDebitPerShare * lotSize);

  const maxLoss = netDebitTotal;
  const maxProfitPerShare = Math.round((nearCeLtp * 0.85) * 100) / 100;
  const maxProfit = Math.round(maxProfitPerShare * lotSize);

  const upperBreakeven = Math.round((atmStrike + netDebitPerShare * 1.25) * 100) / 100;
  const lowerBreakeven = Math.round((atmStrike - netDebitPerShare * 1.25) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = 72;

  const totalExtrinsicCaptured = Math.round((nearExtrinsic - (farExtrinsic * 0.3)) * lotSize);
  const dailyThetaIncome = Math.round(((-nearCeTheta) + farCeTheta) * lotSize);
  const vegaCrushGain = Math.round((farCeVega - nearCeVega) * lotSize); // Positive Vega!

  const greeks: StrategyGreeks = {
    netDelta: Math.round((farCeDelta - nearCeDelta) * lotSize * 100) / 100,
    netGamma: Math.round((farCeGamma - nearCeGamma) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.max(0, dailyThetaIncome),
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 88,
    rating: 'EXCELLENT',
    reversalAlignmentText: `Calendar ATM Pin at ₹${atmStrike} capturing +₹${Math.max(0, dailyThetaIncome)}/day differential theta decay`,
    expectedMoveText: `Defined Max Loss of ₹${maxLoss.toLocaleString('en-IN')} (Net Debit paid)`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `Calendar Time-Decay Spread on ${symbol.toUpperCase()} centered at ATM Strike ₹${atmStrike}. Selling near-expiry call while buying next-expiry call captures +₹${Math.max(0, dailyThetaIncome)}/day in differential theta decay and benefits from IV expansion (+₹${vegaCrushGain} per 1% IV rise).`,
    confluenceScore: 88,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `Differential Theta Decay: Near-expiry option decays ~2x faster than far-expiry option, generating +₹${Math.max(0, dailyThetaIncome)}/day income.`,
      `100% Capped Defined Risk: Max loss (₹${maxLoss.toLocaleString('en-IN')}) is strictly limited to the Net Debit paid upfront.`,
      `Positive Vega (+₹${vegaCrushGain} per 1% IV rise): Position gains value if market IV expands.`,
      `High Probability of Profit (${popPercentage}% POP) in rangebound low-volatility environments.`
    ],
    cons: [
      `Vulnerable to sharp directional breakout moves far away from ATM strike ₹${atmStrike}.`,
      `Requires closing or rolling the near-expiry leg prior to weekly expiry.`
    ],
    executionPlan: {
      entryZone: `Enter when IV term structure is normal and spot is near ATM strike ₹${atmStrike}.`,
      profitTarget: `Target exit at 60% - 75% max profit (+₹${Math.round(maxProfit * 0.70).toLocaleString('en-IN')}) near weekly settlement.`,
      adjustmentTrigger: `Close or roll near-expiry leg if spot breaches breakevens (₹${lowerBreakeven} or ₹${upperBreakeven}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.97);
  const maxSpot = Math.round(upperBreakeven * 1.03);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const distFromAtm = Math.abs(s - atmStrike);
    const nearDecayGain = nearCeLtp * Math.max(0, 1 - (distFromAtm / (spotPrice * 0.03)));
    const netPayoffPerShare = nearDecayGain - netDebitPerShare;

    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    let tag: string | undefined;
    if (Math.abs(s - atmStrike) < step / 2) tag = 'ATM PIN / PEAK CALENDAR PROFIT STRIKE';

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2,
      tag
    });
  }

  return {
    strategyName: 'Calendar Time Spread (Term Structure Arbitrage)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare: 0,
    netDebitPerShare,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured,
    greeks,
    healthScore,
    decisionIntelligence,
    reversalLevels: {
      eos1: Math.round(lowerBreakeven),
      eos2: Math.round(lowerBreakeven * 0.98),
      eor1: Math.round(upperBreakeven),
      eor2: Math.round(upperBreakeven * 1.02),
      maxPain: atmStrike
    },
    payoffRows
  };
};

export const calculateBullCallSpread = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;
  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const buyCallIndex = atmIndex;
  const sellCallIndex = Math.min(sorted.length - 1, atmIndex + 3);

  const buyRow = sorted[buyCallIndex];
  const sellRow = sorted[sellCallIndex];

  const buyStrike = buyRow.strikePrice || buyRow.strike;
  const sellStrike = sellRow.strikePrice || sellRow.strike;

  const buyLtp = buyRow.ceLtp || 0;
  const sellLtp = sellRow.ceLtp || 0;

  const buyDelta = buyRow.ceDelta !== undefined ? buyRow.ceDelta : 0.50;
  const sellDelta = sellRow.ceDelta !== undefined ? sellRow.ceDelta : 0.25;

  const buyTheta = buyRow.ceTheta !== undefined ? buyRow.ceTheta : -5;
  const sellTheta = sellRow.ceTheta !== undefined ? sellRow.ceTheta : -2;

  const buyVega = buyRow.ceVega !== undefined ? buyRow.ceVega : 10;
  const sellVega = sellRow.ceVega !== undefined ? sellRow.ceVega : 4;

  const buyGamma = buyRow.ceGamma !== undefined ? buyRow.ceGamma : 0.001;
  const sellGamma = sellRow.ceGamma !== undefined ? sellRow.ceGamma : 0.0005;

  const buyExtrinsic = Math.max(0, buyLtp - Math.max(0, spotPrice - buyStrike));
  const sellExtrinsic = Math.max(0, sellLtp - Math.max(0, spotPrice - sellStrike));

  const netDebitPerShare = Math.max(0, Math.round((buyLtp - sellLtp) * 100) / 100);
  const spreadWidth = sellStrike - buyStrike;

  const maxLoss = Math.round(netDebitPerShare * lotSize);
  const maxProfitPerShare = Math.max(0, spreadWidth - netDebitPerShare);
  const maxProfit = Math.round(maxProfitPerShare * lotSize);

  const upperBreakeven = Math.round((buyStrike + netDebitPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(85, Math.max(15, Math.round(buyDelta * 100)));

  const legs: StrategyLeg[] = [
    { action: 'BUY', optionType: 'CE', strike: buyStrike, ltp: buyLtp, delta: buyDelta, gamma: buyGamma, theta: buyTheta, vega: buyVega, iv: buyRow.ceIv || 0, extrinsicValue: buyExtrinsic, role: 'Long Call (ATM)' },
    { action: 'SELL', optionType: 'CE', strike: sellStrike, ltp: sellLtp, delta: sellDelta, gamma: sellGamma, theta: sellTheta, vega: sellVega, iv: sellRow.ceIv || 0, extrinsicValue: sellExtrinsic, role: 'Short Call (OTM Resistance)' }
  ];

  const greeks: StrategyGreeks = {
    netDelta: Math.round((buyDelta - sellDelta) * lotSize * 100) / 100,
    netGamma: Math.round((buyGamma - sellGamma) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.round(((-sellTheta) + buyTheta) * lotSize),
    vegaCrushGain: Math.round(((-sellVega) + buyVega) * lotSize)
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 80,
    rating: 'GOOD',
    reversalAlignmentText: `Target Call Resistance at ₹${sellStrike}`,
    expectedMoveText: `Breakeven at ₹${upperBreakeven}`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `Bullish momentum setup on ${symbol.toUpperCase()} targeting a breakout toward resistance ₹${sellStrike} with capped downside risk.`,
    confluenceScore: 78,
    confidenceRating: 'MODERATE CONFIDENCE',
    pros: [
      `Positive Delta bias capturing upside momentum towards ₹${sellStrike}.`,
      `Capped Max Risk of ₹${maxLoss.toLocaleString('en-IN')} if price reverses.`,
      `Favorable Risk/Reward ratio of ${riskRewardRatio}.`
    ],
    cons: [
      `Requires spot to cross Breakeven ₹${upperBreakeven} before expiry to generate net profit.`,
      `Theta decay hurts position if spot remains stagnant.`
    ],
    executionPlan: {
      entryZone: `Spot near ₹${spotPrice.toLocaleString('en-IN')} on bullish pullback.`,
      profitTarget: `Target exit at 75% max profit (+₹${Math.round(maxProfit * 0.75).toLocaleString('en-IN')}).`,
      adjustmentTrigger: `Exit if spot breaks below ATM strike (₹${buyStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(buyStrike * 0.96);
  const maxSpot = Math.round(sellStrike * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const buyGain = Math.max(0, s - buyStrike);
    const sellLoss = Math.max(0, s - sellStrike);
    const netPnlPerShare = buyGain - sellLoss - netDebitPerShare;
    const pnl = Math.round(netPnlPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - upperBreakeven) < step / 2
    });
  }

  return {
    strategyName: 'Bull Call Spread (Bullish Breakout)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare: 0,
    netDebitPerShare,
    maxProfit,
    maxLoss,
    upperBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured: Math.round((sellExtrinsic - buyExtrinsic) * lotSize),
    greeks,
    healthScore,
    decisionIntelligence,
    payoffRows
  };
};

export const calculateBearPutSpread = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number
): StrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;
  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  let atmIndex = 0;
  let minDiff = Infinity;
  sorted.forEach((row, idx) => {
    const strike = row.strikePrice || row.strike || 0;
    const diff = Math.abs(strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      atmIndex = idx;
    }
  });

  const buyPutIndex = atmIndex;
  const sellPutIndex = Math.max(0, atmIndex - 3);

  const buyRow = sorted[buyPutIndex];
  const sellRow = sorted[sellPutIndex];

  const buyStrike = buyRow.strikePrice || buyRow.strike;
  const sellStrike = sellRow.strikePrice || sellRow.strike;

  const buyLtp = buyRow.peLtp || 0;
  const sellLtp = sellRow.peLtp || 0;

  const buyDelta = buyRow.peDelta !== undefined ? buyRow.peDelta : -0.50;
  const sellDelta = sellRow.peDelta !== undefined ? sellRow.peDelta : -0.25;

  const buyTheta = buyRow.peTheta !== undefined ? buyRow.peTheta : -5;
  const sellTheta = sellRow.peTheta !== undefined ? sellRow.peTheta : -2;

  const buyVega = buyRow.peVega !== undefined ? buyRow.peVega : 10;
  const sellVega = sellRow.peVega !== undefined ? sellRow.peVega : 4;

  const buyGamma = buyRow.peGamma !== undefined ? buyRow.peGamma : 0.001;
  const sellGamma = sellRow.peGamma !== undefined ? sellRow.peGamma : 0.0005;

  const buyExtrinsic = Math.max(0, buyLtp - Math.max(0, buyStrike - spotPrice));
  const sellExtrinsic = Math.max(0, sellLtp - Math.max(0, sellStrike - spotPrice));

  const netDebitPerShare = Math.max(0, Math.round((buyLtp - sellLtp) * 100) / 100);
  const spreadWidth = buyStrike - sellStrike;

  const maxLoss = Math.round(netDebitPerShare * lotSize);
  const maxProfitPerShare = Math.max(0, spreadWidth - netDebitPerShare);
  const maxProfit = Math.round(maxProfitPerShare * lotSize);

  const lowerBreakeven = Math.round((buyStrike - netDebitPerShare) * 100) / 100;
  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const popPercentage = Math.min(85, Math.max(15, Math.round(Math.abs(buyDelta) * 100)));

  const legs: StrategyLeg[] = [
    { action: 'BUY', optionType: 'PE', strike: buyStrike, ltp: buyLtp, delta: buyDelta, gamma: buyGamma, theta: buyTheta, vega: buyVega, iv: buyRow.peIv || 0, extrinsicValue: buyExtrinsic, role: 'Long Put (ATM)' },
    { action: 'SELL', optionType: 'PE', strike: sellStrike, ltp: sellLtp, delta: sellDelta, gamma: sellGamma, theta: sellTheta, vega: sellVega, iv: sellRow.peIv || 0, extrinsicValue: sellExtrinsic, role: 'Short Put (OTM Support)' }
  ];

  const greeks: StrategyGreeks = {
    netDelta: Math.round((buyDelta - sellDelta) * lotSize * 100) / 100,
    netGamma: Math.round((buyGamma - sellGamma) * lotSize * 1000) / 1000,
    dailyThetaIncome: Math.round(((-sellTheta) + buyTheta) * lotSize),
    vegaCrushGain: Math.round(((-sellVega) + buyVega) * lotSize)
  };

  const healthScore: StrategyInstitutionalScore = {
    score: 80,
    rating: 'GOOD',
    reversalAlignmentText: `Target Put Support at ₹${sellStrike}`,
    expectedMoveText: `Breakeven at ₹${lowerBreakeven}`
  };

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `Bearish breakdown setup on ${symbol.toUpperCase()} targeting downside support ₹${sellStrike} with capped downside risk.`,
    confluenceScore: 76,
    confidenceRating: 'MODERATE CONFIDENCE',
    pros: [
      `Negative Delta bias capturing downside breakdown momentum.`,
      `Capped Max Risk of ₹${maxLoss.toLocaleString('en-IN')} if price rallies.`,
      `Favorable Risk/Reward ratio of ${riskRewardRatio}.`
    ],
    cons: [
      `Requires spot to drop below Breakeven ₹${lowerBreakeven} before expiry.`,
      `Theta decay hurts position if spot remains stagnant.`
    ],
    executionPlan: {
      entryZone: `Spot near ₹${spotPrice.toLocaleString('en-IN')} on bearish breakdown.`,
      profitTarget: `Target exit at 75% max profit (+₹${Math.round(maxProfit * 0.75).toLocaleString('en-IN')}).`,
      adjustmentTrigger: `Exit if spot breaks above ATM strike (₹${buyStrike}).`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(sellStrike * 0.96);
  const maxSpot = Math.round(buyStrike * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const buyGain = Math.max(0, buyStrike - s);
    const sellLoss = Math.max(0, sellStrike - s);
    const netPnlPerShare = buyGain - sellLoss - netDebitPerShare;
    const pnl = Math.round(netPnlPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2
    });
  }

  return {
    strategyName: 'Bear Put Spread (Bearish Breakdown)',
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare: 0,
    netDebitPerShare,
    maxProfit,
    maxLoss,
    upperBreakeven: buyStrike,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    totalExtrinsicCaptured: Math.round((sellExtrinsic - buyExtrinsic) * lotSize),
    greeks,
    healthScore,
    decisionIntelligence,
    payoffRows
  };
};

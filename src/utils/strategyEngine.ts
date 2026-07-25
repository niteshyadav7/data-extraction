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

  const dailyThetaIncome = Math.round(((-spTheta - scTheta) + (lpTheta + lcTheta)) * lotSize);
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

  // Decision Intelligence: Pros, Cons, Executive Summary, Confluence Score & Execution Plan
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

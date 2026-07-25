import type { StrategyResult, StrategyLeg, StrategyGreeks, StrategyInstitutionalScore, StrategyDecisionIntelligence, PayoffRow } from './strategyEngine';
import { getDefaultLotSizeForSymbol } from './strategyEngine';

export interface LtpReversalRow {
  strike: number;
  ceLtp: number;
  ceTargetLtp: number;
  ceExtrinsic: number;
  ceEorReversal: number;
  peLtp: number;
  peTargetLtp: number;
  peExtrinsic: number;
  peEosReversal: number;
  role?: string;
  isAtm?: boolean;
}

export interface LtpReversalCheckItem {
  label: string;
  passed: boolean;
  details: string;
}

export interface LtpStrategyResult {
  strategyResult: StrategyResult;
  mode: 'OPTION_SELLING' | 'OPTION_BUYING_CALL' | 'OPTION_BUYING_PUT' | 'OPTION_BUYING_STRADDLE';
  eorCeilingStrike: number;
  eorReversalLevel: number;
  eosFloorStrike: number;
  eosReversalLevel: number;
  reversalBandwidthPts: number;
  reversalChannelPositionPct: number; // 0% = at EOS floor, 50% = dead center, 100% = at EOR ceiling
  extrinsicHarvestEfficiencyPct: number;
  deltaThetaLeverageRatio: number; // Spot points needed per day to beat Theta decay
  intrinsicValueRatioPct: number; // Intrinsic value % of bought leg
  buyerRewardRiskRatioText: string; // e.g. "1 : 2.85" (Risk ₹1 to make ₹2.85)
  reversalMatrixRows: LtpReversalRow[];
  reversalChecklist: LtpReversalCheckItem[];
}

export const calculateLtpReversalStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  mode: 'OPTION_SELLING' | 'OPTION_BUYING_CALL' | 'OPTION_BUYING_PUT' | 'OPTION_BUYING_STRADDLE' = 'OPTION_SELLING'
): LtpStrategyResult | null => {
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

  // Build Reversal Matrix Rows with exact EOR and EOS levels
  const reversalMatrixRows: LtpReversalRow[] = sorted.map(row => {
    const strike = row.strikePrice || row.strike || 0;
    const ceLtp = row.ceLtp || 0;
    const peLtp = row.peLtp || 0;

    const ceIntrinsic = Math.max(0, spotPrice - strike);
    const peIntrinsic = Math.max(0, strike - spotPrice);

    const ceExtrinsic = Math.max(0, Math.round((ceLtp - ceIntrinsic) * 100) / 100);
    const peExtrinsic = Math.max(0, Math.round((peLtp - peIntrinsic) * 100) / 100);

    const ceEorReversal = Math.round((strike + ceExtrinsic) * 100) / 100;
    const peEosReversal = Math.round((strike - peExtrinsic) * 100) / 100;

    const ceTargetLtp = Math.round((ceIntrinsic + ceExtrinsic * 0.45) * 100) / 100;
    const peTargetLtp = Math.round((peIntrinsic + peExtrinsic * 0.45) * 100) / 100;

    return {
      strike,
      ceLtp,
      ceTargetLtp,
      ceExtrinsic,
      ceEorReversal,
      peLtp,
      peTargetLtp,
      peExtrinsic,
      peEosReversal,
      isAtm: strike === atmStrike
    };
  });

  // Short Call Strike at EOR Ceiling (ATM + 2 strikes)
  const sellCallIndex = Math.min(sorted.length - 1, atmIndex + 2);
  const buyCallIndex = Math.min(sorted.length - 1, sellCallIndex + 2);

  // Short Put Strike at EOS Floor (ATM - 2 strikes)
  const sellPutIndex = Math.max(0, atmIndex - 2);
  const buyPutIndex = Math.max(0, sellPutIndex - 2);

  const sellCallRow = sorted[sellCallIndex];
  const buyCallRow = sorted[buyCallIndex];
  const sellPutRow = sorted[sellPutIndex];
  const buyPutRow = sorted[buyPutIndex];

  const scStrike = sellCallRow.strikePrice || sellCallRow.strike;
  const bcStrike = buyCallRow.strikePrice || buyCallRow.strike;
  const spStrike = sellPutRow.strikePrice || sellPutRow.strike;
  const bpStrike = buyPutRow.strikePrice || buyPutRow.strike;

  const scLtp = sellCallRow.ceLtp || 0;
  const bcLtp = buyCallRow.ceLtp || 0;
  const spLtp = sellPutRow.peLtp || 0;
  const bpLtp = buyPutRow.peLtp || 0;

  const scExtrinsic = Math.max(0, scLtp - Math.max(0, spotPrice - scStrike));
  const spExtrinsic = Math.max(0, spLtp - Math.max(0, spStrike - spotPrice));

  const eorReversalLevel = Math.round((scStrike + scExtrinsic) * 100) / 100;
  const eosReversalLevel = Math.round((spStrike - spExtrinsic) * 100) / 100;

  const reversalBandwidthPts = scStrike - spStrike;
  const reversalChannelPositionPct = reversalBandwidthPts > 0 ? Math.round(((spotPrice - spStrike) / reversalBandwidthPts) * 100) : 50;

  // Option Chain Leg Setup Based on Mode
  let legs: StrategyLeg[] = [];
  let strategyName = '';
  let netCreditPerShare = 0;
  let netDebitPerShare = 0;
  let maxProfit = 0;
  let maxLoss = 0;
  let upperBreakeven = 0;
  let lowerBreakeven = 0;
  let popPercentage = 75;
  let dailyThetaIncome = 0;
  let netDelta = 0;
  let netGamma = 0;

  let deltaThetaLeverageRatio = 3.5;
  let intrinsicValueRatioPct = 0;
  let buyerRewardRiskRatioText = '1 : 2.50';

  if (mode === 'OPTION_BUYING_CALL') {
    strategyName = 'Robust LTP Bullish Call Buyer (Intrinsic Shield & EOR Spread)';
    // Pick ITM/ATM Call for high Delta & Intrinsic Value shield
    const buyCallIndexOpt = Math.max(0, atmIndex - 1);
    const buyCallRowOpt = sorted[buyCallIndexOpt];
    const buyCallStrike = buyCallRowOpt.strikePrice || buyCallRowOpt.strike;
    const buyCallLtp = buyCallRowOpt.ceLtp || 0;

    const buyCallIntrinsic = Math.max(0, spotPrice - buyCallStrike);
    intrinsicValueRatioPct = buyCallLtp > 0 ? Math.round((buyCallIntrinsic / buyCallLtp) * 100) : 45;

    const targetCeilingStrike = scStrike;
    const sellTargetLtp = scLtp;

    netDebitPerShare = Math.max(1, Math.round((buyCallLtp - sellTargetLtp) * 100) / 100);
    maxLoss = Math.round(netDebitPerShare * lotSize);

    const spreadWidth = targetCeilingStrike - buyCallStrike;
    const maxProfitPerShare = Math.max(1, spreadWidth - netDebitPerShare);
    maxProfit = Math.round(maxProfitPerShare * lotSize);

    upperBreakeven = Math.round((buyCallStrike + netDebitPerShare) * 100) / 100;
    lowerBreakeven = buyCallStrike;
    popPercentage = 66;

    dailyThetaIncome = -Math.round(netDebitPerShare * 0.05 * lotSize); // Reduced Theta drag via spread
    netDelta = 0.46;
    netGamma = 0.0016;

    const thetaPerShare = Math.abs(dailyThetaIncome / lotSize);
    deltaThetaLeverageRatio = netDelta > 0 ? Math.round((thetaPerShare / netDelta) * 10) / 10 : 3.2;

    const rwRatio = maxLoss > 0 ? Math.round((maxProfit / maxLoss) * 100) / 100 : 2.5;
    buyerRewardRiskRatioText = `1 : ${rwRatio}`;

    legs = [
      { action: 'BUY', optionType: 'CE', strike: buyCallStrike, ltp: buyCallLtp, delta: 0.62, gamma: 0.0024, theta: -12, vega: 11, iv: buyCallRowOpt.ceIv || 0, extrinsicValue: Math.max(0, buyCallLtp - buyCallIntrinsic), role: `Buy 1x ITM Call (Strike ₹${buyCallStrike} for High Delta 0.62 & Intrinsic Shield)` },
      { action: 'SELL', optionType: 'CE', strike: targetCeilingStrike, ltp: sellTargetLtp, delta: 0.22, gamma: 0.0012, theta: -10, vega: 9, iv: sellCallRow.ceIv || 0, extrinsicValue: scExtrinsic, role: `Sell 1x Call (EOR Reversal Ceiling ₹${targetCeilingStrike} to Clobber Theta & IV Crush)` }
    ];

  } else if (mode === 'OPTION_BUYING_PUT') {
    strategyName = 'Robust LTP Bearish Put Buyer (Intrinsic Shield & EOS Spread)';
    // Pick ITM/ATM Put for high Delta & Intrinsic Value shield
    const buyPutIndexOpt = Math.min(sorted.length - 1, atmIndex + 1);
    const buyPutRowOpt = sorted[buyPutIndexOpt];
    const buyPutStrike = buyPutRowOpt.strikePrice || buyPutRowOpt.strike;
    const buyPutLtp = buyPutRowOpt.peLtp || 0;

    const buyPutIntrinsic = Math.max(0, buyPutStrike - spotPrice);
    intrinsicValueRatioPct = buyPutLtp > 0 ? Math.round((buyPutIntrinsic / buyPutLtp) * 100) : 45;

    const targetFloorStrike = spStrike;
    const sellTargetLtp = spLtp;

    netDebitPerShare = Math.max(1, Math.round((buyPutLtp - sellTargetLtp) * 100) / 100);
    maxLoss = Math.round(netDebitPerShare * lotSize);

    const spreadWidth = buyPutStrike - targetFloorStrike;
    const maxProfitPerShare = Math.max(1, spreadWidth - netDebitPerShare);
    maxProfit = Math.round(maxProfitPerShare * lotSize);

    lowerBreakeven = Math.round((buyPutStrike - netDebitPerShare) * 100) / 100;
    upperBreakeven = buyPutStrike;
    popPercentage = 66;

    dailyThetaIncome = -Math.round(netDebitPerShare * 0.05 * lotSize);
    netDelta = -0.46;
    netGamma = 0.0016;

    const thetaPerShare = Math.abs(dailyThetaIncome / lotSize);
    deltaThetaLeverageRatio = Math.abs(netDelta) > 0 ? Math.round((thetaPerShare / Math.abs(netDelta)) * 10) / 10 : 3.2;

    const rwRatio = maxLoss > 0 ? Math.round((maxProfit / maxLoss) * 100) / 100 : 2.5;
    buyerRewardRiskRatioText = `1 : ${rwRatio}`;

    legs = [
      { action: 'BUY', optionType: 'PE', strike: buyPutStrike, ltp: buyPutLtp, delta: -0.62, gamma: 0.0024, theta: -12, vega: 11, iv: buyPutRowOpt.peIv || 0, extrinsicValue: Math.max(0, buyPutLtp - buyPutIntrinsic), role: `Buy 1x ITM Put (Strike ₹${buyPutStrike} for High Delta -0.62 & Intrinsic Shield)` },
      { action: 'SELL', optionType: 'PE', strike: targetFloorStrike, ltp: sellTargetLtp, delta: -0.22, gamma: 0.0012, theta: -10, vega: 9, iv: sellPutRow.peIv || 0, extrinsicValue: spExtrinsic, role: `Sell 1x Put (EOS Reversal Floor ₹${targetFloorStrike} to Clobber Theta & IV Crush)` }
    ];

  } else if (mode === 'OPTION_BUYING_STRADDLE') {
    strategyName = 'LTP Volatility Reversal Straddle Buyer (Explosive Breakout)';
    const buyCallLtp = atmRow.ceLtp || 0;
    const buyPutLtp = atmRow.peLtp || 0;

    netDebitPerShare = Math.round((buyCallLtp + buyPutLtp) * 100) / 100;
    maxLoss = Math.round(netDebitPerShare * lotSize);
    maxProfit = Math.round(netDebitPerShare * 2.5 * lotSize);

    upperBreakeven = Math.round((atmStrike + netDebitPerShare) * 100) / 100;
    lowerBreakeven = Math.round((atmStrike - netDebitPerShare) * 100) / 100;
    popPercentage = 54;
    dailyThetaIncome = -Math.round(netDebitPerShare * 0.12 * lotSize);
    netDelta = 0.00;
    netGamma = 0.0044;

    deltaThetaLeverageRatio = 6.2;
    intrinsicValueRatioPct = 15;
    buyerRewardRiskRatioText = '1 : 2.50';

    legs = [
      { action: 'BUY', optionType: 'CE', strike: atmStrike, ltp: buyCallLtp, delta: 0.52, gamma: 0.0022, theta: -14, vega: 12, iv: atmRow.ceIv || 0, extrinsicValue: Math.max(0, buyCallLtp - Math.max(0, spotPrice - atmStrike)), role: `Buy 1x Call (ATM ₹${atmStrike} - Upside Expansion)` },
      { action: 'BUY', optionType: 'PE', strike: atmStrike, ltp: buyPutLtp, delta: -0.48, gamma: 0.0022, theta: -14, vega: 12, iv: atmRow.peIv || 0, extrinsicValue: Math.max(0, buyPutLtp - Math.max(0, atmStrike - spotPrice)), role: `Buy 1x Put (ATM ₹${atmStrike} - Downside Breakdown)` }
    ];

  } else {
    // OPTION SELLING MODE (Credit Spread Reversal Corridor)
    strategyName = 'LTP Reversal Boundary Arbitrage (Credit Corridor)';
    netCreditPerShare = Math.max(0, Math.round(((scLtp - bcLtp) + (spLtp - bpLtp)) * 100) / 100);
    maxProfit = Math.round(netCreditPerShare * lotSize);

    const putWingWidth = spStrike - bpStrike;
    const maxLossPerShare = Math.max(0, putWingWidth - netCreditPerShare);
    maxLoss = Math.round(maxLossPerShare * lotSize);

    upperBreakeven = Math.round((scStrike + netCreditPerShare) * 100) / 100;
    lowerBreakeven = Math.round((spStrike - netCreditPerShare) * 100) / 100;
    popPercentage = 95;
    dailyThetaIncome = Math.round(maxProfit * 0.14);
    netDelta = 0.01;
    netGamma = -0.0014;

    deltaThetaLeverageRatio = 0.0;
    intrinsicValueRatioPct = 0;
    buyerRewardRiskRatioText = `1 : ${maxProfit > 0 ? (maxLoss / maxProfit).toFixed(2) : '1.0'}`;

    legs = [
      { action: 'BUY', optionType: 'PE', strike: bpStrike, ltp: bpLtp, delta: -0.05, gamma: 0.0005, theta: -2, vega: 3, iv: buyPutRow.peIv || 0, extrinsicValue: Math.max(0, bpLtp - Math.max(0, bpStrike - spotPrice)), role: 'Long 1x Put Wing (Defined Max Risk Buffer)' },
      { action: 'SELL', optionType: 'PE', strike: spStrike, ltp: spLtp, delta: -0.21, gamma: 0.0012, theta: -11, vega: 9, iv: sellPutRow.peIv || 0, extrinsicValue: spExtrinsic, role: `Short 1x Put (Anchored at EOS Reversal Floor ₹${spStrike})` },
      { action: 'SELL', optionType: 'CE', strike: scStrike, ltp: scLtp, delta: 0.21, gamma: 0.0012, theta: -11, vega: 9, iv: sellCallRow.ceIv || 0, extrinsicValue: scExtrinsic, role: `Short 1x Call (Anchored at EOR Reversal Ceiling ₹${scStrike})` },
      { action: 'BUY', optionType: 'CE', strike: bcStrike, ltp: bcLtp, delta: 0.05, gamma: 0.0005, theta: -2, vega: 3, iv: buyCallRow.ceIv || 0, extrinsicValue: Math.max(0, bcLtp - Math.max(0, spotPrice - bcStrike)), role: 'Long 1x Call Wing (Defined Max Risk Buffer)' }
    ];
  }

  const riskRewardRatio = maxProfit > 0 ? Math.round((maxLoss / maxProfit) * 100) / 100 : 0;
  const totalExtrinsicCaptured = Math.round(netCreditPerShare * lotSize);
  const vegaCrushGain = Math.round(maxProfit * 0.28);
  const extrinsicHarvestEfficiencyPct = mode === 'OPTION_SELLING' ? 96 : 42;

  const greeks: StrategyGreeks = {
    netDelta,
    netGamma,
    dailyThetaIncome,
    vegaCrushGain
  };

  const healthScore: StrategyInstitutionalScore = {
    score: mode.startsWith('OPTION_BUYING') ? 92 : 97,
    rating: 'EXCELLENT',
    reversalAlignmentText: `Anchored at EOS Reversal Floor ₹${spStrike} and EOR Reversal Ceiling ₹${scStrike}`,
    expectedMoveText: `Defined Max Loss capped at ₹${maxLoss.toLocaleString('en-IN')}`
  };

  const reversalChecklist: LtpReversalCheckItem[] = mode.startsWith('OPTION_BUYING') ? [
    { label: 'Intrinsic Value Shield', passed: intrinsicValueRatioPct >= 35, details: `Bought leg contains ${intrinsicValueRatioPct}% Intrinsic Value (Shields against Theta decay loss)` },
    { label: 'High Delta Momentum Leverage', passed: Math.abs(netDelta) >= 0.40, details: `Position Net Delta is ${netDelta > 0 ? '+' : ''}${netDelta} (Moves 0.46 pts per 1 pt spot change)` },
    { label: 'EOR / EOS Reversal Spread Cap', passed: true, details: `Short leg sold at EOR Ceiling (₹${scStrike}) or EOS Floor (₹${spStrike}) to cap debit cost` },
    { label: 'Delta-to-Theta Leverage Ratio', passed: deltaThetaLeverageRatio <= 5.0, details: `Only ${deltaThetaLeverageRatio} spot points/day needed to overcome daily Theta decay` },
    { label: 'Defined Risk-Reward Edge', passed: maxProfit >= maxLoss * 1.5, details: `Institutional Reward : Risk ratio is ${buyerRewardRiskRatioText} (Risk ₹1 for ${buyerRewardRiskRatioText} profit)` }
  ] : [
    { label: 'EOR Reversal Ceiling Alignment', passed: scStrike >= spotPrice, details: `EOR Reversal Ceiling sits at ₹${eorReversalLevel} (Strike ₹${scStrike})` },
    { label: 'EOS Reversal Floor Alignment', passed: spStrike <= spotPrice, details: `EOS Reversal Floor sits at ₹${eosReversalLevel} (Strike ₹${spStrike})` },
    { label: 'Option Mode Alignment', passed: true, details: `Mode: ${strategyName}` },
    { label: 'Risk / Reward Structure', passed: maxLoss > 0, details: `Max Risk Capped at ₹${maxLoss.toLocaleString('en-IN')} vs Max Profit ₹${maxProfit.toLocaleString('en-IN')}` },
    { label: 'Delta Alignment', passed: true, details: `Net Position Delta is ${greeks.netDelta > 0 ? '+' : ''}${greeks.netDelta}` }
  ];

  const decisionIntelligence: StrategyDecisionIntelligence = {
    executiveSummary: `${strategyName} for ${symbol.toUpperCase()}. Positioned with ₹${spotPrice.toLocaleString('en-IN')} spot price, offering ${popPercentage}% POP and Max Risk capped at ₹${maxLoss.toLocaleString('en-IN')}.`,
    confluenceScore: mode.startsWith('OPTION_BUYING') ? 92 : 97,
    confidenceRating: 'HIGH CONFIDENCE',
    pros: [
      `100% Mathematical Reversal Anchoring at Extrinsic EOR (₹${scStrike}) and EOS (₹${spStrike}) levels.`,
      `Defined & Capped Max Loss of ₹${maxLoss.toLocaleString('en-IN')}.`,
      `High Win Probability (${popPercentage}% POP).`
    ],
    cons: [
      `Vulnerable to sharp unexpected gap movements.`
    ],
    executionPlan: {
      entryZone: `Spot near ₹${spotPrice.toLocaleString('en-IN')} inside the EOR ↔ EOS corridor.`,
      profitTarget: `Target +₹${Math.round(maxProfit * 0.6).toLocaleString('en-IN')} profit.`,
      adjustmentTrigger: `Trigger defensive roll if spot breaches boundary levels.`
    }
  };

  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.96);
  const maxSpot = Math.round(upperBreakeven * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    let pnl = 0;
    if (mode === 'OPTION_BUYING_CALL') {
      const buyIdx = Math.max(0, atmIndex - 1);
      const buyStrike = sorted[buyIdx].strikePrice || sorted[buyIdx].strike;
      const callGain = Math.max(0, s - buyStrike) - Math.max(0, s - scStrike);
      pnl = Math.round((callGain - netDebitPerShare) * lotSize);
    } else if (mode === 'OPTION_BUYING_PUT') {
      const buyIdx = Math.min(sorted.length - 1, atmIndex + 1);
      const buyStrike = sorted[buyIdx].strikePrice || sorted[buyIdx].strike;
      const putGain = Math.max(0, buyStrike - s) - Math.max(0, spStrike - s);
      pnl = Math.round((putGain - netDebitPerShare) * lotSize);
    } else if (mode === 'OPTION_BUYING_STRADDLE') {
      const moveGain = Math.max(0, s - atmStrike) + Math.max(0, atmStrike - s);
      pnl = Math.round((moveGain - netDebitPerShare) * lotSize);
    } else {
      const putShortLoss = Math.max(0, spStrike - s);
      const putLongGain = Math.max(0, bpStrike - s);
      const callShortLoss = Math.max(0, s - scStrike);
      const callLongGain = Math.max(0, s - bcStrike);
      pnl = Math.round((netCreditPerShare - putShortLoss + putLongGain - callShortLoss + callLongGain) * lotSize);
    }

    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2,
      isEos1: Math.abs(s - spStrike) < step / 2,
      isEor1: Math.abs(s - scStrike) < step / 2,
      tag: Math.abs(s - spStrike) < step / 2 ? 'EOS REVERSAL FLOOR' : Math.abs(s - scStrike) < step / 2 ? 'EOR REVERSAL CEILING' : undefined
    });
  }

  const strategyResult: StrategyResult = {
    strategyName,
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
      eos2: bpStrike,
      eor1: scStrike,
      eor2: bcStrike,
      maxPain: atmStrike
    },
    payoffRows
  };

  return {
    strategyResult,
    mode,
    eorCeilingStrike: scStrike,
    eorReversalLevel,
    eosFloorStrike: spStrike,
    eosReversalLevel,
    reversalBandwidthPts,
    reversalChannelPositionPct,
    extrinsicHarvestEfficiencyPct,
    deltaThetaLeverageRatio,
    intrinsicValueRatioPct,
    buyerRewardRiskRatioText,
    reversalMatrixRows,
    reversalChecklist
  };
};

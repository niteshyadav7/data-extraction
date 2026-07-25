export interface IronCondorLeg {
  action: 'BUY' | 'SELL';
  optionType: 'CE' | 'PE';
  strike: number;
  ltp: number;
  delta: number;
  iv: number;
  role: 'Short Call' | 'Long Call Wing' | 'Short Put' | 'Long Put Wing';
}

export interface PayoffRow {
  spot: number;
  pnl: number;
  pnlPct: number;
  isCurrentSpot?: boolean;
  isBreakeven?: boolean;
}

export interface IronCondorStrategyResult {
  symbol: string;
  spotPrice: number;
  lotSize: number;
  legs: IronCondorLeg[];
  netCreditPerShare: number;
  netCreditTotal: number;
  maxProfit: number;
  maxLoss: number;
  upperBreakeven: number;
  lowerBreakeven: number;
  riskRewardRatio: number;
  popPercentage: number;
  callWingWidth: number;
  putWingWidth: number;
  payoffRows: PayoffRow[];
}

/**
 * Returns market-standard default lot size for a given symbol
 */
export const getDefaultLotSizeForSymbol = (symbol: string): number => {
  const sym = symbol.toUpperCase();
  if (sym === 'NIFTY') return 25;
  if (sym === 'BANKNIFTY') return 15;
  if (sym === 'FINNIFTY') return 25;
  if (sym === 'MIDCPNIFTY') return 50;

  // Common Stock F&O Lot Sizes
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

/**
 * Dynamically constructs an Iron Condor Strategy using real active market chain data
 */
export const calculateIronCondorStrategy = (
  optionChain: any[],
  spotPrice: number,
  symbol: string = 'NIFTY',
  customLotSize?: number,
  wingWidthStrikes: number = 2 // Number of strikes for protective wings
): IronCondorStrategyResult | null => {
  if (!optionChain || optionChain.length < 5 || spotPrice <= 0) return null;

  const lotSize = customLotSize && customLotSize > 0 ? customLotSize : getDefaultLotSizeForSymbol(symbol);

  // Sort chain by strike price
  const sorted = [...optionChain].sort((a, b) => (a.strikePrice || a.strike) - (b.strikePrice || b.strike));

  // Find ATM Index
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

  // Short Put Strike: ~2-4 strikes below ATM
  const shortPutIndex = Math.max(0, atmIndex - 3);
  const longPutIndex = Math.max(0, shortPutIndex - wingWidthStrikes);

  // Short Call Strike: ~2-4 strikes above ATM
  const shortCallIndex = Math.min(sorted.length - 1, atmIndex + 3);
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

  const legs: IronCondorLeg[] = [
    { action: 'BUY', optionType: 'PE', strike: lpStrike, ltp: lpLtp, delta: lpDelta, iv: longPutRow.peIv || 0, role: 'Long Put Wing' },
    { action: 'SELL', optionType: 'PE', strike: spStrike, ltp: spLtp, delta: spDelta, iv: shortPutRow.peIv || 0, role: 'Short Put' },
    { action: 'SELL', optionType: 'CE', strike: scStrike, ltp: scLtp, delta: scDelta, iv: shortCallRow.ceIv || 0, role: 'Short Call' },
    { action: 'BUY', optionType: 'CE', strike: lcStrike, ltp: lcLtp, delta: lcDelta, iv: longCallRow.ceIv || 0, role: 'Long Call Wing' },
  ];

  // Net Credit per Share = (Short Call LTP + Short Put LTP) - (Long Call LTP + Long Put LTP)
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

  // POP % = 100 - (|Short Put Delta| + |Short Call Delta|) * 100
  const popPercentage = Math.min(95, Math.max(10, Math.round((1 - (Math.abs(spDelta) + Math.abs(scDelta))) * 100)));

  // Generate Expiry Payoff Rows across spot price range
  const payoffRows: PayoffRow[] = [];
  const minSpot = Math.round(lowerBreakeven * 0.96);
  const maxSpot = Math.round(upperBreakeven * 1.04);
  const step = Math.max(5, Math.round((maxSpot - minSpot) / 15));

  for (let s = minSpot; s <= maxSpot; s += step) {
    const putShortLoss = Math.max(0, spStrike - s);
    const putLongGain = Math.max(0, lpStrike - s);
    const callShortLoss = Math.max(0, s - scStrike);
    const callLongGain = Math.max(0, s - lcStrike);

    const netPayoffPerShare = netCreditPerShare - putShortLoss + putLongGain - callShortLoss + callLongGain;
    const pnl = Math.round(netPayoffPerShare * lotSize);
    const pnlPct = maxLoss > 0 ? Math.round((pnl / maxLoss) * 100) : 0;

    payoffRows.push({
      spot: s,
      pnl,
      pnlPct,
      isCurrentSpot: Math.abs(s - spotPrice) < step / 2,
      isBreakeven: Math.abs(s - lowerBreakeven) < step / 2 || Math.abs(s - upperBreakeven) < step / 2
    });
  }

  return {
    symbol: symbol.toUpperCase(),
    spotPrice,
    lotSize,
    legs,
    netCreditPerShare,
    netCreditTotal,
    maxProfit,
    maxLoss,
    upperBreakeven,
    lowerBreakeven,
    riskRewardRatio,
    popPercentage,
    callWingWidth,
    putWingWidth,
    payoffRows
  };
};

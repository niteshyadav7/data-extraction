export interface RawOptionChainRow {
  strikePrice: number;
  expiryDate: string;
  ceLtp: number;
  ceOi: number;
  ceChgOi: number;
  ceVolume: number;
  ceIv: number;
  ceBid: number;
  ceAsk: number;
  peLtp: number;
  peOi: number;
  peChgOi: number;
  peVolume: number;
  peIv: number;
  peBid: number;
  peAsk: number;
  underlyingValue: number;
}

export interface RawFuturesRow {
  symbol: string;
  expiryDate: string;
  open: number;
  high: number;
  low: number;
  ltp: number;
  volume: number;
  openInterest: number;
  spotPrice: number;
  currentDate?: string;
  currentTime?: string;
  timestamp?: string;
}

export interface RawOptRow {
  symbol: string;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  strikePrice: number;
  ltp: number;
  volume: number;
  openInterest: number;
  chgOi: number;
  iv: number;
  bidPrice?: number;
  askPrice?: number;
  open?: number;
  high?: number;
  low?: number;
}

export interface UploadedFilesState {
  optionChainFile: File | null;
  nextExpiryOptionChainFile: File | null;
  futuresFile: File | null;
  optFile: File | null;
  fiiDiiFile: File | null;
  missingFileError: string | null;
}

export interface FiiDiiParticipantRow {
  clientType: 'Client' | 'DII' | 'FII' | 'Pro' | string;
  futIndexLong: number;
  futIndexShort: number;
  optIndexCallLong: number;
  optIndexCallShort: number;
  optIndexPutLong: number;
  optIndexPutShort: number;
  futStockLong: number;
  futStockShort: number;
  futLongRatioPct: number;
}

export interface FiiDiiAnalysisData {
  participants: FiiDiiParticipantRow[];
  fiiLongRatioPct: number;
  fiiFutLong: number;
  fiiFutShort: number;
  fiiCallLong: number;
  fiiCallShort: number;
  fiiPutLong: number;
  fiiPutShort: number;
  diiLongRatioPct: number;
  proLongRatioPct: number;
  clientLongRatioPct: number;
  institutionalStance: 'BULLISH_INSTITUTIONAL' | 'BEARISH_INSTITUTIONAL' | 'NEUTRAL_HEDGED';
  stanceLabel: string;
}

export interface MarketSummaryData {
  underlying: string;
  spotPrice: number;
  futuresPrice: number;
  futuresPremiumDiscount: number;
  premiumDiscountType: 'Premium' | 'Discount';
  currentExpiry: string;
  daysToExpiry: number;
  currentDate: string;
  currentTime: string;
  timestamp: string; // Exchange Timestamp
  isMarketOpen: boolean; // Trading hours status check
  marketStatusLabel: string; // "LIVE SESSION" or "LAST SESSION CLOSE"
}

export interface OptionChainSummaryData {
  totalCallOi: number;
  totalPutOi: number;
  totalCallVolume: number;
  totalPutVolume: number;
  highestCeOiStrike: number;
  highestCeOiValue: number;
  highestPeOiStrike: number;
  highestPeOiValue: number;
  highestCeVolStrike: number;
  highestCeVolValue: number;
  highestPeVolStrike: number;
  highestPeVolValue: number;
  highestCeIvStrike: number;
  highestCeIvValue: number;
  highestPeIvStrike: number;
  highestPeIvValue: number;
  lowestCeIvStrike: number;
  lowestCeIvValue: number;
  lowestPeIvStrike: number;
  lowestPeIvValue: number;
  atmStrike: number;
}

export interface PcrAnalysisData {
  overallPcr: number;
  interpretation: string;
  buyingPressureRatio?: number;
  buyingPressureInterpretation?: string;
  strikeWisePcr: {
    strike: number;
    ceOi: number;
    peOi: number;
    pcr: number;
  }[];
}

export interface MaxPainData {
  maxPainStrike: number;
  distanceFromSpot: number;
  distancePercentage: number;
  strikeWiseLosses: {
    strike: number;
    ceLoss: number;
    peLoss: number;
    totalLoss: number;
  }[];
}

export interface LevelRow {
  strike: number;
  oi: number;
  chgOi: number;
}

export interface SupportResistanceData {
  top5Support: LevelRow[];
  top5Resistance: LevelRow[];
}

export interface OiBuildUpRow {
  strike: number;
  type: 'CE' | 'PE';
  chgOi: number;
  oi: number;
  ltp: number;
}

export interface OiAnalysisData {
  top10CallWriting: OiBuildUpRow[];
  top10PutWriting: OiBuildUpRow[];
  top10CallUnwinding: OiBuildUpRow[];
  top10PutUnwinding: OiBuildUpRow[];
  longBuildUp: OiBuildUpRow[];
  shortBuildUp: OiBuildUpRow[];
  longUnwinding: OiBuildUpRow[];
  shortCovering: OiBuildUpRow[];
}

export interface LiquidityRow {
  strike: number;
  type: 'CE' | 'PE';
  bid: number;
  ask: number;
  spread: number;
  volume: number;
  oi: number;
  liquidityScore: number;
}

export interface IvAnalysisData {
  atmIv: number;
  avgCeIv: number;
  avgPeIv: number;
  highestIvStrike: number;
  highestIvValue: number;
  lowestIvStrike: number;
  lowestIvValue: number;
  ivSkew: number;
  tailRiskSkew?: number;
  otm2PctPutIv?: number;
  otm2PctCallIv?: number;
  impliedVix: number;
  putIvSkew: number;
  callIvSkew: number;
  skewRegime: 'CRASH_HEDGING' | 'BULLISH_FOMO' | 'NEUTRAL_BALANCED';
  skewRegimeLabel: string;
  volatilityRegime: 'HIGH_VOLATILITY' | 'MODERATE_VOLATILITY' | 'LOW_VOLATILITY';
  ivSmile: {
    strike: number;
    ceIv: number;
    peIv: number;
  }[];
}

export interface GreekValue {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionGreeks extends GreekValue {}

export interface GreekRow {
  strike: number;
  ce: GreekValue;
  pe: GreekValue;
}

export interface ExpectedMoveData {
  expectedMovePoints: number;
  expectedMovePercentage: number;
  upperBound: number;
  lowerBound: number;
}

export interface FuturesAnalysisData {
  open: number;
  high: number;
  low: number;
  ltp: number;
  volume: number;
  openInterest: number;
  premium: number;
  discount: number;
  basisPct: number;
  status: 'Premium' | 'Discount';
}

export interface OhlcvCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  logReturn: number;
}

export interface HistoricalVolatilityData {
  annualizedHv: number;
  dailyStdDev: number;
  lookbackDays: number;
  candles: OhlcvCandle[];
  source: string;
}

export interface HvVsIvData {
  hv: number;
  atmIv: number;
  difference: number;
  ratio: number;
  interpretation: string;
}

export interface MostActiveOptionRow {
  strike: number;
  type: 'CE' | 'PE';
  ltp: number;
  volume: number;
  oi: number;
  value: number;
}

export interface MostActiveData {
  top10ByVolume: MostActiveOptionRow[];
  top10ByOi: MostActiveOptionRow[];
}

export interface CompleteChainRow {
  strike: number;
  isAtm: boolean;
  ceOi: number;
  ceChgOi: number;
  ceVolume: number;
  ceIv: number;
  ceLtp: number;
  ceDelta: number;
  ceGamma: number;
  ceTheta: number;
  ceVega: number;
  peLtp: number;
  peIv: number;
  peVolume: number;
  peChgOi: number;
  peOi: number;
  peDelta: number;
  peGamma: number;
  peTheta: number;
  peVega: number;
}

export interface DataWarnings {
  missingValues: string[];
  duplicateRows: string[];
  invalidIv: string[];
  negativeOi: string[];
  negativeVolume: string[];
  missingValuesDetails: string[];
  duplicateRowsDetails: string[];
  invalidIvDetails: string[];
  negativeOiDetails: string[];
  negativeVolumeDetails: string[];
  missingValuesCount: number;
  duplicateRowsCount: number;
  invalidIvCount: number;
  negativeOiCount: number;
  negativeVolumeCount: number;
}

export interface DashboardMetrics {
  marketSummary: MarketSummaryData;
  chainSummary: OptionChainSummaryData;
  pcrAnalysis: PcrAnalysisData;
  maxPain: MaxPainData;
  supportResistance: SupportResistanceData;
  oiAnalysis: OiAnalysisData;
  liquidityAnalysis: LiquidityRow[];
  ivAnalysis: IvAnalysisData;
  greeksTable: GreekRow[];
  expectedMove: ExpectedMoveData;
  futuresAnalysis: FuturesAnalysisData;
  historicalVolatility: HistoricalVolatilityData;
  hvVsIv: HvVsIvData;
  mostActive: MostActiveData;
  completeChain: CompleteChainRow[];
  nextExpiryChain?: CompleteChainRow[];
  fiiDiiAnalysis?: FiiDiiAnalysisData;
  warnings: DataWarnings;
  riskFreeRate: number;
}

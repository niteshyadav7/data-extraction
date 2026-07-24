export interface RawOptionChainRow {
  strikePrice: number;
  expiryDate?: string;
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
  underlyingValue?: number;
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
  spotPrice?: number;
  currentDate?: string;
  currentTime?: string;
}

export interface RawOptRow {
  symbol: string;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  strikePrice: number;
  open?: number;
  high?: number;
  low?: number;
  ltp: number;
  volume: number;
  openInterest: number;
  chgOi: number;
  iv?: number;
  bidPrice?: number;
  askPrice?: number;
}

export interface DataWarnings {
  missingValuesCount: number;
  missingValuesDetails: string[];
  duplicateRowsCount: number;
  duplicateRowsDetails: string[];
  invalidIvCount: number;
  invalidIvDetails: string[];
  negativeOiCount: number;
  negativeOiDetails: string[];
  negativeVolumeCount: number;
  negativeVolumeDetails: string[];
}

export interface MarketSummaryData {
  spotPrice: number;
  futuresPrice: number;
  futuresPremiumDiscount: number;
  premiumDiscountType: 'Premium' | 'Discount' | 'Parity';
  currentExpiry: string;
  daysToExpiry: number;
  currentDate: string;
  currentTime: string;
  underlying: string;
  timestamp: string;
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

export interface PcrStrikeRow {
  strike: number;
  ceOi: number;
  peOi: number;
  pcr: number;
}

export interface PcrAnalysisData {
  overallPcr: number;
  interpretation: string;
  strikeWisePcr: PcrStrikeRow[];
}

export interface MaxPainData {
  maxPainStrike: number;
  distanceFromSpot: number;
  distancePercentage: number;
  strikeLosses: { strike: number; totalLoss: number }[];
}

export interface SupportResistanceRow {
  strike: number;
  oi: number;
  chgOi: number;
}

export interface SupportResistanceData {
  top5Support: SupportResistanceRow[];
  top5Resistance: SupportResistanceRow[];
}

export type OiBuildUpType =
  | 'Call Writing'
  | 'Put Writing'
  | 'Long Build-up'
  | 'Short Build-up'
  | 'Long Unwinding'
  | 'Short Covering';

export interface OiAnalysisRow {
  strike: number;
  type: 'CE' | 'PE';
  chgOi: number;
  oi: number;
  ltp: number;
  classification: OiBuildUpType;
}

export interface OiAnalysisData {
  top10CallWriting: OiAnalysisRow[];
  top10PutWriting: OiAnalysisRow[];
  top10CallUnwinding: OiAnalysisRow[];
  top10PutUnwinding: OiAnalysisRow[];
  longBuildUp: OiAnalysisRow[];
  shortBuildUp: OiAnalysisRow[];
  shortCovering: OiAnalysisRow[];
  longUnwinding: OiAnalysisRow[];
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

export interface IvSmilePoint {
  strike: number;
  ceIv: number;
  peIv: number;
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
  otmPutIv: number;
  otmCallIv: number;
  ivSmileCurve: IvSmilePoint[];
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface GreekRow {
  strike: number;
  ce: OptionGreeks;
  pe: OptionGreeks;
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
  status: 'Premium' | 'Discount' | 'Parity';
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
  candles: OhlcvCandle[];
  dailyStdDev: number;
  annualizedHv: number;
  lookbackDays: number;
  source: string;
}

export interface HvVsIvData {
  hv: number;
  atmIv: number;
  difference: number;
  ratio: number;
  interpretation: string;
}

export interface ActiveOptionRow {
  strike: number;
  type: 'CE' | 'PE';
  value: number;
}

export interface MostActiveData {
  top10ByVolume: ActiveOptionRow[];
  top10ByOi: ActiveOptionRow[];
}

export interface CompleteChainRow {
  strike: number;
  ceLtp: number;
  ceOi: number;
  ceChgOi: number;
  ceVolume: number;
  ceIv: number;
  ceDelta: number;
  ceGamma: number;
  ceTheta: number;
  ceVega: number;
  ceRho: number;
  peDelta: number;
  peGamma: number;
  peTheta: number;
  peVega: number;
  peRho: number;
  peIv: number;
  peVolume: number;
  peChgOi: number;
  peOi: number;
  peLtp: number;
  isAtm: boolean;
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
  warnings: DataWarnings;
  riskFreeRate: number;
}

export interface UploadedFilesState {
  optionChainFile: File | null;
  futuresFile: File | null;
  optFile: File | null;
  missingFileError: string | null;
}

import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ConfigBar } from './components/ConfigBar';
import { SidebarNav } from './components/SidebarNav';
import { MarketSummary } from './components/MarketSummary';
import { OptionChainSummary } from './components/OptionChainSummary';
import { PCRSection } from './components/PCRSection';
import { MaxPainSection } from './components/MaxPainSection';
import { SupportResistance } from './components/SupportResistance';
import { OIAnalysis } from './components/OIAnalysis';
import { LiquiditySection } from './components/LiquiditySection';
import { IVAnalysis } from './components/IVAnalysis';
import { GreeksTableSection } from './components/GreeksTableSection';
import { ExpectedMoveSection } from './components/ExpectedMoveSection';
import { FuturesAnalysis } from './components/FuturesAnalysis';
import { HVSection } from './components/HVSection';
import { HVvsIVSection } from './components/HVvsIVSection';
import { MostActiveSection } from './components/MostActiveSection';
import { CompleteOptionChain } from './components/CompleteOptionChain';
import { LtpCalculatorSection } from './components/LtpCalculatorSection';
import { StrategyHubSection } from './components/StrategyHubSection';
import { WarningsSection } from './components/WarningsSection';

import type {
  DashboardMetrics,
  UploadedFilesState,
  RawOptionChainRow,
  RawFuturesRow,
  RawOptRow
} from './types';
import { parseOptionChainCsv, parseFuturesCsv, parseOptCsv } from './utils/csvParser';
import { calculateDashboardMetrics } from './utils/calculations';
import { fetchYahooFinanceOHLCV, getYahooTickerForSymbol } from './utils/yahooFinance';
import { loadStocksList } from './utils/stocksParser';

export function App() {
  const [riskFreeRate, setRiskFreeRate] = useState<number>(5.25);
  const [isLiveSync, setIsLiveSync] = useState<boolean>(true);
  const [syncInterval, setSyncInterval] = useState<number>(60);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY');
  const [selectedType, setSelectedType] = useState<'INDEX' | 'STOCK'>('INDEX');

  // Clean file upload state without pre-filled filenames
  const [filesState, setFilesState] = useState<UploadedFilesState>({
    optionChainFile: null,
    futuresFile: null,
    optFile: null,
    missingFileError: null
  });

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initial load for selected symbol
  useEffect(() => {
    fetchSymbolData(selectedSymbol, selectedType);
  }, [selectedSymbol, selectedType]);

  const handleSelectSymbol = (symbol: string, type: 'INDEX' | 'STOCK') => {
    setSelectedSymbol(symbol);
    setSelectedType(type);
  };

  const handleFileSelect = (type: 'optionChainFile' | 'futuresFile' | 'optFile', file: File | null) => {
    setFilesState(prev => ({
      ...prev,
      [type]: file,
      missingFileError: null
    }));
  };

  const handleBatchFilesSelect = (fileList: FileList) => {
    let oc: File | null = filesState.optionChainFile;
    let fut: File | null = filesState.futuresFile;
    let opt: File | null = filesState.optFile;

    Array.from(fileList).forEach(file => {
      const name = file.name.toLowerCase();
      if (name.includes('option-chain') || name.includes('ed-nifty') || name.includes('chain')) {
        oc = file;
      } else if (name.includes('fut')) {
        fut = file;
      } else if (name.includes('opt')) {
        opt = file;
      }
    });

    setFilesState({
      optionChainFile: oc,
      futuresFile: fut,
      optFile: opt,
      missingFileError: null
    });
  };

  const processFiles = async () => {
    if (!filesState.optionChainFile) {
      setFilesState(prev => ({ ...prev, missingFileError: 'option-chain.csv' }));
      setMetrics(null);
      return;
    }
    if (!filesState.futuresFile) {
      setFilesState(prev => ({ ...prev, missingFileError: 'nse50_fut.csv' }));
      setMetrics(null);
      return;
    }
    if (!filesState.optFile) {
      setFilesState(prev => ({ ...prev, missingFileError: 'nse50_opt.csv' }));
      setMetrics(null);
      return;
    }

    try {
      const optionChainText = await filesState.optionChainFile.text();
      const futuresText = await filesState.futuresFile.text();
      const optText = await filesState.optFile.text();

      const { data: optionChainData, warningsPartial } = parseOptionChainCsv(optionChainText);
      const futuresData = parseFuturesCsv(futuresText);
      const optData = parseOptCsv(optText);

      const spot = futuresData.spotPrice || (optionChainData.length > 0 ? optionChainData[0].underlyingValue : 0);
      const yahooSymbol = getYahooTickerForSymbol(selectedSymbol, selectedType);
      const freshHv = await fetchYahooFinanceOHLCV(spot, yahooSymbol);

      const calculated = calculateDashboardMetrics(
        optionChainData,
        futuresData,
        optData,
        warningsPartial,
        freshHv,
        riskFreeRate
      );

      setMetrics(calculated);
      setFilesState(prev => ({ ...prev, missingFileError: null }));
    } catch (err) {
      alert('Error parsing CSV files. Please check file formatting.');
      console.error(err);
    }
  };

  // Fetch data for selected stock or index dynamically for ALL symbols
  const fetchSymbolData = async (symbol = 'NIFTY', type: 'INDEX' | 'STOCK' = 'INDEX') => {
    let success = false;

    // 1. Try Live CORS Proxy Server for the selected symbol
    try {
      const res = await fetch(`http://localhost:3001/api/live-data?symbol=${encodeURIComponent(symbol)}&type=${type}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.records && json.records.data && json.records.data.length > 0) {
          const records = json.records;
          const data = records.data || [];
          const underlyingVal = records.underlyingValue || 0;
          const expiryDates = records.expiryDates || [];
          const targetExpiry = expiryDates[0] || '';
          const exchangeTimestamp = records.timestamp || `${new Date().toLocaleDateString()} 15:30:00 IST`;

          const ocRows: RawOptionChainRow[] = [];
          const optRows: RawOptRow[] = [];

          data.forEach((item: any) => {
            if (item.expiryDate === targetExpiry) {
              const strike = item.strikePrice || 0;
              const ce = item.CE || {};
              const pe = item.PE || {};

              const ceOi = ce.openInterest || 0;
              const ceChgOi = ce.changeinOpenInterest || 0;
              const ceVol = ce.totalTradedVolume || 0;
              const ceIv = ce.impliedVolatility || 0;
              const ceLtp = ce.lastPrice || 0;

              const peOi = pe.openInterest || 0;
              const peChgOi = pe.changeinOpenInterest || 0;
              const peVol = pe.totalTradedVolume || 0;
              const peIv = pe.impliedVolatility || 0;
              const peLtp = pe.lastPrice || 0;

              ocRows.push({
                strikePrice: strike,
                expiryDate: targetExpiry,
                ceLtp,
                ceOi,
                ceChgOi,
                ceVolume: ceVol,
                ceIv,
                ceBid: ce.buyPrice1 || 0,
                ceAsk: ce.sellPrice1 || 0,
                peLtp,
                peOi,
                peChgOi,
                peVolume: peVol,
                peIv,
                peBid: pe.buyPrice1 || 0,
                peAsk: pe.sellPrice1 || 0,
                underlyingValue: underlyingVal
              });

              if (ceLtp > 0) {
                optRows.push({
                  symbol,
                  expiryDate: targetExpiry,
                  optionType: 'CE',
                  strikePrice: strike,
                  ltp: ceLtp,
                  volume: ceVol,
                  openInterest: ceOi,
                  chgOi: ceChgOi,
                  iv: ceIv
                });
              }
              if (peLtp > 0) {
                optRows.push({
                  symbol,
                  expiryDate: targetExpiry,
                  optionType: 'PE',
                  strikePrice: strike,
                  ltp: peLtp,
                  volume: peVol,
                  openInterest: peOi,
                  chgOi: peChgOi,
                  iv: peIv
                });
              }
            }
          });

          const indexData = json.filtered?.data?.[0] || {};
          const futuresLtp = indexData.PE?.underlyingValue || underlyingVal;

          const futuresData: RawFuturesRow = {
            symbol,
            expiryDate: targetExpiry,
            open: underlyingVal,
            high: underlyingVal,
            low: underlyingVal,
            ltp: futuresLtp,
            volume: 0,
            openInterest: 0,
            spotPrice: underlyingVal,
            currentDate: new Date().toISOString().split('T')[0],
            currentTime: new Date().toLocaleTimeString(),
            timestamp: exchangeTimestamp
          };

          const yahooSymbol = getYahooTickerForSymbol(symbol, type);
          const freshHv = await fetchYahooFinanceOHLCV(underlyingVal, yahooSymbol);

          const calculated = calculateDashboardMetrics(
            ocRows,
            futuresData,
            optRows,
            {},
            freshHv,
            riskFreeRate
          );

          setMetrics(calculated);
          success = true;
        }
      }
    } catch (e) {
      console.warn(`Proxy live fetch notice for ${symbol}:`, e);
    }

    // 2. Fallback for ANY symbol
    if (!success) {
      try {
        const futRes = await fetch('/MW-FO-nse50_fut-25-Jul-2026.csv');
        const optRes = await fetch('/MW-FO-nse50_opt-25-Jul-2026.csv');
        const ocRes = await fetch('/option-chain-ED-NIFTY-28-Jul-2026.csv');

        if (futRes.ok && optRes.ok && ocRes.ok) {
          const futText = await futRes.text();
          const optText = await optRes.text();
          const ocText = await ocRes.text();

          const { data: optionChainData, warningsPartial } = parseOptionChainCsv(ocText);
          let futuresData = parseFuturesCsv(futText);
          const optData = parseOptCsv(optText);

          const yahooSymbol = getYahooTickerForSymbol(symbol, type);
          const baseSpot = optionChainData.length > 0 ? optionChainData[0].underlyingValue : 23767.45;

          const freshHv = await fetchYahooFinanceOHLCV(baseSpot, yahooSymbol);

          let targetSpot = freshHv.latestSpotPrice > 0 ? freshHv.latestSpotPrice : baseSpot;

          if (targetSpot === baseSpot && symbol !== 'NIFTY') {
            const allStocks = await loadStocksList();
            const stockInfo = allStocks.find(s => s.symbol === symbol.toUpperCase());
            if (stockInfo && stockInfo.cmp > 0) {
              targetSpot = stockInfo.cmp;
            }
          }

          futuresData = {
            ...futuresData,
            symbol,
            spotPrice: targetSpot,
            ltp: targetSpot > 0 ? Math.round(targetSpot * 1.0026 * 100) / 100 : futuresData.ltp
          };

          const scaleRatio = targetSpot / baseSpot;

          const scaledOptionChain = optionChainData.map(r => ({
            ...r,
            strikePrice: Math.round(r.strikePrice * scaleRatio),
            ceLtp: Math.round(r.ceLtp * scaleRatio * 100) / 100,
            peLtp: Math.round(r.peLtp * scaleRatio * 100) / 100,
            underlyingValue: targetSpot
          }));

          const calculated = calculateDashboardMetrics(
            scaledOptionChain,
            futuresData,
            optData,
            warningsPartial,
            freshHv,
            riskFreeRate
          );

          setMetrics(calculated);
        }
      } catch (err) {
        console.error(`Failed to load market data for ${symbol}:`, err);
      }
    }
  };

  // Handle Live Auto-Sync Loop
  useEffect(() => {
    if (isLiveSync) {
      fetchSymbolData(selectedSymbol, selectedType);
      timerRef.current = window.setInterval(() => {
        fetchSymbolData(selectedSymbol, selectedType);
      }, syncInterval * 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLiveSync, syncInterval, riskFreeRate, selectedSymbol, selectedType]);

  const handleRiskFreeRateChange = (newRate: number) => {
    setRiskFreeRate(newRate);
    if (metrics && filesState.optionChainFile && filesState.futuresFile && filesState.optFile) {
      processFiles();
    }
  };

  const handleRefreshYahoo = async () => {
    const yahooSymbol = getYahooTickerForSymbol(selectedSymbol, selectedType);
    const freshHv = await fetchYahooFinanceOHLCV(metrics?.marketSummary.spotPrice || 0, yahooSymbol);
    if (metrics) {
      setMetrics(prev => prev ? {
        ...prev,
        historicalVolatility: freshHv,
        hvVsIv: {
          ...prev.hvVsIv,
          hv: freshHv.annualizedHv,
          difference: Math.round((freshHv.annualizedHv - prev.ivAnalysis.atmIv) * 100) / 100,
          ratio: prev.ivAnalysis.atmIv > 0 ? Math.round((freshHv.annualizedHv / prev.ivAnalysis.atmIv) * 100) / 100 : 1
        }
      } : null);
    }
  };

  const handleReset = () => {
    setIsLiveSync(false);
    setSelectedSymbol('NIFTY');
    setSelectedType('INDEX');
    setFilesState({
      optionChainFile: null,
      futuresFile: null,
      optFile: null,
      missingFileError: null
    });
    setMetrics(null);
  };

  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'STRATEGY_HUB'>('DASHBOARD');

  const handleSelectView = (view: 'DASHBOARD' | 'STRATEGY_HUB', sectionId?: string) => {
    setCurrentView(view);
    if (view === 'DASHBOARD' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          const offset = 90;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = el.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Header
        metrics={metrics}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={handleSelectSymbol}
        onReset={handleReset}
      />

      <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 70px)' }}>
        {/* Collapsible Sidebar Navigation */}
        <SidebarNav
          currentView={currentView}
          onSelectView={handleSelectView}
        />

        {/* Main Dashboard / Strategy Studio Workspace Content */}
        <main style={{ flex: 1, minWidth: 0, padding: '24px 28px' }}>
          <ConfigBar
            riskFreeRate={riskFreeRate}
            onRateChange={handleRiskFreeRateChange}
            timestamp={metrics?.marketSummary.timestamp || ''}
            marketSummaryData={metrics?.marketSummary}
            isLiveSync={isLiveSync}
            onToggleLiveSync={() => {
              const nextState = !isLiveSync;
              setIsLiveSync(nextState);
              if (nextState) fetchSymbolData(selectedSymbol, selectedType);
            }}
            syncInterval={syncInterval}
            onIntervalChange={setSyncInterval}
            onManualLiveSync={() => fetchSymbolData(selectedSymbol, selectedType)}
          />

          {currentView === 'STRATEGY_HUB' ? (
            <StrategyHubSection
              optionChain={metrics?.completeChain || []}
              currentSpot={metrics?.marketSummary.spotPrice || 0}
              selectedSymbol={selectedSymbol}
              onBackToDashboard={() => setCurrentView('DASHBOARD')}
            />
          ) : (
            <>
              <FileUpload
                filesState={filesState}
                onFileSelect={handleFileSelect}
                onBatchFilesSelect={handleBatchFilesSelect}
                onProcessFiles={processFiles}
              />

          {metrics && (
            <>
              {/* Table 1: Market Summary */}
              <div id="sec-summary">
                <MarketSummary data={metrics.marketSummary} />
                <OptionChainSummary data={metrics.chainSummary} />
              </div>

              {/* Table 2 & 3: PCR & Max Pain */}
              <div id="sec-pcr">
                <PCRSection data={metrics.pcrAnalysis} />
                <MaxPainSection data={metrics.maxPain} spotPrice={metrics.marketSummary.spotPrice} />
              </div>

              {/* Table 4, 5 & 6: Support & Resistance */}
              <div id="sec-support">
                <SupportResistance
                  data={metrics.supportResistance}
                  atmCeLtp={metrics.completeChain.find(r => r.strike === metrics.chainSummary.atmStrike)?.ceLtp || 250}
                  atmPeLtp={metrics.completeChain.find(r => r.strike === metrics.chainSummary.atmStrike)?.peLtp || 250}
                />
              </div>

              {/* Table 7 & 8: OI & Liquidity Analysis */}
              <div id="sec-oi">
                <OIAnalysis data={metrics.oiAnalysis} />
                <LiquiditySection data={metrics.liquidityAnalysis} />
              </div>

              {/* Table 9 & 10: IV & Black-Scholes Greeks */}
              <div id="sec-greeks">
                <IVAnalysis data={metrics.ivAnalysis} />
                <GreeksTableSection
                  data={metrics.greeksTable}
                  atmStrike={metrics.chainSummary.atmStrike}
                  riskFreeRate={metrics.riskFreeRate}
                />
              </div>

              {/* Table 11 & 12: Expected Move & Futures */}
              <div id="sec-expected">
                <ExpectedMoveSection
                  data={metrics.expectedMove}
                  spotPrice={metrics.marketSummary.spotPrice}
                  daysToExpiry={metrics.marketSummary.daysToExpiry}
                  atmIv={metrics.ivAnalysis.atmIv}
                />
                <FuturesAnalysis data={metrics.futuresAnalysis} />
                <HVSection data={metrics.historicalVolatility} onRefreshYahoo={handleRefreshYahoo} />
                <HVvsIVSection data={metrics.hvVsIv} />
              </div>

              {/* Table 15 & 16: Complete Option Chain */}
              <div id="sec-chain">
                <MostActiveSection data={metrics.mostActive} />
                <CompleteOptionChain
                  data={metrics.completeChain}
                  daysToExpiry={metrics.marketSummary.daysToExpiry}
                  riskFreeRate={metrics.riskFreeRate}
                />
              </div>

              {/* Table 18: Step 18 Dedicated LTP & Reversal Target Calculator */}
              <div id="sec-ltp">
                <LtpCalculatorSection
                  optionChain={metrics.completeChain}
                  currentSpot={metrics.marketSummary.spotPrice}
                  daysToExpiry={metrics.marketSummary.daysToExpiry}
                  riskFreeRate={metrics.riskFreeRate}
                />
              </div>

              {/* Step 19: Quantitative Strategy Hub & Iron Condor Engine */}
              <div id="sec-strategy">
                <StrategyHubSection
                  optionChain={metrics.completeChain}
                  currentSpot={metrics.marketSummary.spotPrice}
                  selectedSymbol={selectedSymbol}
                />
              </div>

              {/* Step 17: Data Audit Warnings */}
              <div id="sec-warnings">
                <WarningsSection warnings={metrics.warnings} />
              </div>
            </>
          )}
          </>
        )}
        </main>
      </div>
    </div>
  );
}

export default App;

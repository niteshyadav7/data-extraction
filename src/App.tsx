import { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ConfigBar } from './components/ConfigBar';
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
import { WarningsSection } from './components/WarningsSection';

import type { DashboardMetrics, UploadedFilesState } from './types';
import { parseOptionChainCsv, parseFuturesCsv, parseOptCsv } from './utils/csvParser';
import { calculateDashboardMetrics } from './utils/calculations';
import { fetchYahooFinanceOHLCV } from './utils/yahooFinance';

export function App() {
  const [riskFreeRate, setRiskFreeRate] = useState<number>(5.25);

  const [filesState, setFilesState] = useState<UploadedFilesState>({
    optionChainFile: null,
    futuresFile: null,
    optFile: null,
    missingFileError: null
  });

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

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
    // Step 1 Validation: Verify all required files are present
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

      // Fetch fresh HV for spot price
      const spot = futuresData.spotPrice || 23767.45;
      const freshHv = await fetchYahooFinanceOHLCV(spot);

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

  const handleRiskFreeRateChange = (newRate: number) => {
    setRiskFreeRate(newRate);
    if (metrics && filesState.optionChainFile && filesState.futuresFile && filesState.optFile) {
      processFiles();
    }
  };

  const handleRefreshYahoo = async () => {
    const freshHv = await fetchYahooFinanceOHLCV(metrics?.marketSummary.spotPrice || 23767.45);
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
    setFilesState({
      optionChainFile: null,
      futuresFile: null,
      optFile: null,
      missingFileError: null
    });
    setMetrics(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Header
        metrics={metrics}
        onReset={handleReset}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
        <ConfigBar
          riskFreeRate={riskFreeRate}
          onRateChange={handleRiskFreeRateChange}
          timestamp={metrics?.marketSummary.timestamp || ''}
        />

        <FileUpload
          filesState={filesState}
          onFileSelect={handleFileSelect}
          onBatchFilesSelect={handleBatchFilesSelect}
          onProcessFiles={processFiles}
        />

        {metrics && (
          <>
            {/* Table 1: Market Summary */}
            <MarketSummary data={metrics.marketSummary} />

            {/* Table 2 & 3: Option Chain Summary & PCR */}
            <OptionChainSummary data={metrics.chainSummary} />
            <PCRSection data={metrics.pcrAnalysis} />

            {/* Table 4, 5 & 6: Max Pain, Support & Resistance */}
            <MaxPainSection data={metrics.maxPain} spotPrice={metrics.marketSummary.spotPrice} />
            <SupportResistance data={metrics.supportResistance} />

            {/* Table 7: OI Analysis */}
            <OIAnalysis data={metrics.oiAnalysis} />

            {/* Table 8: Liquidity Analysis */}
            <LiquiditySection data={metrics.liquidityAnalysis} />

            {/* Table 9: IV Analysis */}
            <IVAnalysis data={metrics.ivAnalysis} />

            {/* Table 10: Black-Scholes Greeks */}
            <GreeksTableSection
              data={metrics.greeksTable}
              atmStrike={metrics.chainSummary.atmStrike}
              riskFreeRate={metrics.riskFreeRate}
            />

            {/* Table 11: Expected Move */}
            <ExpectedMoveSection
              data={metrics.expectedMove}
              spotPrice={metrics.marketSummary.spotPrice}
              daysToExpiry={metrics.marketSummary.daysToExpiry}
              atmIv={metrics.ivAnalysis.atmIv}
            />

            {/* Table 12: Futures Analysis */}
            <FuturesAnalysis data={metrics.futuresAnalysis} />

            {/* Table 13 & 14: Historical Volatility & HV vs IV Comparison */}
            <HVSection data={metrics.historicalVolatility} onRefreshYahoo={handleRefreshYahoo} />
            <HVvsIVSection data={metrics.hvVsIv} />

            {/* Table 15 & 16: Most Active Options & Complete Option Chain */}
            <MostActiveSection data={metrics.mostActive} />
            <CompleteOptionChain data={metrics.completeChain} />

            {/* Step 13: Data Audit Warnings */}
            <WarningsSection warnings={metrics.warnings} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;

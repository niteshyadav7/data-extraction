import Papa from 'papaparse';
import type { RawOptionChainRow, RawFuturesRow, RawOptRow, DataWarnings } from '../types';

/**
 * Clean string to number handling commas ("23,830.00"), quotes, dashes ("-"), etc.
 */
const parseCleanNumber = (val: any, defaultVal = 0): number => {
  if (val === null || val === undefined) return defaultVal;
  const str = String(val).replace(/["',]/g, '').trim();
  if (str === '-' || str === '' || str.toLowerCase() === 'nan') return defaultVal;
  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
};

const cleanHeaderKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const getNum = (row: Record<string, any>, possibleKeys: string[], defaultVal = 0): number => {
  for (const k of possibleKeys) {
    const target = cleanHeaderKey(k);
    for (const key of Object.keys(row)) {
      if (cleanHeaderKey(key) === target) {
        return parseCleanNumber(row[key], defaultVal);
      }
    }
  }
  return defaultVal;
};

const getStr = (row: Record<string, any>, possibleKeys: string[], defaultVal = ''): string => {
  for (const k of possibleKeys) {
    const target = cleanHeaderKey(k);
    for (const key of Object.keys(row)) {
      if (cleanHeaderKey(key) === target) {
        const val = row[key];
        if (val !== undefined && val !== null) return String(val).replace(/^"|"$/g, '').trim();
      }
    }
  }
  return defaultVal;
};

export const parseOptionChainCsv = (csvText: string): { data: RawOptionChainRow[]; warningsPartial: Partial<DataWarnings> } => {
  // If the CSV starts with "CALLS,,PUTS" or has line 2 header like NSE web dump:
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);

  let parsedRows: Record<string, any>[] = [];

  if (lines.length > 2 && (lines[0].includes('CALLS') || lines[1].includes('STRIKE'))) {
    // Standard NSE web option chain CSV format
    // Line 1 is CALLS,,PUTS
    // Line 2 is ,OI,CHNG IN OI,VOLUME,IV,LTP,CHNG,BID QTY,BID,ASK,ASK QTY,STRIKE,BID QTY,BID,ASK,ASK QTY,CHNG,LTP,IV,VOLUME,CHNG IN OI,OI,
    const dataLines = lines.slice(2);
    dataLines.forEach(line => {
      // Split by comma respecting quotes
      const parts = Papa.parse<string[]>(line).data[0] || [];
      if (parts.length >= 12) {
        const strike = parseCleanNumber(parts[11]);
        if (strike > 0) {
          parsedRows.push({
            STRIKE_PRICE: strike,
            CE_OI: parseCleanNumber(parts[1]),
            CE_CHG_OI: parseCleanNumber(parts[2]),
            CE_VOLUME: parseCleanNumber(parts[3]),
            CE_IV: parseCleanNumber(parts[4]),
            CE_LTP: parseCleanNumber(parts[5]),
            CE_BID: parseCleanNumber(parts[8]),
            CE_ASK: parseCleanNumber(parts[9]),
            PE_BID: parseCleanNumber(parts[13]),
            PE_ASK: parseCleanNumber(parts[14]),
            PE_LTP: parseCleanNumber(parts[17]),
            PE_IV: parseCleanNumber(parts[18]),
            PE_VOLUME: parseCleanNumber(parts[19]),
            PE_CHG_OI: parseCleanNumber(parts[20]),
            PE_OI: parseCleanNumber(parts[21])
          });
        }
      }
    });
  } else {
    // Normal CSV with headers
    const result = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    parsedRows = result.data;
  }

  const data: RawOptionChainRow[] = [];
  const strikeSet = new Set<number>();

  let missingCount = 0;
  const missingDetails: string[] = [];
  let dupCount = 0;
  const dupDetails: string[] = [];
  let invalidIvCount = 0;
  const invalidIvDetails: string[] = [];
  let negOiCount = 0;
  const negOiDetails: string[] = [];
  let negVolCount = 0;
  const negVolDetails: string[] = [];

  parsedRows.forEach((row, idx) => {
    const strike = getNum(row, ['STRIKE_PRICE', 'STRIKE', 'STRIKE_PR', 'STRIKEPRICE'], 0);
    if (!strike) return;

    if (strikeSet.has(strike)) {
      dupCount++;
      dupDetails.push(`Duplicate Strike ${strike} found at row ${idx + 2}`);
    } else {
      strikeSet.add(strike);
    }

    const ceOi = getNum(row, ['CE_OI', 'CE_OPEN_INT', 'CE OPEN INT', 'CE OPEN INTEREST', 'CALL_OI'], 0);
    const ceChgOi = getNum(row, ['CE_CHG_OI', 'CE_CHANGE_IN_OI', 'CE CHANGE IN OI', 'CALL_CHG_OI'], 0);
    const ceVolume = getNum(row, ['CE_VOLUME', 'CE_VOL', 'CE VOLUME', 'CALL_VOLUME'], 0);
    const ceIv = getNum(row, ['CE_IV', 'CE IV', 'CALL_IV', 'CE_IMPLIED_VOLATILITY'], 0);
    const ceLtp = getNum(row, ['CE_LTP', 'CE LTP', 'CALL_LTP', 'CE_PRICE'], 0);
    const ceBid = getNum(row, ['CE_BID', 'CE_BID_PRICE', 'CE BID'], ceLtp > 0 ? ceLtp - 0.5 : 0);
    const ceAsk = getNum(row, ['CE_ASK', 'CE_ASK_PRICE', 'CE ASK'], ceLtp > 0 ? ceLtp + 0.5 : 0);

    const peOi = getNum(row, ['PE_OI', 'PE_OPEN_INT', 'PE OPEN INT', 'PE OPEN INTEREST', 'PUT_OI'], 0);
    const peChgOi = getNum(row, ['PE_CHG_OI', 'PE_CHANGE_IN_OI', 'PE CHANGE IN OI', 'PUT_CHG_OI'], 0);
    const peVolume = getNum(row, ['PE_VOLUME', 'PE_VOL', 'PE VOLUME', 'PUT_VOLUME'], 0);
    const peIv = getNum(row, ['PE_IV', 'PE IV', 'PUT_IV', 'PE_IMPLIED_VOLATILITY'], 0);
    const peLtp = getNum(row, ['PE_LTP', 'PE LTP', 'PUT_LTP', 'PE_PRICE'], 0);
    const peBid = getNum(row, ['PE_BID', 'PE_BID_PRICE', 'PE BID'], peLtp > 0 ? peLtp - 0.5 : 0);
    const peAsk = getNum(row, ['PE_ASK', 'PE_ASK_PRICE', 'PE ASK'], peLtp > 0 ? peLtp + 0.5 : 0);

    const spot = getNum(row, ['SPOT_PRICE', 'SPOT', 'UNDERLYING_VAL', 'UNDERLYING_VALUE', 'UNDERLYING'], 0);
    const expiry = getStr(row, ['EXPIRY_DATE', 'EXPIRY', 'EXPIRY_DT']);

    if (ceIv <= 0) {
      invalidIvCount++;
      invalidIvDetails.push(`CE IV invalid (${ceIv}) at Strike ${strike}`);
    }
    if (peIv <= 0) {
      invalidIvCount++;
      invalidIvDetails.push(`PE IV invalid (${peIv}) at Strike ${strike}`);
    }

    if (ceOi < 0) {
      negOiCount++;
      negOiDetails.push(`Negative CE OI (${ceOi}) at Strike ${strike}`);
    }
    if (peOi < 0) {
      negOiCount++;
      negOiDetails.push(`Negative PE OI (${peOi}) at Strike ${strike}`);
    }

    if (ceVolume < 0) {
      negVolCount++;
      negVolDetails.push(`Negative CE Volume (${ceVolume}) at Strike ${strike}`);
    }
    if (peVolume < 0) {
      negVolCount++;
      negVolDetails.push(`Negative PE Volume (${peVolume}) at Strike ${strike}`);
    }

    if (ceLtp === 0 && ceOi === 0 && peLtp === 0 && peOi === 0) {
      missingCount++;
      missingDetails.push(`Missing pricing & OI data for Strike ${strike}`);
    }

    data.push({
      strikePrice: strike,
      expiryDate: expiry,
      ceLtp,
      ceOi,
      ceChgOi,
      ceVolume,
      ceIv,
      ceBid,
      ceAsk,
      peLtp,
      peOi,
      peChgOi,
      peVolume,
      peIv,
      peBid,
      peAsk,
      underlyingValue: spot
    });
  });

  return {
    data,
    warningsPartial: {
      missingValuesCount: missingCount,
      missingValuesDetails: missingDetails,
      duplicateRowsCount: dupCount,
      duplicateRowsDetails: dupDetails,
      invalidIvCount,
      invalidIvDetails,
      negativeOiCount: negOiCount,
      negativeOiDetails: negOiDetails,
      negativeVolumeCount: negVolCount,
      negativeVolumeDetails: negVolDetails
    }
  };
};

export const parseFuturesCsv = (csvText: string): RawFuturesRow => {
  // Handle multi-line headers or quoted headers with newlines (e.g. NSE MW-FO-nse50_fut CSVs)
  const result = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const rows = result.data;
  if (!rows || rows.length === 0) {
    return {
      symbol: 'NIFTY',
      expiryDate: 'N/A',
      open: 0,
      high: 0,
      low: 0,
      ltp: 0,
      volume: 0,
      openInterest: 0,
      spotPrice: 0
    };
  }

  // Find NIFTY row
  const niftyRow = rows.find(r => getStr(r, ['SYMBOL', 'INSTRUMENT']).toUpperCase().includes('NIFTY')) || rows[0];

  return {
    symbol: getStr(niftyRow, ['SYMBOL', 'INSTRUMENT'], 'NIFTY'),
    expiryDate: getStr(niftyRow, ['EXPIRY_DATE', 'EXPIRY_DT', 'EXPIRY'], 'N/A'),
    open: getNum(niftyRow, ['OPEN', 'OPEN_PRICE']),
    high: getNum(niftyRow, ['HIGH', 'HIGH_PRICE']),
    low: getNum(niftyRow, ['LOW', 'LOW_PRICE']),
    ltp: getNum(niftyRow, ['LTP', 'CLOSE', 'LAST_PRICE', 'SETTLE_PR']),
    volume: getNum(niftyRow, ['VOLUME', 'CONTRACTS', 'TOTTRDQTY', 'NO_OF_CONTRACTS']),
    openInterest: getNum(niftyRow, ['OPEN_INT', 'OPEN_INTEREST', 'OI']),
    spotPrice: getNum(niftyRow, ['UNDERLYING_VALUE', 'SPOT_PRICE', 'SPOT', 'UNDERLYING_VAL']),
    currentDate: getStr(niftyRow, ['CURRENT_DATE', 'DATE', 'TIMESTAMP']),
    currentTime: getStr(niftyRow, ['CURRENT_TIME', 'TIME'])
  };
};

export const parseOptCsv = (csvText: string): RawOptRow[] => {
  const result = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const rows = result.data;
  const parsed: RawOptRow[] = [];

  rows.forEach(row => {
    const strike = getNum(row, ['STRIKE_PRICE', 'STRIKE', 'STRIKE_PR']);
    if (!strike) return;

    const optTypeRaw = getStr(row, ['OPTION_TYPE', 'OPTION_TYP', 'TYPE', 'OPT_TYPE']).toUpperCase();
    const optionType: 'CE' | 'PE' = optTypeRaw.includes('P') ? 'PE' : 'CE';

    parsed.push({
      symbol: getStr(row, ['SYMBOL'], 'NIFTY'),
      expiryDate: getStr(row, ['EXPIRY_DATE', 'EXPIRY_DT'], 'N/A'),
      optionType,
      strikePrice: strike,
      open: getNum(row, ['OPEN', 'OPEN_PRICE']),
      high: getNum(row, ['HIGH', 'HIGH_PRICE']),
      low: getNum(row, ['LOW', 'LOW_PRICE']),
      ltp: getNum(row, ['LTP', 'LAST_PRICE', 'CLOSE']),
      volume: getNum(row, ['VOLUME', 'TOTTRDQTY', 'NO_OF_CONTRACTS']),
      openInterest: getNum(row, ['OPEN_INT', 'OPEN_INTEREST', 'OI']),
      chgOi: getNum(row, ['CHG_OI', 'CHANGE_IN_OI', 'CHG_IN_OI']),
      iv: getNum(row, ['IV', 'IMPLIED_VOLATILITY']),
      bidPrice: getNum(row, ['BID_PRICE', 'BID']),
      askPrice: getNum(row, ['ASK_PRICE', 'ASK'])
    });
  });

  return parsed;
};

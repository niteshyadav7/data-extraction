export interface StockSearchResult {
  symbol: string;
  name: string;
  cmp: number;
  marketCap: number;
  pe: number;
  type: 'INDEX' | 'STOCK';
}

// Major Indices without static hardcoded prices (CMP parsed dynamically from market feed)
const MAJOR_INDICES: StockSearchResult[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50 Index', cmp: 0, marketCap: 0, pe: 0, type: 'INDEX' },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', cmp: 0, marketCap: 0, pe: 0, type: 'INDEX' },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', cmp: 0, marketCap: 0, pe: 0, type: 'INDEX' },
  { symbol: 'MIDCPNIFTY', name: 'NIFTY Midcap Select', cmp: 0, marketCap: 0, pe: 0, type: 'INDEX' },
  { symbol: 'NIFTYIT', name: 'NIFTY IT Index', cmp: 0, marketCap: 0, pe: 0, type: 'INDEX' },
];

let cachedStocks: StockSearchResult[] | null = null;

export const loadStocksList = async (): Promise<StockSearchResult[]> => {
  if (cachedStocks) return cachedStocks;

  try {
    const res = await fetch('/stocksList.csv');
    if (!res.ok) throw new Error('Failed to load stocksList.csv');
    const text = await res.text();

    const lines = text.split('\n');
    const parsed: StockSearchResult[] = [];

    // Header at line 0: symbol,name,CMP Rs.,P/E,Mar Cap Rs.Cr.,...
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length >= 5) {
        const symbol = parts[0].trim().toUpperCase();
        const name = parts[1].trim();
        const cmp = parseFloat(parts[2].replace(/,/g, '')) || 0;
        const pe = parseFloat(parts[3].replace(/,/g, '')) || 0;
        const marketCap = parseFloat(parts[4].replace(/,/g, '')) || 0;

        if (symbol) {
          parsed.push({
            symbol,
            name: name || symbol,
            cmp,
            pe,
            marketCap,
            type: 'STOCK'
          });
        }
      }
    }

    cachedStocks = [...MAJOR_INDICES, ...parsed];
    return cachedStocks;
  } catch (err) {
    cachedStocks = MAJOR_INDICES;
    return cachedStocks;
  }
};

export const searchSymbols = async (query: string, limit = 10): Promise<StockSearchResult[]> => {
  const all = await loadStocksList();
  const q = query.trim().toUpperCase();

  if (!q) {
    return all.slice(0, limit);
  }

  const exactSymbol = all.filter(s => s.symbol === q);
  const symbolStartsWith = all.filter(s => s.symbol.startsWith(q) && s.symbol !== q);
  const symbolContains = all.filter(s => s.symbol.includes(q) && !s.symbol.startsWith(q));
  const nameContains = all.filter(s =>
    s.name.toUpperCase().includes(q) && !s.symbol.includes(q)
  );

  const combined = [...exactSymbol, ...symbolStartsWith, ...symbolContains, ...nameContains];
  return combined.slice(0, limit);
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { searchSymbols, type StockSearchResult } from '../utils/stocksParser';

interface SymbolSearchProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string, type: 'INDEX' | 'STOCK') => void;
}

export const SymbolSearch: React.FC<SymbolSearchProps> = ({ selectedSymbol, onSelectSymbol }) => {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      const res = await searchSymbols(query, 12);
      setResults(res);
    };
    fetchResults();
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: StockSearchResult) => {
    onSelectSymbol(item.symbol, item.type);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '320px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={16}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
        />

        <input
          type="text"
          value={isOpen ? query : query || selectedSymbol}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Index or Stock (e.g. RELIANCE, BANKNIFTY)..."
          style={{
            width: '100%',
            padding: '8px 36px 8px 36px',
            borderRadius: '8px',
            border: '1.5px solid var(--border-color)',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            fontWeight: 600,
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
        />

        {query ? (
          <X
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', right: '12px', cursor: 'pointer' }}
            onClick={() => setQuery('')}
          />
        ) : (
          <ChevronDown
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }}
          />
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 1000,
            maxHeight: '380px',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
            RECOMMENDED STOCKS & INDICES ({results.length})
          </div>

          {results.length === 0 ? (
            <div style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No stocks or indices found matching "{query}"
            </div>
          ) : (
            results.map((item) => {
              const isSelected = item.symbol === selectedSymbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--accent-pill)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {item.symbol}
                      </span>

                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: item.type === 'INDEX' ? '#E2F0E5' : '#FFF3E0',
                          color: item.type === 'INDEX' ? 'var(--color-green)' : '#E65100',
                          border: `1px solid ${item.type === 'INDEX' ? 'var(--color-green)' : '#FFB74D'}`
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.name}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {item.cmp > 0 && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        ₹{item.cmp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    {item.marketCap > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        M.Cap: ₹{(item.marketCap / 1000).toFixed(1)}k Cr
                      </div>
                    )}
                    {isSelected && <Check size={14} color="var(--color-green)" style={{ marginTop: '2px' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

'use client';

import { useState } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { SymbolParam } from '@/types/pi-financial';

export function SymbolManager() {
  const { watchedSymbols, addSymbol, removeSymbol } = useMarketStore();
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState('NASDAQ');

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      const newSymbol: SymbolParam = {
        symbol: symbol.trim().toUpperCase(),
        market,
      };
      addSymbol(newSymbol);
      setSymbol('');
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-black mb-4">Symbol Manager</h2>

      <form onSubmit={handleAddSymbol} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Symbol (e.g., AAPL)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="NASDAQ">NASDAQ</option>
            <option value="NYSE">NYSE</option>
            <option value="AMEX">AMEX</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-sm text-black mb-2">Watching {watchedSymbols.length} symbols:</p>
        {watchedSymbols.map((sym) => (
          <div
            key={`${sym.symbol}-${sym.market}`}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <span className="font-semibold text-black">{sym.symbol}</span>
              <span className="text-sm text-black ml-2">({sym.market})</span>
            </div>
            <button
              onClick={() => removeSymbol(sym.symbol)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { usePIFinancialWebSocket } from '@/hooks/usePIFinancialWebSocket';
import { useFinnhubWebSocket } from '@/hooks/useFinnhubWebSocket';
import { useMarketStore } from '@/store/marketStore';
import { DualSourceCard } from '@/components/DualSourceCard';
import { DualConnectionStatus } from '@/components/DualConnectionStatus';
import { SymbolManager } from '@/components/SymbolManager';
import { LogsPanel } from '@/components/LogsPanel';

export default function Home() {
  const {
    connect: connectPI,
    disconnect: disconnectPI,
    isConnected: isConnectedPI,
  } = usePIFinancialWebSocket();

  const {
    connect: connectFinnhub,
    disconnect: disconnectFinnhub,
    isConnected: isConnectedFinnhub,
  } = useFinnhubWebSocket();

  const { marketData, watchedSymbols } = useMarketStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Market Data Dashboard - Dual Source Comparison
          </h1>
          <p className="text-black">
            Real-time market data from PI Financial & Finnhub
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DualConnectionStatus
              onReconnectPI={connectPI}
              onDisconnectPI={disconnectPI}
              isConnectedPI={isConnectedPI}
              onReconnectPrixe={connectFinnhub}
              onDisconnectPrixe={disconnectFinnhub}
              isConnectedPrixe={isConnectedFinnhub}
            />
          </div>
          <div>
            <SymbolManager />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-4">
            Live Price Comparison
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {watchedSymbols.map((symbol) => {
              const piData = marketData[symbol.symbol];
              const finnhubData = marketData[`finnhub:${symbol.symbol}`];

              return (
                <DualSourceCard
                  key={`${symbol.symbol}-${symbol.market}`}
                  symbol={symbol.symbol}
                  piData={piData}
                  prixeData={finnhubData}
                />
              );
            })}
          </div>
        </div>

        <div>
          <LogsPanel />
        </div>
      </div>
    </div>
  );
}

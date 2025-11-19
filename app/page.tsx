'use client';

import { usePIFinancialWebSocket } from '@/hooks/usePIFinancialWebSocket';
import { useFinnhubWebSocket } from '@/hooks/useFinnhubWebSocket';
import { DualConnectionStatus } from '@/components/DualConnectionStatus';
import { InstrumentList } from '@/components/InstrumentList';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            Market Data Dashboard - Dual Source Comparison
          </h1>
          <p className="text-gray-600">
            Real-time market data from PI Financial & Finnhub
          </p>
        </header>

        <DualConnectionStatus
          onReconnectPI={connectPI}
          onDisconnectPI={disconnectPI}
          isConnectedPI={isConnectedPI}
          onReconnectPrixe={connectFinnhub}
          onDisconnectPrixe={disconnectFinnhub}
          isConnectedPrixe={isConnectedFinnhub}
        />

        <InstrumentList />

        <LogsPanel />
      </div>
    </div>
  );
}

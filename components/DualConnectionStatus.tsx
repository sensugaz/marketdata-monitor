'use client';

import { useMarketStore } from '@/store/marketStore';

interface DualConnectionStatusProps {
  onReconnectPI: () => void;
  onDisconnectPI: () => void;
  isConnectedPI: boolean;
  onReconnectPrixe: () => void;
  onDisconnectPrixe: () => void;
  isConnectedPrixe: boolean;
}

export function DualConnectionStatus({
  onReconnectPI,
  onDisconnectPI,
  isConnectedPI,
  onReconnectPrixe,
  onDisconnectPrixe,
  isConnectedPrixe,
}: DualConnectionStatusProps) {
  const { piFinancialConnection, finnhubConnection, stats } = useMarketStore();

  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    reconnecting: 'bg-yellow-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  const renderConnectionCard = (
    title: string,
    connection: typeof piFinancialConnection,
    isConnected: boolean,
    onReconnect: () => void,
    onDisconnect: () => void,
    bgColor: string
  ) => {
    return (
      <div className={`${bgColor} rounded-lg border p-4`}>
        <h3 className="text-lg font-semibold text-black mb-3">{title}</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${statusColors[connection.status]} ${
                  connection.status === 'connected' ? 'animate-pulse' : ''
                }`}
              />
              <span className="text-sm font-semibold text-black">
                {statusLabels[connection.status]}
              </span>
            </div>
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onReconnect}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-black">Uptime</p>
              <p className="text-sm font-semibold text-black">{connection.uptime}s</p>
            </div>
            {connection.lastMessageTime && (
              <div>
                <p className="text-xs text-black">Last Message</p>
                <p className="text-xs text-black">
                  {new Date(connection.lastMessageTime).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-bold text-black mb-4">Connection Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {renderConnectionCard(
          'PI Financial',
          piFinancialConnection,
          isConnectedPI,
          onReconnectPI,
          onDisconnectPI,
          'bg-blue-50'
        )}
        {renderConnectionCard(
          'Finnhub',
          finnhubConnection,
          isConnectedPrixe,
          onReconnectPrixe,
          onDisconnectPrixe,
          'bg-purple-50'
        )}
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-sm font-semibold text-black mb-2">Overall Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-black">Total Messages</p>
            <p className="text-lg font-bold text-black">{stats.totalMessages}</p>
          </div>
          <div>
            <p className="text-xs text-black">Avg Latency</p>
            <p className="text-lg font-bold text-black">
              {stats.averageLatency > 0 ? `${stats.averageLatency.toFixed(0)}ms` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-black">Active Sources</p>
            <p className="text-lg font-bold text-black">
              {(isConnectedPI ? 1 : 0) + (isConnectedPrixe ? 1 : 0)}/2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

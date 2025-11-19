'use client';

import { useMarketStore } from '@/store/marketStore';

interface ConnectionStatusProps {
  onReconnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

export function ConnectionStatus({ onReconnect, onDisconnect, isConnected }: ConnectionStatusProps) {
  const { connectionState, stats } = useMarketStore();

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

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[connectionState.status]} animate-pulse`} />
            <div>
              <p className="font-semibold text-gray-900">{statusLabels[connectionState.status]}</p>
              <p className="text-xs text-gray-600">{connectionState.url}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onReconnect}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">{connectionState.uptime}s</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Messages</p>
            <p className="text-lg font-semibold text-gray-900">{stats.totalMessages}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Avg Latency</p>
            <p className="text-lg font-semibold text-gray-900">
              {stats.averageLatency > 0 ? `${stats.averageLatency.toFixed(0)}ms` : 'N/A'}
            </p>
          </div>
        </div>

        {connectionState.lastMessageTime && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-600">Last Message</p>
            <p className="text-sm text-gray-900">
              {new Date(connectionState.lastMessageTime).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useMarketStore } from '@/store/marketStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    onDisconnect: () => void
  ) => {
    const getBadgeVariant = () => {
      if (connection.status === 'connected') return 'default';
      if (connection.status === 'error') return 'destructive';
      return 'secondary';
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${statusColors[connection.status]} ${
                  connection.status === 'connected' ? 'animate-pulse' : ''
                }`}
              />
              <Badge variant={getBadgeVariant()}>
                {statusLabels[connection.status]}
              </Badge>
            </div>
            {isConnected ? (
              <Button size="sm" variant="destructive" onClick={onDisconnect}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={onReconnect}>
                Reconnect
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Uptime</p>
              <p className="text-sm font-semibold">{connection.uptime}s</p>
            </div>
            {connection.lastMessageTime && (
              <div>
                <p className="text-xs text-gray-500">Last Message</p>
                <p className="text-xs">
                  {new Date(connection.lastMessageTime).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderConnectionCard(
            'PI Financial',
            piFinancialConnection,
            isConnectedPI,
            onReconnectPI,
            onDisconnectPI
          )}
          {renderConnectionCard(
            'Finnhub',
            finnhubConnection,
            isConnectedPrixe,
            onReconnectPrixe,
            onDisconnectPrixe
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Overall Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Messages</p>
              <p className="text-lg font-bold">{stats.totalMessages}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Latency</p>
              <p className="text-lg font-bold">
                {stats.averageLatency > 0 ? `${stats.averageLatency.toFixed(0)}ms` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Sources</p>
              <p className="text-lg font-bold">
                {(isConnectedPI ? 1 : 0) + (isConnectedPrixe ? 1 : 0)}/2
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

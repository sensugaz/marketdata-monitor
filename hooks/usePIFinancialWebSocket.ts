'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { PIFinancialResponse, SubscribeMessage } from '@/types/pi-financial';

const WS_URL = 'wss://marketdata.prod.pi.financial/marketdata-migrationproxy/market-data/streaming';
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;

export function usePIFinancialWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectTimeRef = useRef<number>(0);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());

  const {
    watchedSymbols,
    instrumentsLoaded,
    updateMarketData,
    setPIFinancialConnection: setConnectionState,
    addLog,
    updateStats,
  } = useMarketStore();

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      wsRef.current.send(messageStr);

      const symbolsInfo = message.data?.param
        ? message.data.param.map((p: any) => p.symbol).join(', ')
        : '';

      addLog({
        type: 'sent',
        level: 'info',
        message: `[PI Financial] Request: ${message.op} ${symbolsInfo}`,
        data: { request: message, raw: messageStr },
      });
    }
  }, [addLog]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionState({ status: 'connecting' });
      addLog({
        type: 'info',
        level: 'info',
        message: 'Connecting to WebSocket...',
      });

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        connectTimeRef.current = Date.now();
        setConnectionState({
          status: 'connected',
          readyState: ws.readyState,
          lastMessageTime: Date.now(),
        });

        addLog({
          type: 'open',
          level: 'success',
          message: 'WebSocket connected successfully',
        });

        // Get all watched symbols from store and subscribe in batches of 100
        const currentWatchedSymbols = useMarketStore.getState().watchedSymbols;
        if (currentWatchedSymbols.length > 0) {
          // Filter out already subscribed symbols
          const newSymbols = currentWatchedSymbols.filter(
            (s) => !subscribedSymbolsRef.current.has(`${s.symbol}:${s.market}`)
          );

          // Send subscribe messages in batches of 100
          const BATCH_SIZE = 100;
          for (let i = 0; i < newSymbols.length; i += BATCH_SIZE) {
            const batch = newSymbols.slice(i, i + BATCH_SIZE);

            const subscribeMessage: SubscribeMessage = {
              op: 'Subscribe',
              data: {
                subscribeType: 'ticker/v2',
                param: batch,
              },
            };

            if (ws.readyState === WebSocket.OPEN) {
              const messageStr = JSON.stringify(subscribeMessage);
              ws.send(messageStr);

              const symbolsInfo = batch.map(s => s.symbol).join(', ');
              addLog({
                type: 'sent',
                level: 'info',
                message: `[PI Financial] Request: ${subscribeMessage.op} batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} symbols)`,
                data: { request: subscribeMessage, raw: messageStr },
              });

              // Mark all symbols in batch as subscribed
              batch.forEach(symbol => {
                subscribedSymbolsRef.current.add(`${symbol.symbol}:${symbol.market}`);
              });
            }
          }
        }

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const messageStr = JSON.stringify({ op: 'Ping' });
            wsRef.current.send(messageStr);
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data: PIFinancialResponse = JSON.parse(event.data);
          const now = Date.now();

          setConnectionState({
            lastMessageTime: now,
            uptime: Math.floor((now - connectTimeRef.current) / 1000),
          });

          // Handle Pong response
          if (data.op === 'Pong') {
            addLog({
              type: 'received',
              level: 'info',
              message: '[PI Financial] Response: Pong',
              data: { response: data, raw: event.data },
            });
            return;
          }

          // Handle streaming data
          if (data.op === 'Streaming' && data.response?.data) {
            // Batch update to reduce state updates
            data.response.data.forEach((marketData) => {
              updateMarketData(marketData.symbol, marketData);
            });

            // Update stats once per batch instead of per message
            const currentStats = useMarketStore.getState().stats;
            const batchSize = data.response.data.length;

            // Calculate latency once if available
            let latency = 0;
            if (data.processing_time && data.sending_time) {
              const processingTime = new Date(data.processing_time).getTime();
              const sendingTime = new Date(data.sending_time).getTime();
              latency = processingTime - sendingTime;
            }

            updateStats({
              totalMessages: currentStats.totalMessages + batchSize,
              averageLatency: latency > 0
                ? (currentStats.averageLatency * currentStats.totalMessages + latency * batchSize) / (currentStats.totalMessages + batchSize)
                : currentStats.averageLatency,
            });

            const symbols = data.response.data.map((d: any) => d.symbol).join(', ');
            addLog({
              type: 'received',
              level: 'success',
              message: `[PI Financial] Response: Streaming data [${symbols}]`,
              data: { response: data, raw: event.data, count: data.response.data.length },
            });
          }
        } catch (error) {
          addLog({
            type: 'error',
            level: 'error',
            message: 'Failed to parse message',
            data: error,
          });
        }
      };

      ws.onerror = (error) => {
        setConnectionState({ status: 'error' });
        addLog({
          type: 'error',
          level: 'error',
          message: 'WebSocket error occurred',
          data: error,
        });
      };

      ws.onclose = () => {
        setConnectionState({ status: 'disconnected', readyState: ws.readyState });
        addLog({
          type: 'close',
          level: 'warning',
          message: 'WebSocket connection closed',
        });

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          addLog({
            type: 'info',
            level: 'info',
            message: 'Attempting to reconnect...',
          });
          setConnectionState({ status: 'reconnecting' });
          connect();
        }, RECONNECT_DELAY);
      };
    } catch (error) {
      addLog({
        type: 'error',
        level: 'error',
        message: 'Failed to create WebSocket connection',
        data: error,
      });
      setConnectionState({ status: 'error' });
    }
  }, [setConnectionState, addLog, updateMarketData, updateStats]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Auto-connect when instruments are loaded
  useEffect(() => {
    if (instrumentsLoaded) {
      // Wait a bit to ensure displayedSymbols is set
      const timer = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          connect();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }
  }, [instrumentsLoaded, connect, disconnect]);

  // No need to subscribe on displayedSymbols changes - we subscribe to all watchedSymbols on connect

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

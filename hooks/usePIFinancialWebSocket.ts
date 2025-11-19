'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { PIFinancialResponse, SubscribeMessage } from '@/types/pi-financial';

const WS_URL = 'wss://marketdata.prod.pi.financial/marketdata-migrationproxy/market-data/streaming';
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;

export function usePIFinancialWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const connectTimeRef = useRef<number>(0);

  const {
    watchedSymbols,
    updateMarketData,
    setPIFinancialConnection: setConnectionState,
    addLog,
    updateStats,
    stats,
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

  const subscribe = useCallback(() => {
    if (watchedSymbols.length === 0) return;

    const subscribeMessage: SubscribeMessage = {
      op: 'Subscribe',
      data: {
        subscribeType: 'ticker/v2',
        param: watchedSymbols,
      },
    };

    sendMessage(subscribeMessage);
  }, [watchedSymbols, sendMessage]);

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

        // Subscribe to symbols
        subscribe();

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          sendMessage({ op: 'Ping' });
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
            data.response.data.forEach((marketData) => {
              updateMarketData(marketData.symbol, marketData);

              // Update stats
              const newMessagesBySymbol = { ...stats.messagesBySymbol };
              newMessagesBySymbol[marketData.symbol] =
                (newMessagesBySymbol[marketData.symbol] || 0) + 1;

              const newMessagesByType = { ...stats.messagesByType };
              newMessagesByType[data.md_entry_type] =
                (newMessagesByType[data.md_entry_type] || 0) + 1;

              // Calculate latency if timestamps available
              let latency = 0;
              if (data.processing_time && data.sending_time) {
                const processingTime = new Date(data.processing_time).getTime();
                const sendingTime = new Date(data.sending_time).getTime();
                latency = processingTime - sendingTime;
              }

              updateStats({
                totalMessages: stats.totalMessages + 1,
                messagesBySymbol: newMessagesBySymbol,
                messagesByType: newMessagesByType,
                averageLatency: latency > 0
                  ? (stats.averageLatency * stats.totalMessages + latency) / (stats.totalMessages + 1)
                  : stats.averageLatency,
              });
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
  }, [subscribe, sendMessage, setConnectionState, addLog, updateMarketData, updateStats, stats]);

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

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Subscribe to new symbols when they are added
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && watchedSymbols.length > 0) {
      // Get the last added symbol (the newest one)
      const lastSymbol = watchedSymbols[watchedSymbols.length - 1];

      // Subscribe only to the new symbol
      const subscribeMessage: SubscribeMessage = {
        op: 'Subscribe',
        data: {
          subscribeType: 'ticker/v2',
          param: [lastSymbol],
        },
      };

      sendMessage(subscribeMessage);
    }
  }, [watchedSymbols.length]); // Only trigger when length changes (new symbol added)

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

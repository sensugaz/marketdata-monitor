'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '@/store/marketStore';
import {
  FinnhubResponse,
  FinnhubSubscribeMessage,
} from '@/types/finnhub';

const API_TOKEN = 'd4ev9ahr01qrcbrujq5gd4ev9ahr01qrcbrujq60';
const WS_URL = `wss://ws.finnhub.io?token=${API_TOKEN}`;
const RECONNECT_DELAY = 3000;

export function useFinnhubWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectTimeRef = useRef<number>(0);

  const {
    watchedSymbols,
    updateMarketData: updateStoreData,
    setFinnhubConnection: setConnectionState,
    addLog,
    updateStats,
    stats,
  } = useMarketStore();

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      wsRef.current.send(messageStr);

      addLog({
        type: 'sent',
        level: 'info',
        message: `[Finnhub] Request: ${message.type} ${message.symbol || ''}`,
        data: { request: message, raw: messageStr },
      });
    }
  }, [addLog]);

  const subscribe = useCallback((symbol?: string) => {
    if (symbol) {
      // Subscribe to a single symbol
      const subscribeMessage = {
        type: 'subscribe',
        symbol: symbol,
      };
      sendMessage(subscribeMessage);
    } else {
      // Subscribe to all watched symbols
      watchedSymbols.forEach(sym => {
        const subscribeMessage = {
          type: 'subscribe',
          symbol: sym.symbol,
        };
        sendMessage(subscribeMessage);
      });
    }
  }, [watchedSymbols, sendMessage]);

  const unsubscribe = useCallback(() => {
    watchedSymbols.forEach(sym => {
      sendMessage({ type: 'unsubscribe', symbol: sym.symbol });
    });
  }, [watchedSymbols, sendMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionState({
        status: 'connecting',
        url: WS_URL,
      });
      addLog({
        type: 'info',
        level: 'info',
        message: '[Finnhub] Connecting to WebSocket...',
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
          message: '[Finnhub] WebSocket connected successfully',
        });

        // Subscribe to symbols
        subscribe();
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const now = Date.now();

          setConnectionState({
            lastMessageTime: now,
            uptime: Math.floor((now - connectTimeRef.current) / 1000),
          });

          // Handle ping
          if (response.type === 'ping') {
            addLog({
              type: 'received',
              level: 'info',
              message: '[Finnhub] Response: ping',
              data: { response: response, raw: event.data },
            });
            return;
          }

          // Handle error
          if (response.type === 'error') {
            addLog({
              type: 'error',
              level: 'error',
              message: `[Finnhub] Response: error - ${response.msg || 'Unknown error'}`,
              data: { response: response, raw: event.data },
            });
            return;
          }

          // Handle trade data
          if (response.type === 'trade' && response.data && response.data.length > 0) {
            // Process each trade in the data array
            response.data.forEach((trade: any) => {
              const symbol = trade.s;
              const price = trade.p;
              const volume = trade.v;
              const timestamp = trade.t;

              const storeKey = `finnhub:${symbol}`;

              // Convert to PI Financial format for store compatibility
              const storeData = {
                symbol: symbol,
                venue: 'Finnhub',
                price: price.toString(),
                lastPriceTime: timestamp,
                volume: volume.toString(),
                amount: '0',
                totalAmount: '0',
                totalAmountK: '0',
                totalVolume: volume.toString(),
                totalVolumeK: (volume / 1000).toFixed(3),
                orderBook: {
                  bid: [],
                  offer: [],
                },
                publicTrades: [],
                status: 'Live',
                securityType: 'Stock',
                instrumentType: 'Stock',
                // Basic data from Finnhub
                open: '0',
                high24H: '0',
                low24H: '0',
                preClose: '0',
                priceChanged: '0',
                priceChangedRate: '0',
                // Fields required by MarketData type
                auctionPrice: '0',
                auctionVolume: '0',
                isProjected: false,
                open1: '',
                open2: '',
                ceiling: '0',
                floor: '0',
                average: '0',
                averageBuy: '0',
                averageSell: '0',
                aggressor: '',
                yield: '0',
                market: '',
                lastTrade: '',
                toLastTrade: 0,
                moneyness: '',
                maturityDate: '',
                multiplier: '0',
                exercisePrice: '0',
                intrinsicValue: '0',
                pSettle: '0',
                poi: '0',
                underlying: '0',
                open0: '',
                basis: '0',
                settle: '0',
                prior_close: '0',
              };

              updateStoreData(storeKey, storeData);

              // Update stats
              const newMessagesBySymbol = { ...stats.messagesBySymbol };
              newMessagesBySymbol[storeKey] = (newMessagesBySymbol[storeKey] || 0) + 1;

              const newMessagesByType = { ...stats.messagesByType };
              newMessagesByType['finnhub:trade'] = (newMessagesByType['finnhub:trade'] || 0) + 1;

              updateStats({
                totalMessages: stats.totalMessages + 1,
                messagesBySymbol: newMessagesBySymbol,
                messagesByType: newMessagesByType,
              });
            });

            // Log once for all trades in this batch
            const firstTrade = response.data[0];
            const symbols = [...new Set(response.data.map((t: any) => t.s))].join(', ');
            addLog({
              type: 'received',
              level: 'success',
              message: `[Finnhub] Response: trade data [${symbols}] - ${response.data.length} trade(s)`,
              data: { response: response, raw: event.data, count: response.data.length, firstPrice: firstTrade.p },
            });
          }
        } catch (error) {
          addLog({
            type: 'error',
            level: 'error',
            message: '[Finnhub] Failed to parse message',
            data: error,
          });
        }
      };

      ws.onerror = (error) => {
        setConnectionState({ status: 'error' });
        addLog({
          type: 'error',
          level: 'error',
          message: '[Finnhub] WebSocket error occurred',
          data: error,
        });
      };

      ws.onclose = () => {
        setConnectionState({ status: 'disconnected', readyState: ws.readyState });
        addLog({
          type: 'close',
          level: 'warning',
          message: '[Finnhub] WebSocket connection closed',
        });

        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          addLog({
            type: 'info',
            level: 'info',
            message: '[Finnhub] Attempting to reconnect...',
          });
          setConnectionState({ status: 'reconnecting' });
          connect();
        }, RECONNECT_DELAY);
      };
    } catch (error) {
      addLog({
        type: 'error',
        level: 'error',
        message: '[Finnhub] Failed to create WebSocket connection',
        data: error,
      });
      setConnectionState({ status: 'error' });
    }
  }, [subscribe, sendMessage, setConnectionState, addLog, updateStoreData, updateStats, stats, watchedSymbols]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      unsubscribe();
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [unsubscribe]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Subscribe to new symbols when they change
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribe();
    }
  }, [watchedSymbols, subscribe]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

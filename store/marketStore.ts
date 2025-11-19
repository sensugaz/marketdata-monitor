import { create } from 'zustand';
import { MarketData, ConnectionState, SymbolParam } from '@/types/pi-financial';

interface MarketStore {
  // Market data
  marketData: Record<string, MarketData>;
  updateMarketData: (symbol: string, data: MarketData) => void;

  // Connection states (one for each source)
  piFinancialConnection: ConnectionState;
  finnhubConnection: ConnectionState;
  setPIFinancialConnection: (state: Partial<ConnectionState>) => void;
  setFinnhubConnection: (state: Partial<ConnectionState>) => void;

  // Backward compatibility
  connectionState: ConnectionState;
  setConnectionState: (state: Partial<ConnectionState>) => void;

  // Symbol management
  watchedSymbols: SymbolParam[];
  addSymbol: (symbol: SymbolParam) => void;
  removeSymbol: (symbol: string) => void;
  setWatchedSymbols: (symbols: SymbolParam[]) => void;
  instrumentsLoaded: boolean;
  setInstrumentsLoaded: (loaded: boolean) => void;

  // Displayed symbols (for incremental subscription)
  displayedSymbols: SymbolParam[];
  setDisplayedSymbols: (symbols: SymbolParam[]) => void;

  // WebSocket logs
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Statistics
  stats: Statistics;
  updateStats: (updates: Partial<Statistics>) => void;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'sent' | 'received' | 'open' | 'close' | 'error' | 'info';
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface Statistics {
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  bandwidth: number;
  messagesByType: Record<string, number>;
  messagesBySymbol: Record<string, number>;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  // Initial state
  marketData: {},
  piFinancialConnection: {
    status: 'disconnected',
    uptime: 0,
    url: 'wss://marketdata.prod.pi.financial/marketdata-migrationproxy/market-data/streaming',
  },
  finnhubConnection: {
    status: 'disconnected',
    uptime: 0,
    url: 'wss://ws.finnhub.io',
  },
  connectionState: {
    status: 'disconnected',
    uptime: 0,
    url: 'wss://marketdata.prod.pi.financial/marketdata-migrationproxy/market-data/streaming',
  },
  watchedSymbols: [],
  instrumentsLoaded: false,
  displayedSymbols: [],
  logs: [],
  stats: {
    totalMessages: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    bandwidth: 0,
    messagesByType: {},
    messagesBySymbol: {},
  },

  // Actions
  updateMarketData: (symbol, data) =>
    set((state) => ({
      marketData: {
        ...state.marketData,
        [symbol]: data,
      },
    })),

  setPIFinancialConnection: (updates) =>
    set((state) => ({
      piFinancialConnection: {
        ...state.piFinancialConnection,
        ...updates,
      },
    })),

  setFinnhubConnection: (updates) =>
    set((state) => ({
      finnhubConnection: {
        ...state.finnhubConnection,
        ...updates,
      },
    })),

  setConnectionState: (updates) =>
    set((state) => ({
      connectionState: {
        ...state.connectionState,
        ...updates,
      },
    })),

  addSymbol: (symbol) =>
    set((state) => {
      const exists = state.watchedSymbols.some(
        (s) => s.symbol === symbol.symbol && s.market === symbol.market
      );
      if (exists) return state;

      const newSymbols = [...state.watchedSymbols, symbol];
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('watchedSymbols', JSON.stringify(newSymbols));
      }
      return { watchedSymbols: newSymbols };
    }),

  removeSymbol: (symbol) =>
    set((state) => {
      const newSymbols = state.watchedSymbols.filter((s) => s.symbol !== symbol);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('watchedSymbols', JSON.stringify(newSymbols));
      }
      return { watchedSymbols: newSymbols };
    }),

  setWatchedSymbols: (symbols) =>
    set(() => {
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('watchedSymbols', JSON.stringify(symbols));
      }
      return { watchedSymbols: symbols };
    }),

  setInstrumentsLoaded: (loaded) => set({ instrumentsLoaded: loaded }),

  setDisplayedSymbols: (symbols) => set({ displayedSymbols: symbols }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        {
          ...log,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        },
        ...state.logs,
      ].slice(0, 500), // Keep only last 500 logs to save memory
    })),

  clearLogs: () => set({ logs: [] }),

  updateStats: (updates) =>
    set((state) => ({
      stats: {
        ...state.stats,
        ...updates,
      },
    })),
}));

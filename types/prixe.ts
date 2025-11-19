// Prixe WebSocket Types

export interface PrixeSubscribeMessage {
  event: 'subscribe';
  data: {
    ticker: string;
  };
}

export interface PrixeUnsubscribeMessage {
  event: 'unsubscribe';
}

export type PrixeMessage = PrixeSubscribeMessage | PrixeUnsubscribeMessage;

// Response Types

export interface PrixeConnectStatus {
  event: 'connect_status';
  data: {
    connection_id: string;
  };
}

export interface PrixeSubscriptionStatus {
  event: 'subscription_status';
  data: {
    status: string;
    ticker: string;
  };
}

export interface PrixePriceData {
  currentPrice: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
  change: number;
  changePercent: number;
}

export interface PrixePriceUpdate {
  event: 'price_update';
  data: {
    ticker: string;
    data: PrixePriceData;
  };
}

export interface PrixeError {
  event: 'error';
  data: {
    message: string;
  };
}

export type PrixeResponse =
  | PrixeConnectStatus
  | PrixeSubscriptionStatus
  | PrixePriceUpdate
  | PrixeError;

// Normalized data structure to match PI Financial for comparison
export interface NormalizedMarketData {
  source: 'pi-financial' | 'prixe';
  symbol: string;
  exchange: string;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  timestamp: number;
  marketCap?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
}

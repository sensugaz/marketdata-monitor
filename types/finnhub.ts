// Finnhub WebSocket Types

export interface FinnhubTradeData {
  s: string; // Symbol
  p: number; // Price
  v: number; // Volume
  t: number; // Timestamp in milliseconds
  c: string[]; // Conditions
}

export interface FinnhubTradeResponse {
  type: 'trade';
  data: FinnhubTradeData[];
}

export interface FinnhubPingResponse {
  type: 'ping';
}

export interface FinnhubErrorResponse {
  type: 'error';
  msg?: string;
}

export type FinnhubResponse =
  | FinnhubTradeResponse
  | FinnhubPingResponse
  | FinnhubErrorResponse;

export interface FinnhubSubscribeMessage {
  type: 'subscribe';
  symbol: string;
}

export interface FinnhubUnsubscribeMessage {
  type: 'unsubscribe';
  symbol: string;
}

export type FinnhubMessage =
  | FinnhubSubscribeMessage
  | FinnhubUnsubscribeMessage;

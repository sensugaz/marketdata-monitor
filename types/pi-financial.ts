// PI Financial WebSocket Types

export interface SubscribeMessage {
  op: 'Subscribe';
  data: {
    subscribeType: 'ticker/v2';
    param: SymbolParam[];
  };
}

export interface SymbolParam {
  symbol: string;
  market: string;
}

export interface PIFinancialResponse {
  code: string;
  op: string;
  processing_time: string;
  response_time: string;
  sending_time: string;
  creation_time: string;
  sequence_number: number;
  sending_id: string;
  md_entry_type: string;
  message: string;
  response: {
    data: MarketData[];
  };
}

export interface MarketData {
  symbol: string;
  venue: string;
  price: string;
  auctionPrice: string;
  auctionVolume: string;
  isProjected: boolean;
  lastPriceTime: number;
  open: string;
  high24H: string;
  low24H: string;
  priceChanged: string;
  priceChangedRate: string;
  volume: string;
  amount: string;
  totalAmount: string;
  totalAmountK: string;
  totalVolume: string;
  totalVolumeK: string;
  open1: string;
  open2: string;
  ceiling: string;
  floor: string;
  average: string;
  averageBuy: string;
  averageSell: string;
  aggressor: string;
  preClose: string;
  status: string;
  yield: string;
  publicTrades: PublicTrade[];
  orderBook: OrderBook;
  securityType: string;
  instrumentType: string;
  market: string;
  lastTrade: string;
  toLastTrade: number;
  moneyness: string;
  maturityDate: string;
  multiplier: string;
  exercisePrice: string;
  intrinsicValue: string;
  pSettle: string;
  poi: string;
  underlying: string;
  open0: string;
  basis: string;
  settle: string;
  prior_close: string;
}

export type PublicTrade = [
  number,  // timestamp
  string,  // time
  string,  // aggressor
  string,  // volume
  string,  // price
  string   // change
];

export interface OrderBook {
  bid: [string, string][]; // [price, volume]
  offer: [string, string][]; // [price, volume]
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastMessageTime?: number;
  uptime: number;
  url: string;
  readyState?: number;
}

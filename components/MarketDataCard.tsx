'use client';

import { MarketData } from '@/types/pi-financial';
import { format } from 'date-fns';

interface MarketDataCardProps {
  data: MarketData;
}

export function MarketDataCard({ data }: MarketDataCardProps) {
  const price = parseFloat(data.price);
  const priceChanged = parseFloat(data.priceChanged);
  const priceChangedRate = parseFloat(data.priceChangedRate);

  const isPositive = priceChanged >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className={`rounded-lg border p-6 ${bgColor} transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{data.symbol}</h3>
          <p className="text-sm text-gray-600">{data.venue}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${changeColor}`}>
          {data.status}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-4xl font-bold text-gray-900">
            ${price.toFixed(2)}
          </div>
          <div className={`text-lg font-semibold ${changeColor} flex items-center gap-2`}>
            {isPositive ? '↑' : '↓'} ${Math.abs(priceChanged).toFixed(2)} ({priceChangedRate}%)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
          <div>
            <p className="text-xs text-gray-600">Open</p>
            <p className="text-sm font-semibold">${parseFloat(data.open).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Prev Close</p>
            <p className="text-sm font-semibold">${parseFloat(data.preClose).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">High 24H</p>
            <p className="text-sm font-semibold text-green-600">${parseFloat(data.high24H).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Low 24H</p>
            <p className="text-sm font-semibold text-red-600">${parseFloat(data.low24H).toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
          <div>
            <p className="text-xs text-gray-600">Volume</p>
            <p className="text-sm font-semibold">{data.totalVolumeK}K</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Amount</p>
            <p className="text-sm font-semibold">${data.totalAmountK}K</p>
          </div>
        </div>

        {data.orderBook && (
          <div className="pt-4 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-2">Bid</p>
                {data.orderBook.bid.slice(0, 3).map(([price, volume], idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-green-600">${parseFloat(price).toFixed(2)}</span>
                    <span className="text-gray-600">{volume}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2">Ask</p>
                {data.orderBook.offer.slice(0, 3).map(([price, volume], idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-red-600">${parseFloat(price).toFixed(2)}</span>
                    <span className="text-gray-600">{volume}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-600">Last Update</p>
          <p className="text-xs text-gray-500">
            {format(new Date(data.lastPriceTime), 'HH:mm:ss')}
          </p>
        </div>
      </div>
    </div>
  );
}

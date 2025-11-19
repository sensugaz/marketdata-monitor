'use client';

import { MarketData } from '@/types/pi-financial';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface DualSourceCardProps {
  symbol: string;
  piData?: MarketData;
  prixeData?: MarketData;
}

export function DualSourceCard({ symbol, piData, prixeData }: DualSourceCardProps) {
  const [priceDiff, setPriceDiff] = useState<number>(0);
  const [priceDiffPercent, setPriceDiffPercent] = useState<number>(0);
  const [timeDiff, setTimeDiff] = useState<number>(0);

  useEffect(() => {
    if (piData && prixeData) {
      const piPrice = parseFloat(piData.price);
      const prixePrice = parseFloat(prixeData.price);
      const diff = piPrice - prixePrice;
      const diffPercent = (diff / prixePrice) * 100;
      const timeGap = Math.abs(piData.lastPriceTime - prixeData.lastPriceTime);

      setPriceDiff(diff);
      setPriceDiffPercent(diffPercent);
      setTimeDiff(timeGap);
    }
  }, [piData, prixeData]);

  const renderSourceCard = (data: MarketData | undefined, sourceName: string, bgColor: string) => {
    if (!data) {
      return (
        <div className={`${bgColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-black">{sourceName}</h4>
            <span className="text-xs text-black">No data</span>
          </div>
          <p className="text-black text-sm">Waiting for data...</p>
        </div>
      );
    }

    const price = parseFloat(data.price);
    const priceChanged = parseFloat(data.priceChanged || '0');
    const priceChangedRate = parseFloat(data.priceChangedRate || '0');
    const isPositive = priceChanged >= 0;
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`${bgColor} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-black">{sourceName}</h4>
          <span className="text-xs text-black">{data.venue}</span>
        </div>

        <div className="mb-2">
          <div className="text-2xl font-bold text-black">
            ${price.toFixed(2)}
          </div>
          {priceChanged !== 0 && (
            <div className={`text-sm font-semibold ${changeColor}`}>
              {isPositive ? '↑' : '↓'} ${Math.abs(priceChanged).toFixed(2)} ({priceChangedRate.toFixed(2)}%)
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-black">Open</p>
            <p className="font-semibold text-black">${parseFloat(data.open || '0').toFixed(2)}</p>
          </div>
          <div>
            <p className="text-black">Prev Close</p>
            <p className="font-semibold text-black">${parseFloat(data.preClose || '0').toFixed(2)}</p>
          </div>
          <div>
            <p className="text-black">High</p>
            <p className="font-semibold text-green-600">${parseFloat(data.high24H || '0').toFixed(2)}</p>
          </div>
          <div>
            <p className="text-black">Low</p>
            <p className="font-semibold text-red-600">${parseFloat(data.low24H || '0').toFixed(2)}</p>
          </div>
        </div>

        {data.orderBook && (data.orderBook.bid.length > 0 || data.orderBook.offer.length > 0) && (
          <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-gray-300">
            {data.orderBook.bid.length > 0 && (
              <div>
                <p className="text-black">Bid</p>
                <p className="font-semibold text-green-600">
                  ${parseFloat(data.orderBook.bid[0][0]).toFixed(2)}
                </p>
              </div>
            )}
            {data.orderBook.offer.length > 0 && (
              <div>
                <p className="text-black">Ask</p>
                <p className="font-semibold text-red-600">
                  ${parseFloat(data.orderBook.offer[0][0]).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-300">
          <p className="text-xs text-black">
            {format(new Date(data.lastPriceTime), 'HH:mm:ss.SSS')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-black mb-2">{symbol}</h3>

        {piData && prixeData && (
          <div className="space-y-2">
            {/* Price Difference */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-black">Price Difference:</span>
              <span className={`text-sm font-bold ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(priceDiff).toFixed(4)} ({Math.abs(priceDiffPercent).toFixed(4)}%)
              </span>
            </div>

            {/* Which source is higher */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-black">Higher Price:</span>
              <span className="text-sm font-semibold text-black">
                {priceDiff > 0 ? 'PI Financial' : priceDiff < 0 ? 'Finnhub' : 'Same'}
              </span>
            </div>

            {/* Time difference */}
            {timeDiff > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">Time Lag:</span>
                <span className="text-sm font-semibold text-black">
                  {timeDiff < 1000 ? `${timeDiff}ms` : `${(timeDiff / 1000).toFixed(2)}s`}
                </span>
              </div>
            )}

            {/* Spread in basis points (bps) */}
            {piData && prixeData && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">Spread (bps):</span>
                <span className="text-sm font-semibold text-black">
                  {(Math.abs(priceDiffPercent) * 100).toFixed(2)} bps
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSourceCard(piData, 'PI Financial', 'bg-blue-50')}
        {renderSourceCard(prixeData, 'Finnhub', 'bg-purple-50')}
      </div>

      {/* Alert for significant differences */}
      {piData && prixeData && Math.abs(priceDiff) > 1 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 font-bold">⚠️</span>
            <span className="text-sm text-yellow-800 font-semibold">
              Significant price difference detected ($${Math.abs(priceDiff).toFixed(2)})
            </span>
          </div>
        </div>
      )}

      {/* Alert for high percentage difference */}
      {piData && prixeData && Math.abs(priceDiffPercent) > 0.5 && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-bold">⚠️</span>
            <span className="text-sm text-orange-800 font-semibold">
              High percentage difference: {Math.abs(priceDiffPercent).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

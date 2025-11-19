'use client';

import { useInstruments } from '@/hooks/useInstruments';
import { useMarketStore } from '@/store/marketStore';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function InstrumentList() {
  const { instruments, loading, error } = useInstruments();
  const { marketData, setDisplayedSymbols } = useMarketStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [itemsToShow, setItemsToShow] = useState(10);
  const [flashingCells, setFlashingCells] = useState<Record<string, boolean>>({});
  const [priceChanges, setPriceChanges] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const priceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Filter instruments by search
  const filteredInstruments = useMemo(() => {
    if (!searchFilter) return instruments;

    const lowerSearch = searchFilter.toLowerCase();
    return instruments.filter(
      (inst) =>
        inst.symbol.toLowerCase().includes(lowerSearch) ||
        inst.friendlyName.toLowerCase().includes(lowerSearch)
    );
  }, [instruments, searchFilter]);

  // Paginated instruments
  const displayedInstruments = filteredInstruments.slice(0, itemsToShow);
  const hasMore = itemsToShow < filteredInstruments.length;

  // Update displayed symbols when pagination or filter changes
  useEffect(() => {
    const displayedSymbolParams = displayedInstruments.map((inst) => ({
      symbol: inst.symbol,
      market: inst.venue,
    }));
    setDisplayedSymbols(displayedSymbolParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsToShow, searchFilter, instruments.length]);

  // Detect price changes and trigger flash for entire row
  useEffect(() => {
    displayedInstruments.forEach((instrument) => {
      const piData = marketData[instrument.symbol];

      const piPrice = piData ? parseFloat(piData.price) : parseFloat(instrument.price);

      const key = instrument.symbol;
      const prevPrice = prevPricesRef.current[key];

      if (prevPrice !== undefined) {
        // Flash entire row if price changes
        if (prevPrice !== piPrice && piPrice !== parseFloat(instrument.price)) {

          // Clear existing timeout to prevent memory leak
          const existingTimeout = timeoutsRef.current.get(key);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          setFlashingCells((prev) => ({ ...prev, [key]: true }));

          const timeout = setTimeout(() => {
            setFlashingCells((prev) => ({ ...prev, [key]: false }));
            timeoutsRef.current.delete(key);
          }, 500);

          timeoutsRef.current.set(key, timeout);

          // Set price change direction
          const priceTimeout = priceTimeoutsRef.current.get(key);
          if (priceTimeout) {
            clearTimeout(priceTimeout);
          }

          setPriceChanges((prev) => ({
            ...prev,
            [key]: piPrice > prevPrice ? 'up' : 'down'
          }));

          const priceChangeTimeout = setTimeout(() => {
            setPriceChanges((prev) => ({ ...prev, [key]: null }));
            priceTimeoutsRef.current.delete(key);
          }, 1000);

          priceTimeoutsRef.current.set(key, priceChangeTimeout);
        }
      }

      prevPricesRef.current[key] = piPrice;
    });
  }, [marketData, displayedInstruments, instruments]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
      priceTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      priceTimeoutsRef.current.clear();
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Equities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8">Loading instruments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Equities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center py-8">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Global Equities ({filteredInstruments.length} of {instruments.length} stocks)
          </CardTitle>
          <Input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setItemsToShow(10); // Reset pagination when searching
            }}
            className="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>Symbol</TableHead>
              <TableHead rowSpan={2}>Name</TableHead>
              <TableHead rowSpan={2}>Status</TableHead>
              <TableHead colSpan={4} className="text-center border-l">PI Financial</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-right border-l">Bid</TableHead>
              <TableHead className="text-right">Ask</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Change %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedInstruments.map((instrument) => {
              // Get real-time data from WebSocket
              const piData = marketData[instrument.symbol];

              // PI Financial data
              const piPrice = piData ? parseFloat(piData.price) : parseFloat(instrument.price);
              const piChangeRate = piData ? parseFloat(piData.priceChangedRate || '0') : parseFloat(instrument.priceChangeRatio);

              // Status
              const status = piData?.status || 'Unknown';

              // Bid/Ask from Order Book
              const bestBid = piData?.orderBook?.bid?.[0]?.[0] || '-';
              const bestAsk = piData?.orderBook?.offer?.[0]?.[0] || '-';

              // Colors
              const piChangeColor = piChangeRate >= 0 ? 'text-green-600' : 'text-red-600';

              const key = instrument.symbol;

              // Price change effect
              const priceEffect = priceChanges[key];
              const priceArrow = priceEffect === 'up'
                ? '↑'
                : priceEffect === 'down'
                ? '↓'
                : '';
              const arrowColor = priceEffect === 'up'
                ? 'text-green-600'
                : priceEffect === 'down'
                ? 'text-red-600'
                : '';

              // Flash background color based on direction
              const flashBgColor = flashingCells[key]
                ? priceEffect === 'up'
                  ? 'bg-green-100'
                  : 'bg-red-100'
                : '';

              return (
                <TableRow
                  key={`${instrument.venue}-${instrument.symbol}`}
                  className={`transition-all duration-300 ${flashBgColor}`}
                >
                  {/* Symbol with Logo */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={instrument.logo}
                        alt={instrument.symbol}
                        className="w-8 h-8 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                        }}
                      />
                      <div>
                        <p className="font-bold">{instrument.symbol}</p>
                        <p className="text-xs text-gray-500">{instrument.venue}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Name */}
                  <TableCell>{instrument.friendlyName}</TableCell>

                  {/* Status */}
                  <TableCell>
                    {status}
                  </TableCell>

                  {/* PI Financial Bid */}
                  <TableCell className="text-right font-semibold border-l">
                    {bestBid !== '-' ? `$${parseFloat(bestBid).toFixed(2)}` : '-'}
                  </TableCell>

                  {/* PI Financial Ask */}
                  <TableCell className="text-right font-semibold">
                    {bestAsk !== '-' ? `$${parseFloat(bestAsk).toFixed(2)}` : '-'}
                  </TableCell>

                  {/* PI Financial Price */}
                  <TableCell className="text-right font-semibold">
                    <span className="inline-flex items-center gap-1">
                      ${piPrice.toFixed(2)}
                      {priceArrow && (
                        <span className={`text-lg font-bold transition-opacity duration-300 ${arrowColor}`}>
                          {priceArrow}
                        </span>
                      )}
                    </span>
                  </TableCell>

                  {/* PI Financial Change % */}
                  <TableCell className={`text-right font-semibold ${piChangeColor}`}>
                    {piChangeRate >= 0 ? '+' : ''}{piChangeRate.toFixed(2)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Show More Button */}
        {hasMore && (
          <div className="mt-4 text-center">
            <Button onClick={() => setItemsToShow(prev => prev + 10)}>
              Show More ({filteredInstruments.length - itemsToShow} remaining)
            </Button>
          </div>
        )}

        {/* Show All / Show Less */}
        {itemsToShow > 10 && (
          <div className="mt-2 text-center">
            <Button variant="secondary" onClick={() => setItemsToShow(10)}>
              Show Less
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

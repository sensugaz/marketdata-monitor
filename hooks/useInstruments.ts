'use client';

import { useEffect, useState } from 'react';
import { useMarketStore } from '@/store/marketStore';

const API_URL = 'https://marketdata.prod.pi.financial/marketdata-migrationproxy/cgs/v2/market/filter/instruments';

interface Instrument {
  venue: string;
  symbol: string;
  friendlyName: string;
  logo: string;
  price: string;
  priceChange: string;
  priceChangeRatio: string;
  unit: string;
  totalValue: string;
  totalVolume: string;
}

interface InstrumentCategory {
  order: number;
  instrumentType: string;
  instrumentCategory: string;
  instrumentList: Instrument[];
}

interface ApiResponse {
  code: string;
  message: string;
  response: {
    instrumentCategoryList: InstrumentCategory[];
  };
}

export function useInstruments() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setWatchedSymbols, setInstrumentsLoaded } = useMarketStore();

  useEffect(() => {
    async function fetchInstruments() {
      try {
        setLoading(true);
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterList: [29929],
            groupName: 'Global Equities',
            subGroupName: 'Stocks',
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        if (data.code === '0' && data.response.instrumentCategoryList.length > 0) {
          const allInstruments = data.response.instrumentCategoryList.flatMap(
            (category) => category.instrumentList
          );

          setInstruments(allInstruments);

          // Set watched symbols in store
          const watchedSymbols = allInstruments.map((inst) => ({
            symbol: inst.symbol,
            market: inst.venue,
          }));

          setWatchedSymbols(watchedSymbols);
          setInstrumentsLoaded(true);
        } else {
          throw new Error(data.message || 'Failed to fetch instruments');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching instruments:', err);
        setInstrumentsLoaded(false);
      } finally {
        setLoading(false);
      }
    }

    fetchInstruments();
  }, [setWatchedSymbols, setInstrumentsLoaded]);

  return { instruments, loading, error };
}

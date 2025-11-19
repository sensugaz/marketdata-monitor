'use client';

import { useMarketStore } from '@/store/marketStore';
import { format } from 'date-fns';
import { useState } from 'react';

export function LogsPanel() {
  const { logs, clearLogs } = useMarketStore();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const levelColors = {
    success: 'text-green-600 bg-green-50',
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
  };

  // Apply filters
  let filteredLogs = logs;

  // Filter by level
  if (levelFilter !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.level === levelFilter);
  }

  // Filter by type (sent/received/etc.)
  if (typeFilter !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.type === typeFilter);
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-black">WebSocket Logs</h2>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 text-sm border rounded-lg text-black"
          >
            <option value="all">All Types</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
            <option value="open">Open</option>
            <option value="close">Close</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1 text-sm border rounded-lg text-black"
          >
            <option value="all">All Levels</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-black text-center py-8">No logs to display</p>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg ${levelColors[log.level]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase">{log.type}</span>
                    <span className="text-xs opacity-70">
                      {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                    </span>
                  </div>
                  <p className="text-sm">{log.message}</p>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:underline">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

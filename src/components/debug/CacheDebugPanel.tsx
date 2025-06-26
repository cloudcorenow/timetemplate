import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, Trash2 } from 'lucide-react';
import { useRequestStore } from '../../store/requestStore';
import { useNotificationStore } from '../../store/notificationStore';

const CacheDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const requestStore = useRequestStore();
  const notificationStore = useNotificationStore();

  // Auto-refresh cache info every 2 seconds when panel is open
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    
    const interval = setInterval(() => {
      // Force re-render to update cache ages
      setIsOpen(true);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const requestCacheInfo = requestStore.getCacheInfo();
  const notificationCacheInfo = notificationStore.getCacheInfo();

  const formatAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
        title="Open Cache Debug Panel"
      >
        <Database size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-xl border border-gray-200">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Database size={16} className="mr-2" />
          Cache Debug Panel
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="mr-2"
          />
          Auto-refresh
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              requestStore.forceRefresh();
              notificationStore.forceRefresh();
            }}
            className="flex items-center rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            <RefreshCw size={12} className="mr-1" />
            Refresh All
          </button>
          <button
            onClick={() => {
              requestStore.invalidateCache();
              notificationStore.invalidateCache();
            }}
            className="flex items-center rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            <Trash2 size={12} className="mr-1" />
            Clear Cache
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Request Store Cache */}
        <div className="rounded bg-gray-50 p-3">
          <h4 className="mb-2 font-medium text-gray-700">Request Store</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Cache Size:</span>
              <span className="font-mono">{requestStore.cache.size} entries</span>
            </div>
            <div className="flex justify-between">
              <span>Loading:</span>
              <span className={requestStore.isLoading ? 'text-orange-600' : 'text-green-600'}>
                {requestStore.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            {requestStore.error && (
              <div className="text-red-600">
                Error: {requestStore.error}
              </div>
            )}
          </div>
          
          {Object.entries(requestCacheInfo).map(([key, info]) => (
            <div key={key} className="mt-2 rounded bg-white p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{key}</span>
                <div className="flex items-center space-x-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-xs">{formatAge(info.age)}</span>
                  <span className={`text-xs ${info.fresh ? 'text-green-600' : 'text-orange-600'}`}>
                    {info.fresh ? '✓' : '⚠'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notification Store Cache */}
        <div className="rounded bg-gray-50 p-3">
          <h4 className="mb-2 font-medium text-gray-700">Notification Store</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Cache Size:</span>
              <span className="font-mono">{notificationStore.cache.size} entries</span>
            </div>
            <div className="flex justify-between">
              <span>Loading:</span>
              <span className={notificationStore.isLoading ? 'text-orange-600' : 'text-green-600'}>
                {notificationStore.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Unread Count:</span>
              <span className="font-mono">{notificationStore.unreadCount}</span>
            </div>
          </div>
          
          {Object.entries(notificationCacheInfo).map(([key, info]) => (
            <div key={key} className="mt-2 rounded bg-white p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{key}</span>
                <div className="flex items-center space-x-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-xs">{formatAge(info.age)}</span>
                  <span className={`text-xs ${info.fresh ? 'text-green-600' : 'text-orange-600'}`}>
                    {info.fresh ? '✓' : '⚠'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded bg-blue-50 p-2 text-xs text-blue-700">
        <strong>Legend:</strong> ✓ = Fresh (≤30s), ⚠ = Stale (&gt;30s)
      </div>
    </div>
  );
};

export default CacheDebugPanel;
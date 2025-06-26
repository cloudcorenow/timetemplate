import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Clock, X, Download, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface ClientLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
  source: 'client';
}

const ClientLogsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ClientLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Initialize logs with some sample data
  useEffect(() => {
    const initialLogs: ClientLog[] = [
      {
        id: 'log-1',
        timestamp: new Date(),
        level: 'info',
        message: 'Application initialized',
        source: 'client',
        details: { version: '2.0.0', environment: 'production' }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 60000),
        level: 'error',
        message: 'Failed to load resource: /vite.svg',
        source: 'client',
        details: { url: '/vite.svg', status: 404 }
      }
    ];
    
    setLogs(initialLogs);
    setFilteredLogs(initialLogs);
    
    // Capture console logs if enabled
    if (autoCapture) {
      setupConsoleCapture();
    }
    
    return () => {
      // Clean up console overrides
      if (autoCapture) {
        cleanupConsoleCapture();
      }
    };
  }, []);
  
  // Apply filters when logs, search term, or level filter changes
  useEffect(() => {
    let filtered = [...logs];
    
    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter]);
  
  // Set up console capture
  const setupConsoleCapture = () => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Override console methods
    console.log = (...args: any[]) => {
      addLog('info', args);
      originalConsole.log(...args);
    };
    
    console.info = (...args: any[]) => {
      addLog('info', args);
      originalConsole.info(...args);
    };
    
    console.warn = (...args: any[]) => {
      addLog('warning', args);
      originalConsole.warn(...args);
    };
    
    console.error = (...args: any[]) => {
      addLog('error', args);
      originalConsole.error(...args);
    };
    
    console.debug = (...args: any[]) => {
      addLog('debug', args);
      originalConsole.debug(...args);
    };
    
    // Store original methods for cleanup
    (window as any).__originalConsole = originalConsole;
  };
  
  // Clean up console capture
  const cleanupConsoleCapture = () => {
    const originalConsole = (window as any).__originalConsole;
    if (originalConsole) {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    }
  };
  
  // Add a log entry
  const addLog = (level: 'info' | 'warning' | 'error' | 'debug', args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const details = args.length > 0 && typeof args[0] === 'object' ? args[0] : undefined;
    
    const newLog: ClientLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      details,
      source: 'client'
    };
    
    setLogs(prevLogs => [...prevLogs, newLog]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };
  
  // Download logs
  const downloadLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Toggle log details
  const toggleLogDetails = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };
  
  // Get level badge
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge variant="info" size="sm">Info</Badge>;
      case 'warning':
        return <Badge variant="warning" size="sm">Warning</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">Error</Badge>;
      case 'debug':
        return <Badge variant="default" size="sm">Debug</Badge>;
      default:
        return null;
    }
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
        title="Open Client Logs"
      >
        <Database size={20} />
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[80vh] rounded-lg bg-white shadow-xl border border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Database size={16} className="mr-2 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Client Logs</h3>
          <Badge variant="info" size="sm" className="ml-2">
            {logs.length}
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <Filter size={16} />
          </button>
          <button
            onClick={downloadLogs}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Download Logs"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded border border-gray-300 pl-7 pr-2 py-1 text-xs"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1 text-xs"
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-capture"
                  checked={autoCapture}
                  onChange={(e) => {
                    setAutoCapture(e.target.checked);
                    if (e.target.checked) {
                      setupConsoleCapture();
                    } else {
                      cleanupConsoleCapture();
                    }
                  }}
                  className="h-3 w-3"
                />
                <label htmlFor="auto-capture" className="ml-1 text-xs text-gray-600">
                  Capture console logs
                </label>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={clearLogs}
                className="py-1 px-2 text-xs"
              >
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-2">
        {filteredLogs.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-500">No logs to display</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`rounded border p-2 text-xs ${
                  log.level === 'error' ? 'border-red-200 bg-red-50' :
                  log.level === 'warning' ? 'border-amber-200 bg-amber-50' :
                  log.level === 'info' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleLogDetails(log.id)}
                >
                  <div className="flex items-center">
                    <span className="text-gray-500 font-mono">
                      {format(log.timestamp, 'HH:mm:ss')}
                    </span>
                    <span className="ml-2">
                      {getLevelBadge(log.level)}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    {expandedLogId === log.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
                
                <div className="mt-1 font-mono break-all">
                  {log.message.length > 100 && expandedLogId !== log.id
                    ? `${log.message.substring(0, 100)}...`
                    : log.message
                  }
                </div>
                
                {expandedLogId === log.id && log.details && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="bg-white rounded p-2 overflow-x-auto">
                      <pre className="text-xs">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          <span>Last updated: {format(new Date(), 'HH:mm:ss')}</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Add a test log
            addLog('info', ['Manual test log', { timestamp: new Date() }]);
          }}
          className="py-1 px-2 text-xs"
        >
          Test Log
        </Button>
      </div>
    </div>
  );
};

export default ClientLogsPanel;
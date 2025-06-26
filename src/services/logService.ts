// Log levels
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

// Log categories
export type LogCategory = 'system' | 'auth' | 'request' | 'database' | 'email' | 'user' | 'ui';

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  source: 'client' | 'server';
  userId?: string;
  userName?: string;
  userRole?: string;
}

// In-memory log storage
let logs: LogEntry[] = [];
const MAX_LOGS = 1000; // Maximum number of logs to keep in memory

// Add a log entry
export const addLog = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  details?: any,
  user?: { id: string; name: string; role: string }
): LogEntry => {
  const logEntry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    level,
    category,
    message,
    details,
    source: 'client',
    ...(user && {
      userId: user.id,
      userName: user.name,
      userRole: user.role
    })
  };
  
  // Add to in-memory storage
  logs = [logEntry, ...logs].slice(0, MAX_LOGS);
  
  // Log to console for development
  if (process.env.NODE_ENV === 'development') {
    const consoleMethod = {
      info: console.info,
      warning: console.warn,
      error: console.error,
      debug: console.debug
    }[level] || console.log;
    
    consoleMethod(`[${category.toUpperCase()}] ${message}`, details || '');
  }
  
  return logEntry;
};

// Get all logs
export const getLogs = (
  filters?: {
    level?: LogLevel;
    category?: LogCategory;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }
): LogEntry[] => {
  let filteredLogs = [...logs];
  
  if (filters) {
    // Filter by level
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }
    
    // Filter by category
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }
    
    // Filter by date range
    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.userName?.toLowerCase().includes(searchTerm) ||
        log.userRole?.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm)
      );
    }
  }
  
  // Sort by timestamp (newest first)
  return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Clear all logs
export const clearLogs = (): void => {
  logs = [];
};

// Export a logger object for easy use
export const logger = {
  info: (category: LogCategory, message: string, details?: any, user?: { id: string; name: string; role: string }) => 
    addLog('info', category, message, details, user),
  
  warning: (category: LogCategory, message: string, details?: any, user?: { id: string; name: string; role: string }) => 
    addLog('warning', category, message, details, user),
  
  error: (category: LogCategory, message: string, details?: any, user?: { id: string; name: string; role: string }) => 
    addLog('error', category, message, details, user),
  
  debug: (category: LogCategory, message: string, details?: any, user?: { id: string; name: string; role: string }) => 
    addLog('debug', category, message, details, user)
};

// Setup console capture
export const setupConsoleCapture = (user?: { id: string; name: string; role: string }) => {
  if (typeof window === 'undefined') return;
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  
  // Override console methods
  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    addLog('info', 'system', message, args[0], user);
    originalConsole.log(...args);
  };
  
  console.info = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    addLog('info', 'system', message, args[0], user);
    originalConsole.info(...args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    addLog('warning', 'system', message, args[0], user);
    originalConsole.warn(...args);
  };
  
  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    addLog('error', 'system', message, args[0], user);
    originalConsole.error(...args);
  };
  
  console.debug = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    addLog('debug', 'system', message, args[0], user);
    originalConsole.debug(...args);
  };
  
  // Store original methods for cleanup
  (window as any).__originalConsole = originalConsole;
  
  // Capture window errors
  window.addEventListener('error', (event) => {
    addLog('error', 'system', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.toString()
    }, user);
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    addLog('error', 'system', 'Unhandled Promise Rejection', {
      reason: event.reason?.toString()
    }, user);
  });
  
  return () => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  };
};

// Clean up console capture
export const cleanupConsoleCapture = () => {
  if (typeof window === 'undefined') return;
  
  const originalConsole = (window as any).__originalConsole;
  if (originalConsole) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }
};

export default {
  addLog,
  getLogs,
  clearLogs,
  logger,
  setupConsoleCapture,
  cleanupConsoleCapture
};
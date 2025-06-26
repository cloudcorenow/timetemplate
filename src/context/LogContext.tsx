import React, { createContext, useContext, useEffect, useState } from 'react';
import { LogLevel, LogCategory, LogEntry, addLog, getLogs, clearLogs, setupConsoleCapture, cleanupConsoleCapture } from '../services/logService';
import { useAuth } from './AuthContext';

interface LogContextType {
  logs: LogEntry[];
  addLog: (level: LogLevel, category: LogCategory, message: string, details?: any) => void;
  clearLogs: () => void;
  getLogs: (filters?: {
    level?: LogLevel;
    category?: LogCategory;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) => LogEntry[];
  isCapturingConsole: boolean;
  setCapturingConsole: (capture: boolean) => void;
}

const LogContext = createContext<LogContextType>({
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
  getLogs: () => [],
  isCapturingConsole: false,
  setCapturingConsole: () => {}
});

export const useLog = () => useContext(LogContext);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCapturingConsole, setIsCapturingConsole] = useState(false);
  const { user } = useAuth();
  
  // Initialize console capture
  useEffect(() => {
    // Only capture console in development mode by default
    const shouldCapture = process.env.NODE_ENV === 'development';
    setIsCapturingConsole(shouldCapture);
    
    if (shouldCapture) {
      const cleanup = setupConsoleCapture(user || undefined);
      return cleanup;
    }
  }, [user]);
  
  // Update logs when capturing console changes
  useEffect(() => {
    if (isCapturingConsole) {
      const cleanup = setupConsoleCapture(user || undefined);
      return cleanup;
    } else {
      cleanupConsoleCapture();
    }
  }, [isCapturingConsole, user]);
  
  // Add a log entry
  const addLogEntry = (level: LogLevel, category: LogCategory, message: string, details?: any) => {
    const logEntry = addLog(level, category, message, details, user || undefined);
    setLogs(prevLogs => [logEntry, ...prevLogs]);
    return logEntry;
  };
  
  // Clear all logs
  const clearAllLogs = () => {
    clearLogs();
    setLogs([]);
  };
  
  // Get filtered logs
  const getFilteredLogs = (filters?: {
    level?: LogLevel;
    category?: LogCategory;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) => {
    return getLogs(filters);
  };
  
  const value = {
    logs,
    addLog: addLogEntry,
    clearLogs: clearAllLogs,
    getLogs: getFilteredLogs,
    isCapturingConsole,
    setCapturingConsole: setIsCapturingConsole
  };
  
  return (
    <LogContext.Provider value={value}>
      {children}
    </LogContext.Provider>
  );
};

export default LogContext;
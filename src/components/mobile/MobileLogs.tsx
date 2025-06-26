import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Download, Clock, User, FileText, AlertTriangle, Info, CheckCircle, XCircle, ChevronDown, ChevronUp, Calendar, Database } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TouchOptimizedCard from './TouchOptimizedCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { apiService } from '../../services/api';

// Log entry type definition
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'system' | 'auth' | 'request' | 'database' | 'email' | 'user';
  message: string;
  details?: any;
  userId?: string;
  userName?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
}

const MobileLogs: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch logs from the API
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLogs();
      setLogs(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to load logs. Please try again.');
      
      // If API fails, use mock data for demo
      setLogs(generateMockLogs());
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock logs for demo purposes
  const generateMockLogs = (): LogEntry[] => {
    const mockLogs: LogEntry[] = [];
    const levels = ['info', 'warning', 'error', 'debug'];
    const categories = ['system', 'auth', 'request', 'database', 'email', 'user'];
    const users = [
      { id: '1', name: 'Juan Carranza', role: 'employee' },
      { id: '2', name: 'Ana Ramirez', role: 'manager' },
      { id: '5', name: 'Admin User', role: 'admin' }
    ];
    
    const messages = [
      { level: 'info', category: 'auth', message: 'User logged in successfully' },
      { level: 'info', category: 'request', message: 'Time off request created' },
      { level: 'info', category: 'request', message: 'Time off request approved' },
      { level: 'info', category: 'email', message: 'Email notification sent to payroll' },
      { level: 'warning', category: 'auth', message: 'Failed login attempt' },
      { level: 'warning', category: 'system', message: 'High API request volume detected' },
      { level: 'error', category: 'database', message: 'Database query failed' },
      { level: 'error', category: 'email', message: 'Failed to send email notification' },
      { level: 'debug', category: 'system', message: 'Application started' },
      { level: 'debug', category: 'database', message: 'Database connection established' }
    ];
    
    // Generate 50 random logs
    for (let i = 0; i < 50; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 14)); // Last 2 weeks
      randomDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      
      const randomMessageIndex = Math.floor(Math.random() * messages.length);
      const messageInfo = messages[randomMessageIndex];
      
      const randomUserIndex = Math.floor(Math.random() * users.length);
      const userInfo = users[randomUserIndex];
      
      const details = {
        path: messageInfo.category === 'request' ? '/api/requests' : 
              messageInfo.category === 'auth' ? '/api/auth/login' : 
              messageInfo.category === 'email' ? '/api/notifications' : '/api',
        method: messageInfo.category === 'request' ? (Math.random() > 0.5 ? 'POST' : 'PATCH') : 'GET',
        statusCode: messageInfo.level === 'error' ? 500 : 200,
        duration: Math.floor(Math.random() * 500) + 50, // 50-550ms
        requestId: `req-${Math.random().toString(36).substring(2, 10)}`
      };
      
      mockLogs.push({
        id: `log-${i}-${Math.random().toString(36).substring(2, 10)}`,
        timestamp: randomDate.toISOString(),
        level: messageInfo.level as any,
        category: messageInfo.category as any,
        message: messageInfo.message,
        details: details,
        userId: userInfo.id,
        userName: userInfo.name,
        userRole: userInfo.role,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
    }
    
    // Sort by timestamp (newest first)
    return mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Initial fetch
  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    } else {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Apply filters
  useEffect(() => {
    let filtered = [...logs];
    
    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      
      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'yesterday') {
        cutoff.setDate(cutoff.getDate() - 1);
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (dateFilter === 'month') {
        cutoff.setMonth(cutoff.getMonth() - 1);
      }
      
      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoff);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.userName?.toLowerCase().includes(term) ||
        log.userRole?.toLowerCase().includes(term) ||
        log.ip?.includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, levelFilter, categoryFilter, dateFilter, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
  };

  const handleDownload = () => {
    // Create a JSON file with the logs
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeoff-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleLogDetails = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Database size={16} className="text-gray-500" />;
      case 'auth':
        return <User size={16} className="text-blue-500" />;
      case 'request':
        return <FileText size={16} className="text-green-500" />;
      case 'database':
        return <Database size={16} className="text-purple-500" />;
      case 'email':
        return <Mail size={16} className="text-orange-500" />;
      case 'user':
        return <User size={16} className="text-indigo-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'debug':
        return <CheckCircle size={16} className="text-gray-500" />;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            <button
              onClick={() => setLevelFilter('all')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                levelFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setLevelFilter('info')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                levelFilter === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setLevelFilter('warning')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                levelFilter === 'warning'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setLevelFilter('error')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                levelFilter === 'error'
                  ? 'bg-blue-600 text-white'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              Error
            </button>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          >
            <Filter size={18} />
          </button>
        </div>
        
        {showFilters && (
          <TouchOptimizedCard className="p-4 bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="system">System</option>
                  <option value="auth">Authentication</option>
                  <option value="request">Requests</option>
                  <option value="database">Database</option>
                  <option value="email">Email</option>
                  <option value="user">User Activity</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-refresh"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="auto-refresh" className="ml-2 text-sm text-gray-700">
                    Auto-refresh
                  </label>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                  loading={isRefreshing}
                  icon={<RefreshCw size={14} />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </TouchOptimizedCard>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <TouchOptimizedCard className="p-3">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'info').length}
              </p>
              <p className="text-xs text-gray-600">Info</p>
            </div>
          </div>
        </TouchOptimizedCard>
        
        <TouchOptimizedCard className="p-3">
          <div className="flex items-center">
            <div className="rounded-lg bg-amber-100 p-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'warning').length}
              </p>
              <p className="text-xs text-gray-600">Warnings</p>
            </div>
          </div>
        </TouchOptimizedCard>
        
        <TouchOptimizedCard className="p-3">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-2">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => log.level === 'error').length}
              </p>
              <p className="text-xs text-gray-600">Errors</p>
            </div>
          </div>
        </TouchOptimizedCard>
        
        <TouchOptimizedCard className="p-3">
          <div className="flex items-center">
            <div className="rounded-lg bg-gray-100 p-2">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return logDate >= today;
                }).length}
              </p>
              <p className="text-xs text-gray-600">Today</p>
            </div>
          </div>
        </TouchOptimizedCard>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
        </div>
      ) : error ? (
        <TouchOptimizedCard className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Logs</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            icon={<RefreshCw size={16} />}
          >
            Try Again
          </Button>
        </TouchOptimizedCard>
      ) : filteredLogs.length === 0 ? (
        <TouchOptimizedCard className="p-8 text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
          <p className="text-gray-500">
            {searchTerm || levelFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No system logs have been recorded yet'
            }
          </p>
        </TouchOptimizedCard>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <TouchOptimizedCard key={log.id} className="p-4">
              <div 
                className="flex items-start justify-between"
                onClick={() => toggleLogDetails(log.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    {getLevelIcon(log.level)}
                    <span className="ml-2 font-medium text-gray-900 dark:text-white truncate">
                      {log.message}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} className="mr-1" />
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    
                    <span className="mx-2">•</span>
                    
                    <span className="capitalize">{log.category}</span>
                    
                    {log.userName && (
                      <>
                        <span className="mx-2">•</span>
                        <User size={12} className="mr-1" />
                        {log.userName}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center ml-3">
                  {getLevelBadge(log.level)}
                  {expandedLogId === log.id ? (
                    <ChevronUp size={16} className="ml-2 text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="ml-2 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Expanded details */}
              {expandedLogId === log.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-3">
                    {log.details && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Details</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 overflow-x-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {log.userId && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">User</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">ID:</span>
                              <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">{log.userId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Name:</span>
                              <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">{log.userName}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Role:</span>
                              <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">{log.userRole}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">IP:</span>
                              <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">{log.ip}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {log.userAgent && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">User Agent</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                          <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">{log.userAgent}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TouchOptimizedCard>
          ))}
        </div>
      )}
      
      {/* Download Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button
          onClick={handleDownload}
          size="sm"
          className="rounded-full shadow-lg"
          icon={<Download size={16} />}
        >
          Export
        </Button>
      </div>
    </div>
  );
};

export default MobileLogs;
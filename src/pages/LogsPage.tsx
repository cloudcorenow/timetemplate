import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Download, Clock, User, FileText, AlertTriangle, Info, CheckCircle, XCircle, ChevronDown, ChevronUp, Calendar, Database } from 'lucide-react';
import { format } from 'date-fns';
import GradientBackground from '../components/ui/GradientBackground';
import AnimatedCard from '../components/ui/AnimatedCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { apiService } from '../services/api';

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

const LogsPage: React.FC = () => {
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
  const [autoRefresh, setAutoRefresh] = useState(false);
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

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

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
      <GradientBackground>
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
            <p className="mt-1 text-gray-600">
              Monitor system activity and troubleshoot issues
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto-refresh" className="ml-2 text-sm text-gray-700">
                Auto-refresh
              </label>
            </div>
            
            <Button
              variant="secondary"
              onClick={handleRefresh}
              loading={isRefreshing}
              icon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
            
            <Button
              onClick={handleDownload}
              icon={<Download size={16} />}
            >
              Download Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatedCard className="p-6" delay={100}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="system">System</option>
                <option value="auth">Authentication</option>
                <option value="request">Requests</option>
                <option value="database">Database</option>
                <option value="email">Email</option>
                <option value="user">User Activity</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter size={16} />}
              >
                {showFilters ? 'Hide Filters' : 'More Filters'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Users</option>
                  <option value="1">Juan Carranza</option>
                  <option value="2">Ana Ramirez</option>
                  <option value="5">Admin User</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  placeholder="Filter by IP..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedCard className="p-6" delay={200}>
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => log.level === 'info').length}
                </p>
                <p className="text-sm text-gray-600">Info Logs</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={300}>
            <div className="flex items-center">
              <div className="rounded-lg bg-amber-100 p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => log.level === 'warning').length}
                </p>
                <p className="text-sm text-gray-600">Warnings</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={400}>
            <div className="flex items-center">
              <div className="rounded-lg bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => log.level === 'error').length}
                </p>
                <p className="text-sm text-gray-600">Errors</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={500}>
            <div className="flex items-center">
              <div className="rounded-lg bg-gray-100 p-3">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(log => {
                    const logDate = new Date(log.timestamp);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return logDate >= today;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Today's Logs</p>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading logs...</p>
            </div>
          </div>
        ) : error ? (
          <AnimatedCard className="p-8 text-center" delay={600}>
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Logs</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              icon={<RefreshCw size={16} />}
            >
              Try Again
            </Button>
          </AnimatedCard>
        ) : filteredLogs.length === 0 ? (
          <AnimatedCard className="p-8 text-center" delay={600}>
            <Database size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-500">
              {searchTerm || levelFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No system logs have been recorded yet'
              }
            </p>
          </AnimatedCard>
        ) : (
          <AnimatedCard className="overflow-hidden" delay={600}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {getLevelIcon(log.level)}
                            <span className="ml-2">{getLevelBadge(log.level)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {getCategoryIcon(log.category)}
                            <span className="ml-2 text-sm text-gray-700 capitalize">{log.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md truncate text-sm text-gray-900">
                            {log.message}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {log.userName ? (
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{log.userName}</span>
                              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                {log.userRole}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">System</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => toggleLogDetails(log.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {expandedLogId === log.id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded details row */}
                      {expandedLogId === log.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              <h4 className="font-medium text-gray-900 mb-2">Log Details</h4>
                              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <div>
                                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Basic Information</h5>
                                  <div className="bg-white rounded-md p-3 border border-gray-200">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <p className="text-xs text-gray-500">Log ID</p>
                                        <p className="font-mono text-xs">{log.id}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Timestamp</p>
                                        <p className="font-mono text-xs">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Level</p>
                                        <p className="font-mono text-xs">{log.level.toUpperCase()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Category</p>
                                        <p className="font-mono text-xs">{log.category.toUpperCase()}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">User Information</h5>
                                  <div className="bg-white rounded-md p-3 border border-gray-200">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <p className="text-xs text-gray-500">User ID</p>
                                        <p className="font-mono text-xs">{log.userId || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">User Name</p>
                                        <p className="font-mono text-xs">{log.userName || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Role</p>
                                        <p className="font-mono text-xs">{log.userRole || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">IP Address</p>
                                        <p className="font-mono text-xs">{log.ip || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Message</h5>
                                <div className="bg-white rounded-md p-3 border border-gray-200">
                                  <p className="text-sm">{log.message}</p>
                                </div>
                              </div>
                              
                              {log.details && (
                                <div className="mt-4">
                                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Details</h5>
                                  <div className="bg-white rounded-md p-3 border border-gray-200 overflow-x-auto">
                                    <pre className="text-xs font-mono whitespace-pre-wrap">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              
                              {log.userAgent && (
                                <div className="mt-4">
                                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">User Agent</h5>
                                  <div className="bg-white rounded-md p-3 border border-gray-200">
                                    <p className="text-xs font-mono break-all">{log.userAgent}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        )}
      </div>
    </GradientBackground>
  );
};

export default LogsPage;
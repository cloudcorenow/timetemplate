import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRequestStore } from '../store/requestStore';
import { useToast } from '../hooks/useToast';
import { TimeOffRequest } from '../types/request';
import { Check, X, CalendarDays, Users, Clock, Plus, RefreshCw, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedStatsCard from '../components/dashboard/EnhancedStatsCard';
import EnhancedRequestCard from '../components/dashboard/EnhancedRequestCard';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const EnhancedDashboardPage: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const { requests, fetchRequests, isLoading, forceRefresh, getCacheInfo } = useRequestStore();
  const { addToast } = useToast();
  const [filteredRequests, setFilteredRequests] = useState<TimeOffRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    // Filter requests based on user role
    let baseRequests = requests;
    
    if (!isAdmin && !isManager && user) {
      baseRequests = requests.filter(request => request.employee.id === user.id);
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      baseRequests = baseRequests.filter(request => request.status === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      baseRequests = baseRequests.filter(request => 
        request.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(baseRequests);
  }, [requests, user, isManager, isAdmin, activeFilter, searchTerm]);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
      addToast({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Dashboard data has been updated successfully.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh data. Please try again.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate stats based on what the user can see
  const visibleRequests = (isAdmin || isManager) ? requests : requests.filter(r => r.employee.id === user?.id);
  
  const pendingCount = visibleRequests.filter(r => r.status === 'pending').length;
  const approvedCount = visibleRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = visibleRequests.filter(r => r.status === 'rejected').length;
  
  // For employee count, show unique employees in visible requests
  const employeeCount = isAdmin || isManager
    ? new Set(requests.map(r => r.employee.id)).size
    : 0;

  // Get cache info for debugging
  const cacheInfo = getCacheInfo();
  const requestsCacheAge = cacheInfo.requests?.age || 0;
  const requestsCacheFresh = cacheInfo.requests?.fresh || false;

  if (isLoading && requests.length === 0) {
    return (
      <GradientBackground>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground className="min-h-screen">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Time Off'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isAdmin
                ? 'Manage time off requests across all departments'
                : isManager
                ? 'Manage time off requests across the organization'
                : 'View and manage your time off requests'}
            </p>
            
            {/* Cache status indicator */}
            {requestsCacheAge > 0 && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Clock size={14} className="mr-1" />
                Data cached {requestsCacheAge}s ago
                {!requestsCacheFresh && (
                  <span className="ml-1 text-orange-600">(stale)</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={handleForceRefresh}
              loading={isRefreshing}
              icon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
            
            {!isManager && !isAdmin && (
              <Button
                onClick={() => navigate('/request')}
                icon={<Plus size={16} />}
              >
                New Request
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced info for managers/admins */}
        {(isManager || isAdmin) && (
          <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-100" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">
                  {isAdmin ? 'Administrator Access' : 'Manager Access'}
                </h3>
                <p className="text-blue-100">
                  You can view and approve/reject requests from all employees across the organization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <EnhancedStatsCard 
            title="Pending Requests" 
            value={pendingCount.toString()} 
            icon={<Clock className="text-amber-600" size={24} />}
            color="bg-amber-100"
            textColor="text-amber-700"
            trend={{ value: 12, label: 'vs last week', isPositive: false }}
            delay={0}
          />
          <EnhancedStatsCard 
            title="Approved Requests" 
            value={approvedCount.toString()} 
            icon={<Check className="text-green-600" size={24} />}
            color="bg-green-100"
            textColor="text-green-700"
            trend={{ value: 8, label: 'vs last week', isPositive: true }}
            delay={100}
          />
          <EnhancedStatsCard 
            title="Rejected Requests" 
            value={rejectedCount.toString()} 
            icon={<X className="text-red-600" size={24} />}
            color="bg-red-100"
            textColor="text-red-700"
            trend={{ value: 3, label: 'vs last week', isPositive: false }}
            delay={200}
          />
          {(isManager || isAdmin) ? (
            <EnhancedStatsCard 
              title="Total Employees" 
              value={employeeCount.toString()} 
              icon={<Users className="text-blue-600" size={24} />}
              color="bg-blue-100"
              textColor="text-blue-700"
              delay={300}
            />
          ) : (
            <EnhancedStatsCard 
              title="Upcoming Time Off" 
              value={requests.filter(r => 
                r.employee.id === user?.id && 
                r.status === 'approved' && 
                new Date(r.startDate) > new Date()
              ).length.toString()} 
              icon={<CalendarDays className="text-purple-600" size={24} />}
              color="bg-purple-100"
              textColor="text-purple-700"
              delay={300}
            />
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-white bg-opacity-20 px-2 py-0.5 text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 lg:w-64"
            />
          </div>
        </div>

        {/* Request List */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No requests found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm 
                ? `No requests match "${searchTerm}"`
                : activeFilter === 'all'
                ? 'No time off requests have been submitted yet'
                : `No ${activeFilter} requests found`
              }
            </p>
            {!isManager && !isAdmin && activeFilter === 'all' && !searchTerm && (
              <Button
                className="mt-4"
                onClick={() => navigate('/request')}
                icon={<Plus size={16} />}
              >
                Create Your First Request
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request, index) => (
              <EnhancedRequestCard 
                key={request.id} 
                request={request} 
                isManager={isManager || isAdmin}
                delay={index * 50}
              />
            ))}
          </div>
        )}
      </div>
    </GradientBackground>
  );
};

export default EnhancedDashboardPage;
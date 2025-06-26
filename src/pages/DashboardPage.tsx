import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRequestStore } from '../store/requestStore';
import { TimeOffRequest } from '../types/request';
import { Check, X, CalendarDays, Users, Clock, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import RequestList from '../components/dashboard/RequestList';

const DashboardPage: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const { requests, fetchRequests, isLoading, forceRefresh, getCacheInfo } = useRequestStore();
  const [filteredRequests, setFilteredRequests] = useState<TimeOffRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    // Filter requests based on user role
    if (isAdmin || isManager) {
      // Managers and Admins see ALL requests across the organization
      setFilteredRequests(requests);
    } else if (user) {
      // Employees only see their own requests
      setFilteredRequests(
        requests.filter(request => request.employee.id === user.id)
      );
    }
  }, [requests, user, isManager, isAdmin]);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filterRequests = (filter: string) => {
    setActiveFilter(filter);

    let baseRequests = requests;
    
    // Apply role-based filtering first
    if (!isAdmin && !isManager && user) {
      baseRequests = requests.filter(request => request.employee.id === user.id);
    }
    // For managers and admins, baseRequests = all requests (no filtering)

    switch (filter) {
      case 'pending':
        setFilteredRequests(
          baseRequests.filter(request => request.status === 'pending')
        );
        break;
      case 'approved':
        setFilteredRequests(
          baseRequests.filter(request => request.status === 'approved')
        );
        break;
      case 'rejected':
        setFilteredRequests(
          baseRequests.filter(request => request.status === 'rejected')
        );
        break;
      default:
        setFilteredRequests(baseRequests);
        break;
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Time Off'}
          </h1>
          <p className="mt-1 text-gray-600">
            {isAdmin
              ? 'Manage time off requests across all departments'
              : isManager
              ? 'Manage time off requests across the organization'
              : 'View and manage your time off requests'}
          </p>
          
          {/* Cache status indicator */}
          {requestsCacheAge > 0 && (
            <div className="mt-1 flex items-center text-xs text-gray-500">
              <Clock size={12} className="mr-1" />
              Data cached {requestsCacheAge}s ago
              {!requestsCacheFresh && (
                <span className="ml-1 text-orange-600">(stale)</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Force refresh data"
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {!isManager && !isAdmin && (
            <button
              onClick={() => navigate('/request')}
              className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              New Request
            </button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Pending Requests" 
          value={pendingCount.toString()} 
          icon={<Clock className="text-amber-500" />}
          color="bg-amber-100"
          textColor="text-amber-600" 
        />
        <StatsCard 
          title="Approved Requests" 
          value={approvedCount.toString()} 
          icon={<Check className="text-green-500" />}
          color="bg-green-100"
          textColor="text-green-600"
        />
        <StatsCard 
          title="Rejected Requests" 
          value={rejectedCount.toString()} 
          icon={<X className="text-red-500" />}
          color="bg-red-100"
          textColor="text-red-600"
        />
        {(isManager || isAdmin) ? (
          <StatsCard 
            title="Total Employees" 
            value={employeeCount.toString()} 
            icon={<Users className="text-blue-500" />}
            color="bg-blue-100"
            textColor="text-blue-600"
          />
        ) : (
          <StatsCard 
            title="Upcoming Time Off" 
            value={requests.filter(r => 
              r.employee.id === user?.id && 
              r.status === 'approved' && 
              new Date(r.startDate) > new Date()
            ).length.toString()} 
            icon={<CalendarDays className="text-purple-500" />}
            color="bg-purple-100"
            textColor="text-purple-600"
          />
        )}
      </div>

      {/* Enhanced info for managers/admins */}
      {(isManager || isAdmin) && (
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {isAdmin ? 'Admin Access' : 'Manager Access'}
              </h3>
              <p className="text-sm text-blue-700">
                You can view and approve/reject requests from all employees across the organization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => filterRequests('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => filterRequests('pending')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeFilter === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Pending {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          onClick={() => filterRequests('approved')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeFilter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => filterRequests('rejected')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeFilter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Request List */}
      <RequestList 
        requests={filteredRequests} 
        isManager={isManager || isAdmin} 
      />
    </div>
  );
};

export default DashboardPage;
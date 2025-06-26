import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequestStore } from '../../store/requestStore';
import { useToast } from '../../hooks/useToast';
import { TimeOffRequest } from '../../types/request';
import { Check, X, CalendarDays, Users, Clock, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileRequestCard from './MobileRequestCard';
import TouchOptimizedCard from './TouchOptimizedCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

const MobileDashboard: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const { requests, fetchRequests, isLoading, forceRefresh } = useRequestStore();
  const { addToast } = useToast();
  const [filteredRequests, setFilteredRequests] = useState<TimeOffRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
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

    setFilteredRequests(baseRequests);
  }, [requests, user, isManager, isAdmin, activeFilter]);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
      addToast({
        type: 'success',
        title: 'Refreshed',
        message: 'Dashboard updated successfully.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh data.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate stats
  const visibleRequests = (isAdmin || isManager) ? requests : requests.filter(r => r.employee.id === user?.id);
  const pendingCount = visibleRequests.filter(r => r.status === 'pending').length;
  const approvedCount = visibleRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = visibleRequests.filter(r => r.status === 'rejected').length;
  const employeeCount = isAdmin || isManager ? new Set(requests.map(r => r.employee.id)).size : 0;

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Admin' : isManager ? 'Manager' : 'My Dashboard'}
          </h1>
          <p className="text-sm text-gray-600">
            {isAdmin || isManager ? 'Manage requests' : 'Your time off requests'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <TouchOptimizedCard className="p-4">
          <div className="flex items-center">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </div>
        </TouchOptimizedCard>

        <TouchOptimizedCard className="p-4">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{approvedCount}</p>
              <p className="text-xs text-gray-600">Approved</p>
            </div>
          </div>
        </TouchOptimizedCard>

        <TouchOptimizedCard className="p-4">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-2">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{rejectedCount}</p>
              <p className="text-xs text-gray-600">Rejected</p>
            </div>
          </div>
        </TouchOptimizedCard>

        <TouchOptimizedCard className="p-4">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              {(isManager || isAdmin) ? (
                <Users className="h-5 w-5 text-blue-600" />
              ) : (
                <CalendarDays className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {(isManager || isAdmin) ? employeeCount : 
                 requests.filter(r => r.employee.id === user?.id && r.status === 'approved' && new Date(r.startDate) > new Date()).length}
              </p>
              <p className="text-xs text-gray-600">
                {(isManager || isAdmin) ? 'Employees' : 'Upcoming'}
              </p>
            </div>
          </div>
        </TouchOptimizedCard>
      </div>

      {/* Quick Action */}
      {!isManager && !isAdmin && (
        <TouchOptimizedCard 
          className="p-4 border-2 border-dashed border-blue-300 bg-blue-50"
          onClick={() => navigate('/request')}
        >
          <div className="flex items-center justify-center">
            <Plus className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-700">New Time Off Request</span>
          </div>
        </TouchOptimizedCard>
      )}

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter === 'pending' && pendingCount > 0 && (
              <Badge variant="warning" size="sm" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <TouchOptimizedCard className="p-8 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500 mb-4">
              {activeFilter === 'all' 
                ? 'No time off requests have been submitted yet'
                : `No ${activeFilter} requests found`
              }
            </p>
            {!isManager && !isAdmin && activeFilter === 'all' && (
              <Button
                onClick={() => navigate('/request')}
                icon={<Plus size={16} />}
                size="sm"
              >
                Create Request
              </Button>
            )}
          </TouchOptimizedCard>
        ) : (
          filteredRequests.map((request) => (
            <MobileRequestCard 
              key={request.id} 
              request={request} 
              isManager={isManager || isAdmin}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MobileDashboard;
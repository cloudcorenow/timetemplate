import React, { useState, useEffect } from 'react';
import { Search, X, Clock, User, Calendar, Building2, FileText, ArrowRight } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '../../store/requestStore';
import { TimeOffRequest } from '../../types/request';
import Badge from '../ui/Badge';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearch: React.FC<MobileSearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    requests: TimeOffRequest[];
    employees: any[];
    departments: string[];
  }>({
    requests: [],
    employees: [],
    departments: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { requests } = useRequestStore();

  const recentSearches = [
    { icon: User, text: 'Engineering team', type: 'department' },
    { icon: Calendar, text: 'December 2025', type: 'date' },
    { icon: Clock, text: 'Pending requests', type: 'status' }
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      
      // Simulate search delay
      const timer = setTimeout(() => {
        // Search in requests
        const matchingRequests = requests.filter(request => 
          request.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.type.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
        
        // Search in employees (mock data for now)
        const matchingEmployees = [];
        
        // Search in departments
        const departments = [...new Set(requests.map(r => r.employee.department))];
        const matchingDepartments = departments.filter(dept => 
          dept.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setSearchResults({
          requests: matchingRequests,
          employees: matchingEmployees,
          departments: matchingDepartments
        });
        setIsSearching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults({
        requests: [],
        employees: [],
        departments: []
      });
    }
  }, [searchQuery, requests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToast({
        type: 'info',
        title: 'Search',
        message: `Searching for "${searchQuery}"...`
      });
      onClose();
    }
  };

  const handleResultClick = (type: string, item: any) => {
    if (type === 'request') {
      // Navigate to request details (not implemented yet)
      addToast({
        type: 'info',
        title: 'Request Selected',
        message: `Viewing request from ${item.employee.name}`
      });
    } else if (type === 'employee') {
      // Navigate to employee details (not implemented yet)
      addToast({
        type: 'info',
        title: 'Employee Selected',
        message: `Viewing ${item.name}'s profile`
      });
    } else if (type === 'department') {
      // Navigate to department view (not implemented yet)
      addToast({
        type: 'info',
        title: 'Department Selected',
        message: `Viewing ${item} department`
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const hasResults = searchResults.requests.length > 0 || 
                    searchResults.employees.length > 0 || 
                    searchResults.departments.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search requests, employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 text-base text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
        {isSearching ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-blue-600 dark:border-t-blue-400"></div>
            <p className="ml-2 text-gray-500 dark:text-gray-400">Searching...</p>
          </div>
        ) : searchQuery.length > 2 ? (
          <div className="p-4">
            {hasResults ? (
              <div className="space-y-6">
                {/* Request Results */}
                {searchResults.requests.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Requests</h3>
                    <div className="space-y-2">
                      {searchResults.requests.map((request) => (
                        <button
                          key={request.id}
                          onClick={() => handleResultClick('request', request)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 overflow-hidden rounded-full">
                              <img 
                                src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                                alt={request.employee.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900 dark:text-white">{request.employee.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{request.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge 
                              variant={
                                request.status === 'pending' ? 'warning' :
                                request.status === 'approved' ? 'success' : 'error'
                              }
                              size="sm"
                            >
                              {request.status}
                            </Badge>
                            <ArrowRight size={16} className="ml-2 text-gray-400 dark:text-gray-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Department Results */}
                {searchResults.departments.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Departments</h3>
                    <div className="space-y-2">
                      {searchResults.departments.map((department) => (
                        <button
                          key={department}
                          onClick={() => handleResultClick('department', department)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                              <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="ml-3 font-medium text-gray-900 dark:text-white">{department}</p>
                          </div>
                          <ArrowRight size={16} className="text-gray-400 dark:text-gray-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Recent Searches</h3>
            <div className="mt-3 space-y-2">
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(item.text);
                  }}
                  className="flex w-full items-center rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <item.icon size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                </button>
              ))}
            </div>
            
            <h3 className="mt-6 text-sm font-medium text-gray-900 dark:text-white">Quick Filters</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/?filter=pending')}
                className="flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
              >
                <Clock size={20} className="mb-1 text-amber-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Pending</span>
              </button>
              <button
                onClick={() => navigate('/?filter=approved')}
                className="flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
              >
                <FileText size={20} className="mb-1 text-green-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Approved</span>
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
              >
                <Calendar size={20} className="mb-1 text-blue-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Calendar</span>
              </button>
              <button
                onClick={() => navigate('/team')}
                className="flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
              >
                <User size={20} className="mb-1 text-purple-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Team</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearch;
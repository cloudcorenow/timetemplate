import React, { useEffect, useState } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Filter, Eye, EyeOff, MapPin, User, Building2 } from 'lucide-react';
import { useRequestStore } from '../store/requestStore';
import { TimeOffRequest } from '../types/request';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/ui/GradientBackground';
import AnimatedCard from '../components/ui/AnimatedCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CalendarPage: React.FC = () => {
  const { requests, fetchRequests, isLoading } = useRequestStore();
  const { user, isManager, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [dayRequests, setDayRequests] = useState<TimeOffRequest[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterType, setFilterType] = useState<'all' | 'paid time off' | 'sick leave' | 'time edit' | 'other'>('all');
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (selectedDay) {
      const requestsOnDay = getRequestsForDay(selectedDay);
      setDayRequests(requestsOnDay);
    } else {
      setDayRequests([]);
    }
  }, [selectedDay, requests, filterStatus, filterType]);

  const getRequestsForDay = (day: Date): TimeOffRequest[] => {
    return requests.filter(request => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const targetDay = new Date(day);
      
      // Reset time part to compare dates only
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      targetDay.setHours(0, 0, 0, 0);
      
      const isInDateRange = targetDay >= start && targetDay <= end;
      const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
      const matchesType = filterType === 'all' || request.type === filterType;
      
      return isInDateRange && matchesStatus && matchesType;
    });
  };

  const getEventsForDay = (day: Date) => {
    return getRequestsForDay(day);
  };

  const getDayClassName = (day: Date) => {
    const events = getEventsForDay(day);
    if (events.length === 0) return '';
    
    // Priority: pending > approved > rejected
    if (events.some(e => e.status === 'pending')) {
      return 'has-pending';
    }
    if (events.some(e => e.status === 'approved')) {
      return 'has-approved';
    }
    if (events.some(e => e.status === 'rejected')) {
      return 'has-rejected';
    }
    
    return '';
  };

  const renderCalendarDay = (day: Date) => {
    const events = getEventsForDay(day);
    const isSelected = selectedDay && isSameDay(day, selectedDay);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);
    const dayClass = getDayClassName(day);

    return (
      <button
        key={day.toISOString()}
        onClick={() => setSelectedDay(day)}
        className={`
          relative h-16 w-full rounded-lg border-2 p-2 text-left transition-all duration-200 hover:shadow-md
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-transparent hover:border-gray-200'
          }
          ${!isCurrentMonth ? 'opacity-40' : ''}
          ${isTodayDate ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
          ${dayClass === 'has-pending' ? 'bg-amber-50' : ''}
          ${dayClass === 'has-approved' ? 'bg-green-50' : ''}
          ${dayClass === 'has-rejected' ? 'bg-red-50' : ''}
        `}
      >
        <div className="flex items-start justify-between">
          <span className={`
            text-sm font-medium
            ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
          `}>
            {format(day, 'd')}
          </span>
          {events.length > 0 && (
            <span className="text-xs text-gray-500">
              {events.length}
            </span>
          )}
        </div>
        
        {/* Event indicators */}
        {events.length > 0 && (
          <div className="absolute bottom-1 left-1 right-1 flex space-x-1">
            {events.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full ${
                  event.status === 'pending' 
                    ? 'bg-amber-400' 
                    : event.status === 'approved' 
                    ? 'bg-green-400' 
                    : 'bg-red-400'
                }`}
              />
            ))}
            {events.length > 3 && (
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        )}
      </button>
    );
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map(day => renderCalendarDay(day))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-600 bg-amber-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'paid time off':
        return <MapPin size={14} />;
      case 'sick leave':
        return <User size={14} />;
      case 'time edit':
        return <Clock size={14} />;
      default:
        return <Calendar size={14} />;
    }
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
            <p className="mt-1 text-gray-600">
              View and manage time off requests across your organization
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={showLegend ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              icon={showLegend ? <EyeOff size={16} /> : <Eye size={16} />}
            >
              {showLegend ? 'Hide' : 'Show'} Legend
            </Button>
          </div>
        </div>

        {/* Filters and Legend */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <AnimatedCard className="p-6">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Calendar Navigation */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    icon={<ChevronLeft size={16} />}
                  />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    icon={<ChevronRight size={16} />}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="paid time off">Paid Time Off</option>
                    <option value="sick leave">Sick Leave</option>
                    <option value="time edit">Time Edit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Calendar Grid */}
              {renderCalendarGrid()}
            </AnimatedCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Legend */}
            {showLegend && (
              <AnimatedCard className="p-6" delay={100}>
                <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                  <Filter size={20} className="mr-2" />
                  Legend
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="mr-3 h-4 w-4 rounded bg-amber-400"></div>
                    <span className="text-sm text-gray-700">Pending Requests</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 h-4 w-4 rounded bg-green-400"></div>
                    <span className="text-sm text-gray-700">Approved Requests</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 h-4 w-4 rounded bg-red-400"></div>
                    <span className="text-sm text-gray-700">Rejected Requests</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 h-4 w-4 rounded border-2 border-blue-400"></div>
                    <span className="text-sm text-gray-700">Today</span>
                  </div>
                </div>
              </AnimatedCard>
            )}

            {/* Selected Day Details */}
            <AnimatedCard className="p-6" delay={200}>
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Calendar size={20} className="mr-2" />
                {selectedDay 
                  ? format(selectedDay, 'MMMM d, yyyy')
                  : 'Select a date'
                }
              </h3>
              
              {selectedDay && dayRequests.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500">No requests for this date</p>
                </div>
              )}
              
              {dayRequests.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {dayRequests.map(request => (
                    <div 
                      key={request.id}
                      className="rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 overflow-hidden rounded-full mr-3">
                            <img 
                              src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                              alt={request.employee.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.employee.name}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Building2 size={12} className="mr-1" />
                              {request.employee.department}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            request.status === 'pending' ? 'warning' :
                            request.status === 'approved' ? 'success' : 'error'
                          }
                          size="sm"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          {getTypeIcon(request.type)}
                          <span className="ml-2 font-medium text-gray-700">
                            {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">{request.reason}</p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
                          {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnimatedCard>

            {/* Quick Stats */}
            <AnimatedCard className="p-6" delay={300}>
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Users size={20} className="mr-2" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-medium">{requests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-medium text-amber-600">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-medium text-green-600">
                    {requests.filter(r => r.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-medium">
                    {requests.filter(r => 
                      isSameMonth(new Date(r.startDate), currentDate) ||
                      isSameMonth(new Date(r.endDate), currentDate)
                    ).length}
                  </span>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default CalendarPage;
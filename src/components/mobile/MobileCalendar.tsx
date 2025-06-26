import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter, User } from 'lucide-react';
import { useRequestStore } from '../../store/requestStore';
import { TimeOffRequest } from '../../types/request';
import { useAuth } from '../../context/AuthContext';
import TouchOptimizedCard from './TouchOptimizedCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const MobileCalendar: React.FC = () => {
  const { requests, fetchRequests } = useRequestStore();
  const { user, isManager, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [dayRequests, setDayRequests] = useState<TimeOffRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showFilters, setShowFilters] = useState(false);

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
  }, [selectedDay, requests, filterStatus]);

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
      
      return isInDateRange && matchesStatus;
    });
  };

  const renderCalendarHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
      >
        <ChevronLeft size={20} />
      </button>
      
      <h2 className="text-lg font-semibold text-gray-900">
        {format(currentDate, 'MMMM yyyy')}
      </h2>
      
      <button
        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );

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
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map(day => {
                const events = getRequestsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                
                // Determine day color based on events
                let dayColor = '';
                if (events.some(e => e.status === 'pending')) {
                  dayColor = 'bg-amber-100';
                } else if (events.some(e => e.status === 'approved')) {
                  dayColor = 'bg-green-100';
                } else if (events.some(e => e.status === 'rejected')) {
                  dayColor = 'bg-red-100';
                }
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      relative h-10 w-full rounded-full p-1 text-center transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : dayColor || 'hover:bg-gray-100 active:bg-gray-200'
                      }
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isTodayDate && !isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                    `}
                  >
                    <span className={`
                      text-sm font-medium
                      ${isSelected 
                        ? 'text-white' 
                        : isTodayDate 
                        ? 'text-blue-600' 
                        : isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                      }
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Event indicator */}
                    {events.length > 0 && !isSelected && (
                      <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600"></div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDay) {
      return (
        <TouchOptimizedCard className="p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500">Select a date to view requests</p>
        </TouchOptimizedCard>
      );
    }

    if (dayRequests.length === 0) {
      return (
        <TouchOptimizedCard className="p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-gray-500">No requests for this date</p>
        </TouchOptimizedCard>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {format(selectedDay, 'EEEE, MMMM d, yyyy')}
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {dayRequests.map(request => (
            <TouchOptimizedCard key={request.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 overflow-hidden rounded-full mr-3">
                    <img 
                      src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                      alt={request.employee.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{request.employee.name}</p>
                    <p className="text-xs text-gray-500">{request.employee.department}</p>
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
                  <span className="font-medium text-gray-700 mr-2">
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)}:
                  </span>
                  <span className="text-gray-600 line-clamp-1">{request.reason}</span>
                </div>
                
                {isTimeEditRequest && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Times:</span> {request.originalClockIn} - {request.originalClockOut} → {request.requestedClockIn} - {request.requestedClockOut}
                  </div>
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d')}
                </div>
              </div>
            </TouchOptimizedCard>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Team Calendar</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
        >
          <Filter size={20} />
        </button>
      </div>
      
      {showFilters && (
        <TouchOptimizedCard className="p-4 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <div className="flex space-x-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-amber-400"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-green-400"></div>
                <span>Approved</span>
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-red-400"></div>
                <span>Rejected</span>
              </div>
            </div>
          </div>
        </TouchOptimizedCard>
      )}

      {/* Calendar */}
      <TouchOptimizedCard className="p-4">
        {renderCalendarHeader()}
        {renderCalendarGrid()}
      </TouchOptimizedCard>

      {/* Day Details */}
      <div className="mt-6">
        {renderDayDetails()}
      </div>
      
      {/* Today Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDay(new Date());
          }}
          size="sm"
          className="rounded-full shadow-lg"
        >
          Today
        </Button>
      </div>
    </div>
  );
};

export default MobileCalendar;
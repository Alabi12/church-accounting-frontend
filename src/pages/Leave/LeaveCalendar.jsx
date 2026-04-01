// src/pages/Leave/LeaveCalendar.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

function LeaveCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');

  // Fetch leave calendar data
  const { 
    data: eventsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['leaveCalendar', currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => {
      console.log('Fetching calendar data for:', currentDate.getFullYear(), currentDate.getMonth() + 1);
      return leaveService.getLeaveCalendar({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    refetch();
  }, [currentDate, refetch]);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetch();
    toast.success('Calendar refreshed');
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'annual': return 'bg-blue-500';
      case 'sick': return 'bg-red-500';
      case 'bereavement': return 'bg-gray-500';
      case 'maternity': return 'bg-purple-500';
      case 'paternity': return 'bg-indigo-500';
      case 'study': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-500';
      case 'PAID':
        return 'bg-blue-500';
      case 'PENDING_PASTOR':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBgLight = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_PASTOR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'Approved';
      case 'PAID':
        return 'Paid';
      case 'PENDING_PASTOR':
        return 'Pending';
      default:
        return status || 'Unknown';
    }
  };

  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case 'annual': return 'Annual';
      case 'sick': return 'Sick';
      case 'bereavement': return 'Bereavement';
      case 'maternity': return 'Maternity';
      case 'paternity': return 'Paternity';
      case 'study': return 'Study';
      default: return type;
    }
  };

  // Process events data
  let events = [];
  if (eventsData) {
    if (Array.isArray(eventsData)) {
      events = eventsData;
    } else if (eventsData.events && Array.isArray(eventsData.events)) {
      events = eventsData.events;
    } else if (eventsData.data && Array.isArray(eventsData.data)) {
      events = eventsData.data;
    } else {
      console.log('Unexpected calendar data format:', eventsData);
      events = [];
    }
  }

  // Filter events by leave type
  const filteredEvents = leaveTypeFilter === 'all' 
    ? events 
    : events.filter(event => event.extendedProps?.leave_type === leaveTypeFilter);

  const getEventsForDay = (day) => {
    if (!Array.isArray(filteredEvents)) return [];
    
    return filteredEvents.filter(event => {
      try {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return day >= eventStart && day < eventEnd;
      } catch (e) {
        console.warn('Error parsing event date:', e);
        return false;
      }
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };
  
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load leave calendar" />;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leave Calendar</h1>
          <p className="mt-2 text-sm text-gray-700">
            View employee leave schedules. {events.length} leave(s) scheduled for this month.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Today
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                <option value="all">All Types ({events.length})</option>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="bereavement">Bereavement</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="study">Study Leave</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div><span className="text-xs text-gray-600">Approved</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div><span className="text-xs text-gray-600">Paid</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div><span className="text-xs text-gray-600">Pending</span></div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Total: {filteredEvents.length} leaves
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={prevMonth} 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={nextMonth} 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-gray-50 h-32 p-2" />
            ))}

            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`bg-white h-32 p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday(day) ? 'bg-blue-50' : ''
                  } ${isSelected ? 'ring-2 ring-[rgb(31,178,86)] ring-inset' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${
                      isToday(day) ? 'text-[rgb(31,178,86)] font-bold' : 'text-gray-700'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-1 rounded text-white truncate ${getStatusColor(event.extendedProps?.status)}`}
                        title={`${event.extendedProps?.employee_name} - ${event.extendedProps?.leave_type} (${getStatusLabel(event.extendedProps?.status)})`}
                      >
                        {event.extendedProps?.employee_name?.split(' ')[0] || 'Leave'}
                        {event.extendedProps?.allowance_amount > 0 && (
                          <span className="ml-1 text-[10px] opacity-75">💰</span>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Leave Details for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
          </div>
          <div className="p-6">
            {getEventsForDay(selectedDate).length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Leave Type</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Days</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Allowance</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {getEventsForDay(selectedDate).map((event, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {event.extendedProps?.employee_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800`}>
                            {getLeaveTypeLabel(event.extendedProps?.leave_type)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {format(new Date(event.start), 'dd MMM yyyy')} - {format(new Date(event.end), 'dd MMM yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-medium">
                          {event.extendedProps?.days} days
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-green-600">
                          GH₵ {event.extendedProps?.allowance_amount?.toLocaleString() || '0'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBgLight(event.extendedProps?.status)}`}>
                            {getStatusLabel(event.extendedProps?.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/leave/requests/${event.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No leave scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveCalendar;
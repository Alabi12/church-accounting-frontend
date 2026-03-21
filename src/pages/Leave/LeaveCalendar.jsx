// src/pages/Leave/LeaveCalendar.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

function LeaveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');

  // Fetch leave calendar data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaveCalendar', currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => leaveService.getLeaveCalendar({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    }),
  });

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-500';
      case 'sick':
        return 'bg-red-500';
      case 'bereavement':
        return 'bg-gray-500';
      case 'maternity':
        return 'bg-purple-500';
      case 'paternity':
        return 'bg-indigo-500';
      case 'study':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case 'annual':
        return 'Annual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'bereavement':
        return 'Bereavement';
      case 'maternity':
        return 'Maternity';
      case 'paternity':
        return 'Paternity';
      case 'study':
        return 'Study Leave';
      default:
        return type;
    }
  };

  const events = data?.data || [];

  // Filter events by leave type
  const filteredEvents = leaveTypeFilter === 'all' 
    ? events 
    : events.filter(event => event.extendedProps?.leave_type === leaveTypeFilter);

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return day >= eventStart && day < eventEnd;
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load leave calendar" />;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leave Calendar</h1>
          <p className="mt-2 text-sm text-gray-700">
            View employee leave schedules by month.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
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
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                <option value="all">All Leave Types</option>
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
      <div className="mb-6 flex flex-wrap gap-4">
        <span className="text-sm font-medium text-gray-700">Leave Types:</span>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs text-gray-600">Annual</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600">Sick</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
            <span className="text-xs text-gray-600">Bereavement</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span className="text-xs text-gray-600">Maternity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-1"></div>
            <span className="text-xs text-gray-600">Paternity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-600">Study</span>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
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

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Week Days */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-gray-50 h-32 p-2" />
            ))}

            {/* Month days */}
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`bg-white h-32 p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    isToday(day) ? 'bg-blue-50' : ''
                  } ${isSelected ? 'ring-2 ring-[rgb(31,178,86)] ring-inset' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${
                      isToday(day) ? 'text-[rgb(31,178,86)]' : 'text-gray-700'
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
                        className={`text-xs p-1 rounded text-white truncate ${getLeaveTypeColor(event.extendedProps?.leave_type)}`}
                        title={`${event.title}`}
                      >
                        {event.extendedProps?.employee_name?.split(' ')[0] || 'Leave'}
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
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Leave Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Days
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {getEventsForDay(selectedDate).map((event, idx) => (
                    <tr key={idx}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {event.extendedProps?.employee_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getLeaveTypeColor(event.extendedProps?.leave_type).replace('bg-', 'bg-').replace('500', '100 text-').replace('bg-', '')}800`}>
                          {getLeaveTypeLabel(event.extendedProps?.leave_type)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(event.start), 'dd MMM')} - {format(new Date(event.end), 'dd MMM yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {event.extendedProps?.days} days
                      </td>
                    </tr>
                  ))}
                  {getEventsForDay(selectedDate).length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        No leave scheduled for this day
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveCalendar;
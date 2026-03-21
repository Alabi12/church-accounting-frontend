import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  className = '' 
}) => {
  const [preset, setPreset] = useState('custom');

  const presets = [
    { 
      label: 'Today', 
      value: 'today', 
      getRange: () => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
      }
    },
    { 
      label: 'This Week', 
      value: 'week', 
      getRange: () => {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return { 
          start: firstDay.toISOString().split('T')[0], 
          end: lastDay.toISOString().split('T')[0] 
        };
      }
    },
    { 
      label: 'This Month', 
      value: 'month', 
      getRange: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { 
          start: firstDay.toISOString().split('T')[0], 
          end: lastDay.toISOString().split('T')[0] 
        };
      }
    },
    { 
      label: 'Last Month', 
      value: 'lastMonth', 
      getRange: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return { 
          start: firstDay.toISOString().split('T')[0], 
          end: lastDay.toISOString().split('T')[0] 
        };
      }
    },
    { 
      label: 'This Quarter', 
      value: 'quarter', 
      getRange: () => {
        const today = new Date();
        const quarter = Math.floor(today.getMonth() / 3);
        const firstDay = new Date(today.getFullYear(), quarter * 3, 1);
        const lastDay = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return { 
          start: firstDay.toISOString().split('T')[0], 
          end: lastDay.toISOString().split('T')[0] 
        };
      }
    },
    { 
      label: 'This Year', 
      value: 'year', 
      getRange: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        return { 
          start: firstDay.toISOString().split('T')[0], 
          end: lastDay.toISOString().split('T')[0] 
        };
      }
    },
    { 
      label: 'Last Year', 
      value: 'lastYear', 
      getRange: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear() - 1, 0, 1);
        const lastDay = new Date(today.getFullYear() - 1, 11, 31);
        return { 
          start: firstDay.toISOString().split('T')[0], 
          end: lastDay.toISOString().split('T')[0] 
        };
      }
    }
  ];

  const handlePresetChange = (e) => {
    const selectedPreset = presets.find(p => p.value === e.target.value);
    if (selectedPreset) {
      const { start, end } = selectedPreset.getRange();
      onStartDateChange(start);
      onEndDateChange(end);
      setPreset(e.target.value);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 ${className}`}>
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <select
          value={preset}
          onChange={handlePresetChange}
          className="block w-full sm:w-40 border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
        >
          <option value="custom">Custom Range</option>
          {presets.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              onStartDateChange(e.target.value);
              setPreset('custom');
            }}
            className="block w-full sm:w-40 border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
          />
        </div>
        <span className="text-gray-500 text-center sm:text-left">to</span>
        <div className="relative flex-1 sm:flex-none">
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              onEndDateChange(e.target.value);
              setPreset('custom');
            }}
            className="block w-full sm:w-40 border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
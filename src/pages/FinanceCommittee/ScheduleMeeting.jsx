import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '10:00',
    endTime: '12:00',
    location: '',
    locationType: 'physical',
    meetingLink: '',
    agenda: [''],
    attendeeIds: [],
    isRecurring: false,
    recurrencePattern: 'weekly'
  });

  const [selectedAttendees, setSelectedAttendees] = useState([]);

  // Fetch committee members on component mount
  useEffect(() => {
    fetchCommitteeMembers();
  }, []);

  const fetchCommitteeMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await api.get('/committee/members');
      setAvailableMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching committee members:', error);
      toast.error('Failed to load committee members');
      setAvailableMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAgendaChange = (index, value) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = value;
    setFormData(prev => ({ ...prev, agenda: newAgenda }));
  };

  const addAgendaItem = () => {
    setFormData(prev => ({ ...prev, agenda: [...prev.agenda, ''] }));
  };

  const removeAgendaItem = (index) => {
    const newAgenda = formData.agenda.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, agenda: newAgenda }));
  };

  const handleAttendeeToggle = (member) => {
    const isSelected = selectedAttendees.find(a => a.id === member.id);
    if (isSelected) {
      setSelectedAttendees(selectedAttendees.filter(a => a.id !== member.id));
      setFormData(prev => ({
        ...prev,
        attendeeIds: prev.attendeeIds.filter(id => id !== member.id)
      }));
    } else {
      setSelectedAttendees([...selectedAttendees, member]);
      setFormData(prev => ({
        ...prev,
        attendeeIds: [...prev.attendeeIds, member.id]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.agenda.some(item => !item.trim())) {
      toast.error('Please complete all agenda items or remove empty ones');
      return;
    }

    setLoading(true);
    
    try {
      const meetingData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location: formData.locationType === 'physical' ? formData.location : null,
        location_type: formData.locationType,
        meeting_link: formData.locationType === 'virtual' ? formData.meetingLink : null,
        agenda: formData.agenda.filter(item => item.trim()),
        attendee_ids: formData.attendeeIds,
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.isRecurring ? formData.recurrencePattern : null
      };
      
      await api.post('/committee/meetings', meetingData);
      
      toast.success('Meeting scheduled successfully!');
      navigate('/committee/dashboard');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on search
  const filteredMembers = availableMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Committee Meeting</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new meeting for the finance committee
          </p>
        </div>
        <button
          onClick={() => navigate('/committee/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Title */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Meeting Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Monthly Finance Committee Meeting"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of the meeting purpose..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    value="physical"
                    checked={formData.locationType === 'physical'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Physical Meeting</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    value="virtual"
                    checked={formData.locationType === 'virtual'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Virtual Meeting</span>
                </label>
              </div>
            </div>

            {formData.locationType === 'physical' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Conference Room A, Main Hall"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  placeholder="https://zoom.us/meeting/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add Zoom, Google Meet, or Teams link
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Agenda */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Agenda Items</h2>
            <button
              type="button"
              onClick={addAgendaItem}
              className="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {formData.agenda.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleAgendaChange(index, e.target.value)}
                    placeholder={`Agenda item ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {formData.agenda.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attendees */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Invite Attendees</h2>
          
          {/* Search Bar */}
          <div className="mb-4 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {loadingMembers ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredMembers.map((member) => (
                <label key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedAttendees.some(a => a.id === member.id)}
                      onChange={() => handleAttendeeToggle(member)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role || 'Committee Member'} • {member.email}</p>
                    </div>
                  </div>
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No committee members found
            </div>
          )}

          {selectedAttendees.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {selectedAttendees.length} member(s) will be invited
              </p>
            </div>
          )}
        </div>

        {/* Recurring Meeting Option */}
        <div className="bg-white shadow rounded-lg p-6">
          <label className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Recurring Meeting</h2>
              <p className="text-sm text-gray-500">Set up a recurring meeting schedule</p>
            </div>
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>

          {formData.isRecurring && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Pattern
              </label>
              <select
                name="recurrencePattern"
                value={formData.recurrencePattern}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/committee/dashboard')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4 inline mr-2" />
            Schedule Meeting
          </button>
        </div>
      </form>
    </div>
  );
}
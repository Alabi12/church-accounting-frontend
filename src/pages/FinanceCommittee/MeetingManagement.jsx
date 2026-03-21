import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  VideoCameraIcon,
  MapPinIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function MeetingManagement() {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'regular',
    date: '',
    time: '',
    duration: 60,
    location: '',
    isVirtual: false,
    virtualLink: '',
    agenda: [''],
    attendees: [],
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committee/meetings');
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMockMeetings();
    } finally {
      setLoading(false);
    }
  };

  const setMockMeetings = () => {
    setMeetings([
      {
        id: 1,
        title: 'Monthly Finance Committee Meeting',
        type: 'regular',
        date: '2024-03-20',
        time: '19:00',
        duration: 90,
        location: 'Conference Room A',
        isVirtual: false,
        agenda: [
          'Call to order',
          'Approval of previous minutes',
          'Budget reviews',
          'Financial reports',
          'New business',
          'Adjournment'
        ],
        attendees: [
          { id: 1, name: 'John Treasurer', status: 'confirmed' },
          { id: 2, name: 'Sarah Accountant', status: 'confirmed' },
          { id: 3, name: 'Mike Pastor', status: 'pending' },
          { id: 4, name: 'Lisa Auditor', status: 'declined' },
        ],
        status: 'scheduled',
        createdBy: 'Admin',
        createdAt: '2024-03-01'
      },
      {
        id: 2,
        title: 'Special Budget Review Session',
        type: 'special',
        date: '2024-03-22',
        time: '18:30',
        duration: 60,
        location: 'Zoom',
        isVirtual: true,
        virtualLink: 'https://zoom.us/j/123456789',
        agenda: [
          'Emergency funding request',
          'Capital campaign review',
          'Q2 budget adjustments'
        ],
        attendees: [
          { id: 1, name: 'John Treasurer', status: 'confirmed' },
          { id: 2, name: 'Sarah Accountant', status: 'confirmed' },
          { id: 5, name: 'David Pastor', status: 'confirmed' },
        ],
        status: 'scheduled',
        createdBy: 'Admin',
        createdAt: '2024-03-05'
      },
      {
        id: 3,
        title: 'February Finance Meeting',
        type: 'regular',
        date: '2024-02-15',
        time: '19:00',
        duration: 90,
        location: 'Conference Room A',
        isVirtual: false,
        agenda: ['Budget reviews', 'Financial reports'],
        attendees: [
          { id: 1, name: 'John Treasurer', status: 'attended' },
          { id: 2, name: 'Sarah Accountant', status: 'attended' },
        ],
        status: 'completed',
        minutes: 'Meeting minutes document',
        createdBy: 'Admin',
        createdAt: '2024-02-01'
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(editingMeeting ? 'Meeting updated' : 'Meeting scheduled');
    setShowForm(false);
    setEditingMeeting(null);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      toast.success('Meeting deleted');
      // Implement delete
    }
  };

  const handleAddAgendaItem = () => {
    setFormData({
      ...formData,
      agenda: [...formData.agenda, '']
    });
  };

  const handleRemoveAgendaItem = (index) => {
    const newAgenda = formData.agenda.filter((_, i) => i !== index);
    setFormData({ ...formData, agenda: newAgenda });
  };

  const handleAgendaChange = (index, value) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = value;
    setFormData({ ...formData, agenda: newAgenda });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'regular',
      date: '',
      time: '',
      duration: 60,
      location: '',
      isVirtual: false,
      virtualLink: '',
      agenda: [''],
      attendees: [],
      notes: '',
      status: 'scheduled'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatus = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'attended': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setEditingMeeting(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Schedule Meeting
        </button>
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Meetings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {meetings.filter(m => m.status === 'scheduled').map((meeting) => (
            <div key={meeting.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-primary-500" />
                    <h3 className="text-lg font-medium text-gray-900">{meeting.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(meeting.date)} at {meeting.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm text-gray-900">{meeting.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900">
                        {meeting.isVirtual ? (
                          <span className="flex items-center">
                            <VideoCameraIcon className="h-4 w-4 mr-1 text-blue-500" />
                            Virtual
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {meeting.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Attendees</p>
                      <p className="text-sm text-gray-900">
                        {meeting.attendees.filter(a => a.status === 'confirmed').length} confirmed
                      </p>
                    </div>
                  </div>

                  {/* Agenda Preview */}
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Agenda:</p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.agenda.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {item}
                        </span>
                      ))}
                      {meeting.agenda.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          +{meeting.agenda.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendees Preview */}
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Attendees:</p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendees.slice(0, 3).map((attendee) => (
                        <div key={attendee.id} className="flex items-center space-x-1">
                          <span className="text-xs text-gray-700">{attendee.name}</span>
                          <span className={`text-xs px-1 rounded ${getAttendanceStatus(attendee.status)}`}>
                            {attendee.status}
                          </span>
                        </div>
                      ))}
                      {meeting.attendees.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{meeting.attendees.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex space-x-2">
                  {meeting.isVirtual && meeting.virtualLink && (
                    <a
                      href={meeting.virtualLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <VideoCameraIcon className="h-4 w-4 mr-1" />
                      Join
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setShowDetails(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEditingMeeting(meeting);
                      setFormData({
                        title: meeting.title,
                        type: meeting.type,
                        date: meeting.date,
                        time: meeting.time,
                        duration: meeting.duration,
                        location: meeting.location,
                        isVirtual: meeting.isVirtual,
                        virtualLink: meeting.virtualLink || '',
                        agenda: meeting.agenda,
                        attendees: meeting.attendees,
                        notes: meeting.notes || '',
                        status: meeting.status
                      });
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-700"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Meetings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Past Meetings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meeting</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendees</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meetings.filter(m => m.status === 'completed').map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(meeting.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-xs text-gray-500">{meeting.type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {meeting.isVirtual ? 'Virtual' : meeting.location}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {meeting.attendees.filter(a => a.status === 'attended').length}/{meeting.attendees.length}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-700 mr-3">
                      Minutes
                    </button>
                    <button className="text-primary-600 hover:text-primary-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="regular">Regular Meeting</option>
                    <option value="special">Special Meeting</option>
                    <option value="emergency">Emergency Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={formData.isVirtual}
                    onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isVirtual" className="ml-2 block text-sm text-gray-900">
                    Virtual Meeting
                  </label>
                </div>

                {formData.isVirtual ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Virtual Meeting Link</label>
                    <input
                      type="url"
                      value={formData.virtualLink}
                      onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Room number or address"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agenda Items</label>
                {formData.agenda.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleAgendaChange(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder={`Item ${index + 1}`}
                    />
                    {formData.agenda.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAgendaItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAgendaItem}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Agenda Item
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Additional notes or instructions..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
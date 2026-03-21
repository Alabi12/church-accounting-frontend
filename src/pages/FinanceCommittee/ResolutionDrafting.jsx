import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  UsersIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ResolutionDrafting() {
  const [loading, setLoading] = useState(true);
  const [resolutions, setResolutions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingResolution, setEditingResolution] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    number: '',
    type: 'budget',
    purpose: '',
    background: '',
    provisions: [''],
    fiscalImpact: '',
    effectiveDate: '',
    sponsor: '',
    coSponsors: [''],
    status: 'draft'
  });

  useEffect(() => {
    fetchResolutions();
  }, []);

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committee/resolutions');
      setResolutions(response.data.resolutions || []);
    } catch (error) {
      console.error('Error fetching resolutions:', error);
      setMockResolutions();
    } finally {
      setLoading(false);
    }
  };

  const setMockResolutions = () => {
    setResolutions([
      {
        id: 1,
        number: 'RES-2024-001',
        title: 'Resolution to Approve Youth Ministry Budget',
        type: 'budget',
        purpose: 'To approve the annual budget for Youth Ministry programs and activities',
        background: 'The Youth Ministry has submitted a comprehensive budget for 2024 including events, curriculum, and staff support.',
        provisions: [
          'Allocate $75,000 for Youth Ministry operations',
          'Funds to be distributed quarterly',
          'Quarterly reports to be submitted to Finance Committee'
        ],
        fiscalImpact: '$75,000 from General Fund',
        effectiveDate: '2024-04-01',
        sponsor: 'John Treasurer',
        coSponsors: ['Sarah Accountant', 'Mike Pastor'],
        status: 'draft',
        createdBy: 'John Treasurer',
        createdAt: '2024-03-01',
        comments: []
      },
      {
        id: 2,
        number: 'RES-2024-002',
        title: 'Building Maintenance Fund Authorization',
        type: 'budget',
        purpose: 'To authorize up to $150,000 for building maintenance and repairs',
        background: 'Facilities assessment identified urgent repairs needed for roof and HVAC systems.',
        provisions: [
          'Authorize expenditure up to $150,000',
          'Require competitive bids for work over $25,000',
          'Monthly progress reports to committee'
        ],
        fiscalImpact: '$150,000 from Building Reserve Fund',
        effectiveDate: '2024-03-15',
        sponsor: 'Mike Facilities',
        coSponsors: ['John Treasurer'],
        status: 'review',
        createdBy: 'Mike Facilities',
        createdAt: '2024-03-05',
        comments: [
          { id: 1, user: 'Sarah Accountant', comment: 'Need to verify reserve fund balance', date: '2024-03-06' }
        ]
      },
      {
        id: 3,
        number: 'RES-2024-003',
        title: 'Audit Committee Appointment',
        type: 'appointment',
        purpose: 'To appoint Jane Smith to the Audit Committee',
        background: 'The Audit Committee has a vacancy following the resignation of John Doe.',
        provisions: [
          'Appoint Jane Smith for a 2-year term',
          'Term effective immediately'
        ],
        fiscalImpact: 'None',
        effectiveDate: '2024-03-01',
        sponsor: 'Lisa Auditor',
        coSponsors: [],
        status: 'passed',
        createdBy: 'Lisa Auditor',
        createdAt: '2024-02-15',
        comments: []
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(editingResolution ? 'Resolution updated' : 'Resolution created');
    setShowForm(false);
    setEditingResolution(null);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resolution?')) {
      toast.success('Resolution deleted');
      // Implement delete
    }
  };

  const handleAddProvision = () => {
    setFormData({
      ...formData,
      provisions: [...formData.provisions, '']
    });
  };

  const handleRemoveProvision = (index) => {
    const newProvisions = formData.provisions.filter((_, i) => i !== index);
    setFormData({ ...formData, provisions: newProvisions });
  };

  const handleProvisionChange = (index, value) => {
    const newProvisions = [...formData.provisions];
    newProvisions[index] = value;
    setFormData({ ...formData, provisions: newProvisions });
  };

  const handleAddCoSponsor = () => {
    setFormData({
      ...formData,
      coSponsors: [...formData.coSponsors, '']
    });
  };

  const handleRemoveCoSponsor = (index) => {
    const newCoSponsors = formData.coSponsors.filter((_, i) => i !== index);
    setFormData({ ...formData, coSponsors: newCoSponsors });
  };

  const handleCoSponsorChange = (index, value) => {
    const newCoSponsors = [...formData.coSponsors];
    newCoSponsors[index] = value;
    setFormData({ ...formData, coSponsors: newCoSponsors });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      number: '',
      type: 'budget',
      purpose: '',
      background: '',
      provisions: [''],
      fiscalImpact: '',
      effectiveDate: '',
      sponsor: '',
      coSponsors: [''],
      status: 'draft'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'voting': return 'bg-blue-100 text-blue-800';
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'budget': return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'policy': return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case 'appointment': return <UsersIcon className="h-5 w-5 text-green-500" />;
      default: return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Resolutions</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setEditingResolution(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Resolution
        </button>
      </div>

      {/* Resolutions List */}
      <div className="space-y-4">
        {resolutions.map((resolution) => (
          <div key={resolution.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(resolution.type)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{resolution.title}</h3>
                    <p className="text-sm text-gray-500">Resolution {resolution.number}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(resolution.status)}`}>
                    {resolution.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-3">{resolution.purpose}</p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm capitalize">{resolution.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sponsor</p>
                    <p className="text-sm">{resolution.sponsor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Effective Date</p>
                    <p className="text-sm">{formatDate(resolution.effectiveDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fiscal Impact</p>
                    <p className="text-sm">{resolution.fiscalImpact}</p>
                  </div>
                </div>

                {resolution.coSponsors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Co-sponsors:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {resolution.coSponsors.map((sponsor, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {resolution.comments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Latest comment:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                      {resolution.comments[resolution.comments.length - 1].comment}
                    </p>
                  </div>
                )}
              </div>

              <div className="ml-6 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedResolution(resolution);
                    setShowDetails(true);
                  }}
                  className="p-2 text-primary-600 hover:text-primary-700"
                  title="View Details"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                {resolution.status === 'draft' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingResolution(resolution);
                        setFormData({
                          title: resolution.title,
                          number: resolution.number,
                          type: resolution.type,
                          purpose: resolution.purpose,
                          background: resolution.background,
                          provisions: resolution.provisions,
                          fiscalImpact: resolution.fiscalImpact,
                          effectiveDate: resolution.effectiveDate,
                          sponsor: resolution.sponsor,
                          coSponsors: resolution.coSponsors,
                          status: resolution.status
                        });
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-700"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resolution.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                {resolution.status === 'review' && (
                  <button className="p-2 text-green-600 hover:text-green-700" title="Move to Vote">
                    <HandRaisedIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New/Edit Resolution Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingResolution ? 'Edit Resolution' : 'New Resolution'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Number</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="e.g., RES-2024-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="budget">Budget Resolution</option>
                    <option value="policy">Policy Resolution</option>
                    <option value="appointment">Appointment Resolution</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Background</label>
                <textarea
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provisions</label>
                {formData.provisions.map((provision, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={provision}
                      onChange={(e) => handleProvisionChange(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder={`Provision ${index + 1}`}
                    />
                    {formData.provisions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProvision(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddProvision}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Provision
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fiscal Impact</label>
                <input
                  type="text"
                  value={formData.fiscalImpact}
                  onChange={(e) => setFormData({ ...formData, fiscalImpact: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g., $75,000 from General Fund"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sponsor</label>
                  <input
                    type="text"
                    value={formData.sponsor}
                    onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Co-sponsors</label>
                {formData.coSponsors.map((sponsor, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={sponsor}
                      onChange={(e) => handleCoSponsorChange(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Co-sponsor name"
                    />
                    {formData.coSponsors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCoSponsor(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddCoSponsor}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Co-sponsor
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="voting">Ready for Vote</option>
                </select>
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
                  {editingResolution ? 'Update Resolution' : 'Create Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Details Modal */}
      {showDetails && selectedResolution && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Resolution Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{selectedResolution.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedResolution.status)}`}>
                    {selectedResolution.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Resolution {selectedResolution.number}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm capitalize">{selectedResolution.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sponsor</p>
                  <p className="text-sm">{selectedResolution.sponsor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Effective Date</p>
                  <p className="text-sm">{formatDate(selectedResolution.effectiveDate)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Purpose</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedResolution.purpose}
                </p>
              </div>

              {selectedResolution.background && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Background</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedResolution.background}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Provisions</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {selectedResolution.provisions.map((provision, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{provision}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fiscal Impact</h4>
                <p className="text-sm text-gray-600">{selectedResolution.fiscalImpact}</p>
              </div>

              {selectedResolution.coSponsors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Co-sponsors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResolution.coSponsors.map((sponsor, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {sponsor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs text-gray-400">
                  Created by {selectedResolution.createdBy} on {formatDate(selectedResolution.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
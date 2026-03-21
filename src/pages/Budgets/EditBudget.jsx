// In EditBudget.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { budgetService } from '../../services/budgets';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EditBudget = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    fiscalYear: '',
    amount: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    justification: ''
  });

  useEffect(() => {
    if (id) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching budget for edit, ID:', id);
      
      const response = await budgetService.getBudgetById(id);
      console.log('📦 Budget data received:', response);
      
      // Map the response to form fields (handle both camelCase and snake_case)
      setFormData({
        name: response.name || '',
        description: response.description || '',
        department: response.department || '',
        fiscalYear: response.fiscalYear || response.fiscal_year || '',
        amount: response.amount || '',
        startDate: response.startDate || response.start_date || '',
        endDate: response.endDate || response.end_date || '',
        priority: response.priority || 'MEDIUM',
        justification: response.justification || ''
      });
      
    } catch (error) {
      console.error('❌ Error fetching budget:', error);
      toast.error(error.response?.data?.error || 'Failed to load budget');
      // Optionally redirect back
      // navigate('/pastor/budget-approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await budgetService.updateBudget(id, formData);
      toast.success('Budget updated successfully');
      navigate(`/pastor/budgets/${id}`); // Navigate to view page
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error(error.response?.data?.error || 'Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Budget</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          {/* Your form fields here */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            />
          </div>
          
          {/* Add other form fields similarly */}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudget;
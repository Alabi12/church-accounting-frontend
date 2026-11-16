import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HandRaisedIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function CommitteeVoting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState([]);
  const [selectedVote, setSelectedVote] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [votingDecision, setVotingDecision] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    voted: 0,
    closed: 0
  });

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committee/votes');
      const votesData = response.data.votes || [];
      setVotes(votesData);
      
      // Calculate stats
      setStats({
        total: votesData.length,
        open: votesData.filter(v => v.status === 'open').length,
        voted: votesData.filter(v => v.hasVoted).length,
        closed: votesData.filter(v => v.status === 'closed').length
      });
    } catch (error) {
      console.error('Error fetching votes:', error);
      toast.error('Failed to load votes');
      setMockVotes();
    } finally {
      setLoading(false);
    }
  };

  const setMockVotes = () => {
    const mockVotes = [
      {
        id: 1,
        title: 'Youth Ministry Annual Budget 2024',
        description: 'Annual budget for youth programs, events, and outreach activities',
        meeting: 'Finance Committee Meeting - March 2024',
        date: '2024-03-20',
        deadline: '2024-03-19',
        status: 'open',
        hasVoted: false,
        yesVotes: 3,
        noVotes: 1,
        abstain: 0,
        budgetAmount: 75000,
        department: 'Youth Ministry',
        submittedBy: 'John Pastor',
        submittedDate: '2024-03-10'
      },
      {
        id: 2,
        title: 'Worship Department Equipment Upgrade',
        description: 'Funding for new sound system and musical instruments',
        meeting: 'Finance Committee Meeting - March 2024',
        date: '2024-03-20',
        deadline: '2024-03-19',
        status: 'open',
        hasVoted: false,
        yesVotes: 2,
        noVotes: 2,
        abstain: 1,
        budgetAmount: 45000,
        department: 'Worship',
        submittedBy: 'Sarah Worship',
        submittedDate: '2024-03-08'
      },
      {
        id: 3,
        title: 'Building Maintenance Fund',
        description: 'Annual maintenance and repairs for church facilities',
        meeting: 'Special Budget Session',
        date: '2024-03-22',
        deadline: '2024-03-21',
        status: 'open',
        hasVoted: true,
        yesVotes: 4,
        noVotes: 0,
        abstain: 1,
        budgetAmount: 120000,
        department: 'Facilities',
        submittedBy: 'Mike Facilities',
        submittedDate: '2024-03-05'
      }
    ];
    setVotes(mockVotes);
    setStats({
      total: mockVotes.length,
      open: mockVotes.filter(v => v.status === 'open').length,
      voted: mockVotes.filter(v => v.hasVoted).length,
      closed: mockVotes.filter(v => v.status === 'closed').length
    });
  };

  const handleCastVote = async (voteId, decision) => {
    try {
      await api.post(`/committee/votes/${voteId}/cast`, { decision });
      toast.success(`Vote cast successfully: ${decision.toUpperCase()}`);
      fetchVotes(); // Refresh the list
      setShowConfirmModal(false);
      setSelectedVote(null);
      setVotingDecision(null);
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error(error.response?.data?.error || 'Failed to cast vote');
    }
  };

  const openVoteModal = (vote, decision) => {
    setSelectedVote(vote);
    setVotingDecision(decision);
    setShowConfirmModal(true);
  };

  const getStatusBadge = (status, hasVoted) => {
    if (hasVoted) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Voted</span>;
    }
    switch(status) {
      case 'open':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Open for Voting</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Closed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{status}</span>;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committee Voting</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cast your votes on budget approvals and resolutions
          </p>
        </div>
        <button
          onClick={fetchVotes}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Votes</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Open for Voting</p>
          <p className="text-2xl font-bold text-green-600">{stats.open}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Already Voted</p>
          <p className="text-2xl font-bold text-blue-600">{stats.voted}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Closed</p>
          <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
        </div>
      </div>

      {/* Votes List */}
      <div className="space-y-4">
        {votes.map((vote) => (
          <div key={vote.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{vote.title}</h2>
                    {getStatusBadge(vote.status, vote.hasVoted)}
                  </div>
                  <p className="text-gray-600 mt-1">{vote.description}</p>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-900">{vote.department || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Budget Amount</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(vote.budgetAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Meeting</p>
                      <p className="text-sm font-medium text-gray-900">{vote.meeting}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deadline</p>
                      <p className="text-sm font-medium text-red-600">{formatDate(vote.deadline)}</p>
                    </div>
                  </div>

                  {/* Vote Results */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Current Results</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto" />
                        <p className="text-lg font-bold text-green-600">{vote.yesVotes || 0}</p>
                        <p className="text-xs text-gray-600">Yes</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <XCircleIcon className="h-5 w-5 text-red-600 mx-auto" />
                        <p className="text-lg font-bold text-red-600">{vote.noVotes || 0}</p>
                        <p className="text-xs text-gray-600">No</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <MinusCircleIcon className="h-5 w-5 text-gray-600 mx-auto" />
                        <p className="text-lg font-bold text-gray-600">{vote.abstain || 0}</p>
                        <p className="text-xs text-gray-600">Abstain</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vote Actions */}
              {vote.status === 'open' && !vote.hasVoted && (
                <div className="mt-6 pt-4 border-t flex gap-3">
                  <button
                    onClick={() => openVoteModal(vote, 'yes')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                    Vote Yes
                  </button>
                  <button
                    onClick={() => openVoteModal(vote, 'no')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4 inline mr-2" />
                    Vote No
                  </button>
                  <button
                    onClick={() => openVoteModal(vote, 'abstain')}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <MinusCircleIcon className="h-4 w-4 inline mr-2" />
                    Abstain
                  </button>
                </div>
              )}

              {vote.hasVoted && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-center text-blue-800 text-sm">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    You have already cast your vote on this budget
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {votes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <HandRaisedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Open Votes</h3>
            <p className="text-gray-500 mt-1">There are no votes requiring your attention at this time.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedVote && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                votingDecision === 'yes' ? 'bg-green-100' :
                votingDecision === 'no' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {votingDecision === 'yes' && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
                {votingDecision === 'no' && <XCircleIcon className="h-6 w-6 text-red-600" />}
                {votingDecision === 'abstain' && <MinusCircleIcon className="h-6 w-6 text-gray-600" />}
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Confirm Your Vote</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  You are about to vote <strong className="capitalize">{votingDecision}</strong> on:
                </p>
                <p className="mt-2 font-medium text-gray-900">{selectedVote.title}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedVote.description}</p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ This action cannot be undone. Please ensure you have reviewed the budget details before proceeding.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCastVote(selectedVote.id, votingDecision)}
                  className={`flex-1 px-4 py-2 rounded-md text-white ${
                    votingDecision === 'yes' ? 'bg-green-600 hover:bg-green-700' :
                    votingDecision === 'no' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  Confirm {votingDecision?.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
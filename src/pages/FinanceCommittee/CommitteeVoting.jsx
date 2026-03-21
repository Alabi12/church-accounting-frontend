import React, { useState, useEffect } from 'react';
import {
  HandRaisedIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function CommitteeVoting() {
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState([]);
  const [selectedVote, setSelectedVote] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [votingHistory, setVotingHistory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    passed: 0,
    failed: 0
  });

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committee/votes');
      setVotes(response.data.votes || []);
      setVotingHistory(response.data.history || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching votes:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setVotes([
      {
        id: 1,
        title: 'Youth Ministry Budget Approval 2024',
        description: 'Approve annual budget of $75,000 for Youth Ministry programs and activities',
        type: 'budget',
        meeting: 'March Committee Meeting',
        openDate: '2024-03-15',
        closeDate: '2024-03-22',
        status: 'open',
        quorum: 7,
        votesRequired: 'simple-majority',
        votes: {
          yes: 4,
          no: 2,
          abstain: 1,
          total: 7
        },
        discussion: [
          { id: 1, member: 'John Treasurer', comment: 'Supports the budget, good ROI', date: '2024-03-16' },
          { id: 2, member: 'Sarah Auditor', comment: 'Concerned about event costs', date: '2024-03-17' },
        ]
      },
      {
        id: 2,
        title: 'Building Fund Resolution 2024-01',
        description: 'Authorize up to $150,000 for building maintenance and repairs',
        type: 'resolution',
        meeting: 'Special Meeting',
        openDate: '2024-03-10',
        closeDate: '2024-03-17',
        status: 'open',
        quorum: 7,
        votesRequired: 'two-thirds',
        votes: {
          yes: 5,
          no: 1,
          abstain: 1,
          total: 7
        },
        discussion: []
      },
      {
        id: 3,
        title: 'Audit Committee Appointment',
        description: 'Appoint Jane Smith to Audit Committee for 2-year term',
        type: 'appointment',
        meeting: 'February Committee Meeting',
        openDate: '2024-02-20',
        closeDate: '2024-02-27',
        status: 'closed',
        result: 'passed',
        votes: {
          yes: 6,
          no: 0,
          abstain: 1,
          total: 7
        },
        discussion: []
      },
    ]);

    setVotingHistory([
      {
        id: 1,
        title: 'Worship Budget Approval',
        date: '2024-02-15',
        result: 'passed',
        yesVotes: 5,
        noVotes: 2,
        abstain: 0
      },
      {
        id: 2,
        title: 'Missions Funding Request',
        date: '2024-02-01',
        result: 'failed',
        yesVotes: 3,
        noVotes: 3,
        abstain: 1
      },
    ]);

    setStats({
      total: 8,
      open: 2,
      closed: 6,
      passed: 5,
      failed: 1
    });
  };

  const handleCastVote = (voteId, choice) => {
    toast.success(`Vote cast: ${choice}`);
    // Implement vote casting
  };

  const getVoteTypeIcon = (type) => {
    switch(type) {
      case 'budget': return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'resolution': return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case 'appointment': return <UserGroupIcon className="h-5 w-5 text-green-500" />;
      default: return <HandRaisedIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultColor = (result) => {
    switch(result) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculatePercentage = (votes, total) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  };

  const hasVoted = (voteId) => {
    // Check if current user has already voted
    return false;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Committee Voting</h1>
        <button
          onClick={fetchVotes}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Votes</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-xl font-bold text-green-600">{stats.open}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Closed</p>
          <p className="text-xl font-bold text-gray-600">{stats.closed}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Passed</p>
          <p className="text-xl font-bold text-green-600">{stats.passed}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Active Votes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Votes</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {votes.filter(v => v.status === 'open').map((vote) => (
            <div key={vote.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getVoteTypeIcon(vote.type)}
                    <h3 className="text-lg font-medium text-gray-900">{vote.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(vote.status)}`}>
                      {vote.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-2">{vote.description}</p>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Meeting</p>
                      <p className="text-sm font-medium text-gray-900">{vote.meeting}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Opens</p>
                      <p className="text-sm text-gray-900">{formatDate(vote.openDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Closes</p>
                      <p className="text-sm text-gray-900">{formatDate(vote.closeDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quorum</p>
                      <p className="text-sm text-gray-900">{vote.votes.total}/{vote.quorum}</p>
                    </div>
                  </div>

                  {/* Vote Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-green-600">Yes: {vote.votes.yes}</span>
                      <span className="text-red-600">No: {vote.votes.no}</span>
                      <span className="text-gray-600">Abstain: {vote.votes.abstain}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${calculatePercentage(vote.votes.yes, vote.votes.total)}%` }}
                      ></div>
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${calculatePercentage(vote.votes.no, vote.votes.total)}%` }}
                      ></div>
                      <div
                        className="bg-gray-400 h-full"
                        style={{ width: `${calculatePercentage(vote.votes.abstain, vote.votes.total)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Discussion Preview */}
                  {vote.discussion.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">Recent Discussion:</p>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        "{vote.discussion[vote.discussion.length - 1].comment}"
                        <span className="text-xs text-gray-400 ml-2">
                          - {vote.discussion[vote.discussion.length - 1].member}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2 min-w-[120px]">
                  {!hasVoted(vote.id) && vote.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleCastVote(vote.id, 'yes')}
                        className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Vote Yes
                      </button>
                      <button
                        onClick={() => handleCastVote(vote.id, 'no')}
                        className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Vote No
                      </button>
                      <button
                        onClick={() => handleCastVote(vote.id, 'abstain')}
                        className="inline-flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        <MinusCircleIcon className="h-4 w-4 mr-1" />
                        Abstain
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedVote(vote);
                      setShowDetails(true);
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voting History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Voting History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motion</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Yes</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Abstain</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {votingHistory.map((vote) => (
                <tr key={vote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(vote.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vote.title}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">
                    {vote.yesVotes}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-red-600 font-medium">
                    {vote.noVotes}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {vote.abstain}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-medium ${getResultColor(vote.result)}`}>
                      {vote.result.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vote Details Modal */}
      {showDetails && selectedVote && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Vote Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedVote.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedVote.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium capitalize">{selectedVote.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Meeting</p>
                  <p className="text-sm">{selectedVote.meeting}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm capitalize">{selectedVote.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Opens</p>
                  <p className="text-sm">{formatDate(selectedVote.openDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Closes</p>
                  <p className="text-sm">{formatDate(selectedVote.closeDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quorum Required</p>
                  <p className="text-sm">{selectedVote.quorum}</p>
                </div>
              </div>

              {/* Voting Results */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Results</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600">Yes ({selectedVote.votes.yes})</span>
                      <span className="text-green-600">
                        {calculatePercentage(selectedVote.votes.yes, selectedVote.votes.total)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${calculatePercentage(selectedVote.votes.yes, selectedVote.votes.total)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-600">No ({selectedVote.votes.no})</span>
                      <span className="text-red-600">
                        {calculatePercentage(selectedVote.votes.no, selectedVote.votes.total)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${calculatePercentage(selectedVote.votes.no, selectedVote.votes.total)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Abstain ({selectedVote.votes.abstain})</span>
                      <span className="text-gray-600">
                        {calculatePercentage(selectedVote.votes.abstain, selectedVote.votes.total)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="bg-gray-400 h-full"
                        style={{ width: `${calculatePercentage(selectedVote.votes.abstain, selectedVote.votes.total)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discussion Thread */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Discussion</h4>
                <div className="space-y-3 mb-4">
                  {selectedVote.discussion.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">{item.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.member} • {formatDate(item.date)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add to discussion..."
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    Post
                  </button>
                </div>
              </div>

              {/* Voting Actions */}
              {selectedVote.status === 'open' && !hasVoted(selectedVote.id) && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleCastVote(selectedVote.id, 'abstain')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Abstain
                  </button>
                  <button
                    onClick={() => handleCastVote(selectedVote.id, 'no')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Vote No
                  </button>
                  <button
                    onClick={() => handleCastVote(selectedVote.id, 'yes')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Vote Yes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
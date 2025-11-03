import { useState } from 'react';
import { Trophy, Calendar, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useListContestsQuery,
  Contest
} from '@/store/api/membershipApi';

export const ContestManagement = () => {
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading } = useListContestsQuery({ status: filter === 'all' ? undefined : filter });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contests = data?.contests || [];

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string } } = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
      active: { bg: 'bg-success-light', text: 'text-primary-800' },
      ended: { bg: 'bg-blue-100', text: 'text-blue-700' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} capitalize`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading contests...</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-success-light border-primary-200' : 'bg-error-light border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-primary-900' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Contests</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-sm text-gray-600">{contests.length} contests</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Contest</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Dates</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Prize</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Submissions</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contests.map((contest) => (
                <tr key={contest.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {contest.title}
                        {contest.sponsor_name && (
                          <span className="text-xs text-gray-500 font-normal">by {contest.sponsor_name}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{contest.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(contest.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-gray-500 ml-6">to</div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(contest.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-start text-sm text-gray-700">
                      <Trophy className="w-4 h-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{contest.prize_description}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      {contest.submissions_count || 0}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(contest.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contests.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No contests found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

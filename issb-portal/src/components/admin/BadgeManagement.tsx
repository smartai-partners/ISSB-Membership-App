import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Award, Users, TrendingUp, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useListBadgesQuery,
  useGetMemberBadgesQuery,
  useAwardBadgeMutation,
  useCheckAchievementsMutation,
  Badge,
  MemberBadge
} from '@/store/api/membershipApi';

export const BadgeManagement = () => {
  const { data, isLoading, refetch } = useListBadgesQuery();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const { data: memberBadgesData, refetch: refetchMemberBadges } = useGetMemberBadgesQuery(
    { badge_id: selectedBadge?.id }, 
    { skip: !selectedBadge }
  );
  const [awardBadge, { isLoading: isAwarding }] = useAwardBadgeMutation();
  const [checkAchievements, { isLoading: isChecking }] = useCheckAchievementsMutation();

  const [showAwardForm, setShowAwardForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [awardFormData, setAwardFormData] = useState({
    member_email: '',
    reason: ''
  });

  const badges = data?.badges || [];
  const memberBadges = memberBadgesData?.badges || [];

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBadge) return;

    setMessage(null);

    try {
      await awardBadge({
        badge_id: selectedBadge.id,
        member_email: awardFormData.member_email,
        reason: awardFormData.reason || undefined
      }).unwrap();

      setMessage({ type: 'success', text: 'Badge awarded successfully' });
      setAwardFormData({ member_email: '', reason: '' });
      setShowAwardForm(false);
      refetchMemberBadges();
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to award badge' });
    }
  };

  const viewBadgeRecipients = (badge: Badge) => {
    setSelectedBadge(badge);
  };

  const runAchievementCheck = async () => {
    try {
      const result = await checkAchievements().unwrap();
      setMessage({ 
        type: 'success', 
        text: `Achievement check completed. ${result.awardsGiven || 0} badge(s) awarded to eligible members.` 
      });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to run achievement check' });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading badges...</p>
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

      {!selectedBadge ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{badges.length} badges</span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={runAchievementCheck} disabled={isChecking}>
                <TrendingUp className="w-4 h-4 mr-2" />
                {isChecking ? 'Running...' : 'Run Achievement Check'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <Award className="w-8 h-8 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                      {badge.badge_type}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{badge.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Points</p>
                    <p className="text-lg font-bold text-primary-600">{badge.points_value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Awarded</p>
                    <p className="text-lg font-bold text-gray-900">{badge.awarded_count || 0}</p>
                  </div>
                </div>

                {badge.achievement_criteria?.type !== 'manual' && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Auto-Award Criteria:</p>
                    <p className="text-sm text-gray-600">
                      {badge.achievement_criteria?.type === 'volunteer_hours' && `${badge.achievement_criteria?.value} volunteer hours`}
                      {badge.achievement_criteria?.type === 'events_attended' && `${badge.achievement_criteria?.value} events attended`}
                      {badge.achievement_criteria?.type === 'contests_won' && `${badge.achievement_criteria?.value} contests won`}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => viewBadgeRecipients(badge)}
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    View Recipients
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {badges.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No badges found. Badges are pre-configured in the database.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Button variant="outline" onClick={() => setSelectedBadge(null)}>
                ← Back to Badges
              </Button>
              <div className="flex items-center gap-4 mt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  {selectedBadge.icon_url ? (
                    <img src={selectedBadge.icon_url} alt={selectedBadge.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <Award className="w-8 h-8 text-primary-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBadge.name}</h2>
                  <p className="text-gray-600">{memberBadges.length} members awarded</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowAwardForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Award Badge
            </Button>
          </div>

          {showAwardForm && (
            <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Award Badge to Member</h3>

              <form onSubmit={handleAwardBadge} className="space-y-6">
                <div>
                  <label className="label-modern">Member Email</label>
                  <input
                    type="email"
                    value={awardFormData.member_email}
                    onChange={(e) => setAwardFormData({ ...awardFormData, member_email: e.target.value })}
                    className="input-modern"
                    placeholder="member@example.com"
                    required
                    disabled={isAwarding}
                  />
                </div>

                <div>
                  <label className="label-modern">Reason (Optional)</label>
                  <textarea
                    value={awardFormData.reason}
                    onChange={(e) => setAwardFormData({ ...awardFormData, reason: e.target.value })}
                    rows={3}
                    className="textarea-modern"
                    placeholder="Exceptional leadership during community event..."
                    disabled={isAwarding}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isAwarding}>
                    {isAwarding ? 'Awarding...' : 'Award Badge'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAwardForm(false)} disabled={isAwarding}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Member</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Awarded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberBadges.map((mb) => (
                    <tr key={mb.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900">{mb.member_name || 'Unknown'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600">{mb.member_email || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600">
                          {new Date(mb.awarded_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {memberBadges.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No members have been awarded this badge yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, TrendingUp, Star, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  points: number;
}

interface MemberBadge {
  id: string;
  earned_at: string;
  evidence: any;
  badge: Badge;
}

export const MemberAchievements = () => {
  const [badges, setBadges] = useState<MemberBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-member-badges');
      
      if (error) throw error;
      
      if (data?.data?.member_badges) {
        const memberBadges = data.data.member_badges;
        setBadges(memberBadges);
        
        const points = memberBadges.reduce(
          (sum: number, mb: MemberBadge) => sum + (mb.badge?.points || 0),
          0
        );
        setTotalPoints(points);
      }
    } catch (error: any) {
      console.error('Error loading badges:', error);
      setMessage({ type: 'error', text: 'Failed to load achievements' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Achievements</h2>
          <p className="text-gray-600 mt-1">Track your progress and earned badges</p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-3 rounded-xl border border-primary-200">
          <Trophy className="w-6 h-6 text-primary-600" />
          <div>
            <p className="text-xs text-primary-700 font-medium">Total Points</p>
            <p className="text-2xl font-bold text-primary-900">{totalPoints}</p>
          </div>
        </div>
      </div>

      {badges.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Badges Earned Yet</h3>
          <p className="text-gray-600 mb-4">Start participating in events and volunteer activities to earn achievements!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((mb) => (
            <Card key={mb.id} className="p-5 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                  <Award className="w-7 h-7 text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{mb.badge.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{mb.badge.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      {mb.badge.points} points
                    </span>
                    <span className="text-xs text-gray-500">
                      Earned {formatDate(mb.earned_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

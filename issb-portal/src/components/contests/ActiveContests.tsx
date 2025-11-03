import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, AlertCircle, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Contest {
  id: string;
  title: string;
  description: string;
  rules: string;
  prize_description: string;
  sponsor_name: string | null;
  start_date: string;
  end_date: string;
  max_submissions: number;
}

export const ActiveContests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionContent, setSubmissionContent] = useState('');

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-contests');
      
      if (error) throw error;
      
      if (data?.data?.contests) {
        setContests(data.data.contests);
      }
    } catch (error: any) {
      console.error('Error loading contests:', error);
      setMessage({ type: 'error', text: 'Failed to load contests' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (contestId: string) => {
    if (!submissionTitle.trim() || !submissionContent.trim()) {
      setMessage({ type: 'error', text: 'Please provide both title and content for your submission' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('submit-contest-entry', {
        body: {
          contest_id: contestId,
          submission_title: submissionTitle,
          content: submissionContent
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Contest entry submitted successfully!' });
      setSubmissionTitle('');
      setSubmissionContent('');
      setSelectedContest(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit entry' });
    } finally {
      setSubmitting(false);
    }
  };

  const isActive = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.start_date);
    const end = new Date(contest.end_date);
    return now >= start && now <= end;
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
          <p className="text-gray-600">Loading contests...</p>
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

      <div>
        <h2 className="text-3xl font-bold text-gray-900">Active Contests</h2>
        <p className="text-gray-600 mt-1">Participate in contests and win amazing prizes</p>
      </div>

      {contests.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Contests</h3>
          <p className="text-gray-600">Check back soon for new contests and opportunities!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {contests.map((contest) => {
            const active = isActive(contest);
            const isExpanded = selectedContest === contest.id;

            return (
              <Card key={contest.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{contest.title}</h3>
                      {contest.sponsor_name && (
                        <p className="text-sm text-gray-600">Sponsored by <span className="font-semibold">{contest.sponsor_name}</span></p>
                      )}
                    </div>
                    {active ? (
                      <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold">
                        Closed
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{contest.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary-600" />
                      <span className="font-medium">{contest.prize_description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-600" />
                      <span>Ends {formatDate(contest.end_date)}</span>
                    </div>
                  </div>

                  {contest.rules && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Contest Rules:</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{contest.rules}</p>
                    </div>
                  )}

                  {active && !isExpanded && (
                    <Button 
                      onClick={() => setSelectedContest(contest.id)}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Entry
                    </Button>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Submission Title
                        </label>
                        <Input
                          value={submissionTitle}
                          onChange={(e) => setSubmissionTitle(e.target.value)}
                          placeholder="Enter a title for your submission"
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Submission Content
                        </label>
                        <Textarea
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          placeholder="Describe your submission..."
                          rows={5}
                          disabled={submitting}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleSubmit(contest.id)}
                          disabled={submitting}
                          className="flex-1"
                        >
                          {submitting ? 'Submitting...' : 'Submit Entry'}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedContest(null);
                            setSubmissionTitle('');
                            setSubmissionContent('');
                          }}
                          variant="outline"
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useListAnnouncementsQuery } from '@/store/api/membershipApi';
import { Calendar, User, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AnnouncementsList = () => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);
  const { data, isLoading } = useListAnnouncementsQuery({ limit: 50, offset: 0 });

  const announcements = data?.announcements || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No announcements at this time.</p>
        <p className="text-sm text-gray-500 mt-2">Check back later for updates from the administration.</p>
      </div>
    );
  }

  const selectedAnnouncementData = selectedAnnouncement
    ? announcements.find(a => a.id === selectedAnnouncement)
    : null;

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">Community Announcements</h3>

      {!selectedAnnouncement ? (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAnnouncement(announcement.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedAnnouncement(announcement.id);
                }
              }}
              aria-label={`View announcement: ${announcement.title}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{announcement.title}</h4>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {announcement.content.substring(0, 150)}
                    {announcement.content.length > 150 ? '...' : ''}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {announcement.published_at 
                          ? new Date(announcement.published_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })
                          : new Date(announcement.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                      </span>
                    </div>
                    
                    {announcement.profiles && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {announcement.profiles.first_name} {announcement.profiles.last_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAnnouncement(null)}
            className="mb-6"
          >
            Back to Announcements
          </Button>

          <article>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedAnnouncementData?.title}</h2>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span>
                  {selectedAnnouncementData?.published_at 
                    ? new Date(selectedAnnouncementData.published_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : new Date(selectedAnnouncementData?.created_at || '').toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                </span>
              </div>
              
              {selectedAnnouncementData?.profiles && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    {selectedAnnouncementData.profiles.first_name} {selectedAnnouncementData.profiles.last_name}
                  </span>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {selectedAnnouncementData?.content}
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

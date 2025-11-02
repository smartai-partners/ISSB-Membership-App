import { AnnouncementsList } from '@/components/announcements/AnnouncementsList';
import { Bell } from 'lucide-react';

export function AnnouncementsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Announcements</h1>
              <p className="text-lg text-gray-600 mt-1">Stay updated with the latest news from ISSB</p>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <AnnouncementsList />
      </div>
    </div>
  );
}

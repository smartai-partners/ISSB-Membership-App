import { useState } from 'react';
import { 
  useListAnnouncementsQuery, 
  useCreateAnnouncementMutation, 
  useUpdateAnnouncementMutation, 
  useDeleteAnnouncementMutation 
} from '@/store/api/membershipApi';
import { Plus, Edit, Trash2, Calendar, Users, CheckCircle, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnnouncementFormData {
  title: string;
  content: string;
  recipient_groups: string[];
  is_published: boolean;
  send_email: boolean;
}

export const AdminAnnouncementsManagement = () => {
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading, refetch } = useListAnnouncementsQuery({});
  const [createAnnouncement] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    recipient_groups: ['all_members'],
    is_published: false,
    send_email: false
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const announcements = data?.announcements || [];

  // Filter announcements based on publication status
  const filteredAnnouncements = announcements.filter(announcement => {
    if (filter === 'all') return true;
    if (filter === 'published') return announcement.is_published;
    if (filter === 'draft') return !announcement.is_published;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        recipient_groups: formData.recipient_groups
      };

      if (editingId) {
        await updateAnnouncement({ id: editingId, updates: payload }).unwrap();
        setMessage({ type: 'success', text: 'Announcement updated successfully' });
      } else {
        await createAnnouncement(payload).unwrap();
        setMessage({ type: 'success', text: 'Announcement created successfully' });
      }

      resetForm();
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to save announcement' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      recipient_groups: announcement.recipient_groups || ['all_members'],
      is_published: announcement.is_published,
      send_email: false // Reset email flag for edits
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleDelete = async (announcementId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteAnnouncement(announcementId).unwrap();
      setMessage({ type: 'success', text: 'Announcement deleted successfully' });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to delete announcement' });
    }
  };

  const handleTogglePublished = async (announcement: any) => {
    try {
      await updateAnnouncement({ 
        id: announcement.id, 
        updates: { 
          is_published: !announcement.is_published 
        } 
      }).unwrap();
      setMessage({ 
        type: 'success', 
        text: `Announcement ${announcement.is_published ? 'unpublished' : 'published'} successfully` 
      });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to update announcement' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      recipient_groups: ['all_members'],
      is_published: false,
      send_email: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleRecipientGroupChange = (group: string) => {
    setFormData(prev => {
      const groups = prev.recipient_groups.includes(group)
        ? prev.recipient_groups.filter(g => g !== group)
        : [...prev.recipient_groups, group];
      
      // Ensure at least one group is selected
      return {
        ...prev,
        recipient_groups: groups.length > 0 ? groups : ['all_members']
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Announcements</h1>
          <p className="text-lg text-gray-600">Create and manage announcements for members</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-success-light border-primary-200' : 'bg-error-light border-red-200'}`}>
            <AlertDescription className={message.type === 'success' ? 'text-primary-900' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Filter announcements by status"
            >
              <option value="all">All Announcements</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
            <span className="text-sm text-gray-600">{filteredAnnouncements.length} announcements</span>
          </div>

          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="announcement-title" className="label-modern">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="announcement-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-modern"
                  required
                  aria-required="true"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label htmlFor="announcement-content" className="label-modern">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="announcement-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="textarea-modern"
                  required
                  aria-required="true"
                  placeholder="Enter announcement content (supports plain text)"
                />
                <p className="mt-1 text-sm text-gray-500">Write your announcement content. Use line breaks for paragraphs.</p>
              </div>

              <div>
                <label className="label-modern mb-3 block">
                  Recipient Groups <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recipient_groups.includes('all_members')}
                      onChange={() => handleRecipientGroupChange('all_members')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      aria-label="Send to all members"
                    />
                    <span className="ml-2 text-gray-700">All Members</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recipient_groups.includes('board_members')}
                      onChange={() => handleRecipientGroupChange('board_members')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      aria-label="Send to board members"
                    />
                    <span className="ml-2 text-gray-700">Board Members</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recipient_groups.includes('committee_members')}
                      onChange={() => handleRecipientGroupChange('committee_members')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      aria-label="Send to committee members"
                    />
                    <span className="ml-2 text-gray-700">Committee Members</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recipient_groups.includes('active_volunteers')}
                      onChange={() => handleRecipientGroupChange('active_volunteers')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      aria-label="Send to active volunteers"
                    />
                    <span className="ml-2 text-gray-700">Active Volunteers</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      aria-label="Publish announcement immediately"
                    />
                    <span className="ml-2 text-gray-700 font-medium">Publish immediately</span>
                    <span className="ml-2 text-sm text-gray-500">(Make visible to selected members)</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.send_email}
                      onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      aria-label="Send email notification"
                    />
                    <span className="ml-2 text-gray-700 font-medium">Send email notification</span>
                    <span className="ml-2 text-sm text-gray-500">(Email will be sent to selected groups)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Announcement' : 'Create Announcement'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
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
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Title</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Recipients</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Published</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Created</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-gray-900">{announcement.title}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {announcement.content.substring(0, 100)}...
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          {announcement.recipient_groups?.includes('all_members') 
                            ? 'All Members' 
                            : announcement.recipient_groups?.join(', ').replace(/_/g, ' ') || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {announcement.published_at 
                          ? new Date(announcement.published_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Not published'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700">
                        {new Date(announcement.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {announcement.is_published ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-light text-primary-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePublished(announcement)}
                          title={announcement.is_published ? 'Unpublish' : 'Publish'}
                          aria-label={announcement.is_published ? 'Unpublish announcement' : 'Publish announcement'}
                        >
                          {announcement.is_published ? <XCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(announcement)}
                          aria-label="Edit announcement"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(announcement.id, announcement.title)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          aria-label="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No announcements found.</p>
              {!showForm && (
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Announcement
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

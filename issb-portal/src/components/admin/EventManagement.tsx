import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useListEventsQuery, 
  useCreateEventMutation, 
  useUpdateEventMutation, 
  useDeleteEventMutation,
  Event 
} from '@/store/api/membershipApi';
import { uploadFile } from '@/lib/storage';

export const EventManagement = () => {
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading, refetch } = useListEventsQuery({ status: filter === 'all' ? undefined : filter });
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    capacity: '',
    status: 'draft',
    featured_image_url: ''
  });

  const events = data?.events || [];
  const isSubmitting = isCreating || isUpdating || isUploadingImage;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      let imageUrl = formData.featured_image_url;

      // Upload image if a new file was selected
      if (imageFile) {
        setIsUploadingImage(true);
        const uploadResult = await uploadFile(imageFile, 'event-images', 'events');
        imageUrl = uploadResult.url;
      }

      const eventData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        featured_image_url: imageUrl || undefined
      };

      if (editingId) {
        await updateEvent({ id: editingId, updates: eventData }).unwrap();
        setMessage({ type: 'success', text: 'Event updated successfully' });
      } else {
        await createEvent(eventData).unwrap();
        setMessage({ type: 'success', text: 'Event created successfully' });
      }

      resetForm();
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || error.message || 'Failed to save event' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      location: event.location,
      capacity: event.capacity.toString(),
      status: event.status,
      featured_image_url: event.featured_image_url || ''
    });
    setImagePreview(event.featured_image_url || null);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteEvent(eventId).unwrap();
      setMessage({ type: 'success', text: 'Event deleted successfully' });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to delete event' });
    }
  };

  const togglePublish = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await updateEvent({ id: eventId, updates: { status: newStatus } }).unwrap();
      setMessage({ type: 'success', text: `Event ${newStatus === 'published' ? 'published' : 'unpublished'} successfully` });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to update event status' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      location: '',
      capacity: '',
      status: 'draft',
      featured_image_url: ''
    });
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading events...</p>
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
            <option value="all">All Events</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <span className="text-sm text-gray-600">{events.length} events</span>
        </div>

        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingId ? 'Edit Event' : 'Create New Event'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="label-modern">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-modern"
                  placeholder="Annual Tech Conference 2025"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label-modern">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="textarea-modern"
                  placeholder="Detailed event description, agenda, and what attendees can expect..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="label-modern">Event Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="input-modern"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="label-modern">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="input-modern"
                  placeholder="100"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label-modern">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-modern"
                  placeholder="Main Conference Hall, 123 Business Ave"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="label-modern">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-modern"
                  required
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label-modern">Featured Image</label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="event-image"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="event-image"
                    className={`cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose Image
                  </label>
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="h-20 w-32 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        disabled={isSubmitting}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Recommended: 1200x630px, max 10MB</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isUploadingImage ? 'Uploading image...' : isSubmitting ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Event</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Location</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Registrations</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      {event.featured_image_url && (
                        <img src={event.featured_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(event.event_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-start text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{event.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {event.registrations_count || 0} / {event.capacity}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'published' ? 'bg-success-light text-primary-800' :
                      event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(event.id, event.status)}
                        title={event.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {event.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
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

        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No events found. Create your first event to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

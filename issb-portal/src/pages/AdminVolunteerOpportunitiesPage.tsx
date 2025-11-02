import { useState } from 'react';
import { useListOpportunitiesQuery, useCreateOpportunityMutation, useUpdateOpportunityMutation, useDeleteOpportunityMutation } from '@/store/api/membershipApi';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OpportunityFormData {
  title: string;
  description: string;
  opportunity_type: string;
  status: string;
  start_date: string;
  end_date: string;
  hours_required: string;
  capacity: string;
  location: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  category: string;
}

export const AdminVolunteerOpportunitiesPage = () => {
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading, refetch } = useListOpportunitiesQuery({ status: filter === 'all' ? undefined : filter });
  const [createOpportunity] = useCreateOpportunityMutation();
  const [updateOpportunity] = useUpdateOpportunityMutation();
  const [deleteOpportunity] = useDeleteOpportunityMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    description: '',
    opportunity_type: 'event',
    status: 'open',
    start_date: '',
    end_date: '',
    hours_required: '',
    capacity: '',
    location: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    category: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const opportunities = data?.opportunities || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        hours_required: parseFloat(formData.hours_required),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined
      };

      if (editingId) {
        await updateOpportunity({ id: editingId, updates: payload }).unwrap();
        setMessage({ type: 'success', text: 'Opportunity updated successfully' });
      } else {
        await createOpportunity(payload).unwrap();
        setMessage({ type: 'success', text: 'Opportunity created successfully' });
      }

      resetForm();
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to save opportunity' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (opportunity: any) => {
    setEditingId(opportunity.id);
    setFormData({
      title: opportunity.title,
      description: opportunity.description,
      opportunity_type: opportunity.opportunity_type,
      status: opportunity.status,
      start_date: opportunity.start_date || '',
      end_date: opportunity.end_date || '',
      hours_required: opportunity.hours_required.toString(),
      capacity: opportunity.capacity?.toString() || '',
      location: opportunity.location || '',
      contact_person: opportunity.contact_person || '',
      contact_email: opportunity.contact_email || '',
      contact_phone: opportunity.contact_phone || '',
      category: opportunity.category || ''
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleDelete = async (opportunityId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteOpportunity(opportunityId).unwrap();
      setMessage({ type: 'success', text: 'Opportunity deleted successfully' });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.data?.error?.message || 'Failed to delete opportunity' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      opportunity_type: 'event',
      status: 'open',
      start_date: '',
      end_date: '',
      hours_required: '',
      capacity: '',
      location: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      category: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Volunteer Opportunities</h1>
          <p className="text-lg text-gray-600">Create and manage volunteer opportunities for members</p>
        </div>

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
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="filled">Filled</option>
                    <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span className="text-sm text-gray-600">{opportunities.length} opportunities</span>
          </div>

          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Opportunity
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Opportunity' : 'Create New Opportunity'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="label-modern">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-modern"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label-modern">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="textarea-modern"
                    required
                  />
                </div>

                <div>
                  <label className="label-modern">Type</label>
                  <select
                    value={formData.opportunity_type}
                    onChange={(e) => setFormData({ ...formData, opportunity_type: e.target.value })}
                    className="input-modern"
                    required
                  >
                    <option value="event">Event</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="label-modern">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-modern"
                    required
                  >
                    <option value="open">Open</option>
                    <option value="filled">Filled</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="label-modern">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="label-modern">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="label-modern">Hours Required</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hours_required}
                    onChange={(e) => setFormData({ ...formData, hours_required: e.target.value })}
                    className="input-modern"
                    required
                  />
                </div>

                <div>
                  <label className="label-modern">Capacity (Optional)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="input-modern"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label-modern">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="label-modern">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="label-modern">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="label-modern">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="label-modern">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-modern"
                    placeholder="e.g., Education, Community Service"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Opportunity' : 'Create Opportunity'}
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
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Hours</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Volunteers</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-gray-900">{opportunity.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{opportunity.description.substring(0, 60)}...</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700 capitalize">{opportunity.opportunity_type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {opportunity.start_date 
                          ? new Date(opportunity.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {opportunity.hours_required} hrs
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {opportunity.current_volunteers || 0}
                        {opportunity.capacity ? ` / ${opportunity.capacity}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {opportunity.status === 'open' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-light text-primary-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                      {opportunity.status === 'completed' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          Completed
                        </span>
                      )}
                      {opportunity.status === 'cancelled' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(opportunity)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(opportunity.id, opportunity.title)}
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

          {opportunities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No opportunities found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

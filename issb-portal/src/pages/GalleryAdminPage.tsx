// Gallery Admin Page
// Purpose: Comprehensive gallery management for admins

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Camera,
  ExternalLink,
  Edit,
  Trash2,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useListGalleriesQuery,
  useCreateGalleryMutation,
  useUpdateGalleryMutation,
  useDeleteGalleryMutation,
  useSyncExternalGalleryMutation
} from '@/store/api/membershipApi';
import { PhotoUpload } from '@/components/PhotoUpload';

type GalleryType = 'internal' | 'pixieset' | 'google_drive';

export const GalleryAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<any | null>(null);

  // Check admin access
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const { data: galleriesData, isLoading, refetch } = useListGalleriesQuery({ published: false });
  const [deleteGallery] = useDeleteGalleryMutation();
  const [syncGallery, { isLoading: isSyncing }] = useSyncExternalGalleryMutation();

  const handleDelete = async (galleryId: string) => {
    if (!confirm('Are you sure you want to delete this gallery? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteGallery(galleryId).unwrap();
      alert('Gallery deleted successfully');
    } catch (error: any) {
      alert(error?.message || 'Failed to delete gallery');
    }
  };

  const handleSync = async (galleryId: string) => {
    try {
      await syncGallery(galleryId).unwrap();
      alert('Gallery synced successfully');
      refetch();
    } catch (error: any) {
      alert(error?.message || 'Failed to sync gallery');
    }
  };

  const getGalleryTypeLabel = (type: string) => {
    switch (type) {
      case 'pixieset': return 'Pixieset';
      case 'google_drive': return 'Google Drive';
      case 'internal': return 'Internal';
      default: return type;
    }
  };

  const getGalleryTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'pixieset': return 'bg-purple-100 text-purple-800';
      case 'google_drive': return 'bg-blue-100 text-blue-800';
      case 'internal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading galleries...</p>
        </div>
      </div>
    );
  }

  const galleries = galleriesData?.galleries || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Camera className="h-8 w-8 text-green-600" />
                Gallery Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage photo galleries
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Gallery
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Total Galleries</p>
              <p className="text-2xl font-bold text-gray-900">{galleries.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Internal</p>
              <p className="text-2xl font-bold text-green-600">
                {galleries.filter((g: any) => g.gallery_type === 'internal').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Pixieset</p>
              <p className="text-2xl font-bold text-purple-600">
                {galleries.filter((g: any) => g.gallery_type === 'pixieset').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Google Drive</p>
              <p className="text-2xl font-bold text-blue-600">
                {galleries.filter((g: any) => g.gallery_type === 'google_drive').length}
              </p>
            </div>
          </div>
        </div>

        {/* Galleries List */}
        {galleries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first gallery</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Gallery
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gallery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {galleries.map((gallery: any) => (
                  <tr key={gallery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {gallery.thumbnail_url ? (
                            <img
                              src={gallery.thumbnail_url}
                              alt={gallery.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{gallery.title}</p>
                          {gallery.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{gallery.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGalleryTypeBadgeColor(gallery.gallery_type)}`}>
                        {getGalleryTypeLabel(gallery.gallery_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {gallery.photo_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      {gallery.is_published ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(gallery.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {gallery.gallery_type === 'internal' && (
                          <button
                            onClick={() => setShowUploadModal(gallery.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Upload Photos"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        )}

                        {gallery.gallery_type !== 'internal' && (
                          <button
                            onClick={() => handleSync(gallery.id)}
                            disabled={isSyncing}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sync External Gallery"
                          >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        {gallery.external_url && (
                          <a
                            href={gallery.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Open External Link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                        <button
                          onClick={() => navigate(`/galleries/${gallery.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Gallery"
                        >
                          <Camera className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(gallery.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Gallery"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Gallery Modal */}
        {showCreateModal && (
          <CreateGalleryModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              refetch();
            }}
          />
        )}

        {/* Upload Photos Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowUploadModal(null)}></div>
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
                <button
                  onClick={() => setShowUploadModal(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Photos</h2>

                <PhotoUpload
                  galleryId={showUploadModal}
                  onUploadComplete={() => {
                    setShowUploadModal(null);
                    refetch();
                  }}
                  onClose={() => setShowUploadModal(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Gallery Modal Component
const CreateGalleryModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [galleryType, setGalleryType] = useState<GalleryType>('internal');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_id: '',
    external_url: '',
    external_id: '',
    is_published: false
  });

  const [createGallery, { isLoading }] = useCreateGalleryMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createGallery({
        ...formData,
        gallery_type: galleryType
      }).unwrap();

      alert('Gallery created successfully');
      onSuccess();
    } catch (error: any) {
      alert(error?.message || 'Failed to create gallery');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Gallery</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gallery Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['internal', 'pixieset', 'google_drive'] as GalleryType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGalleryType(type)}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      galleryType === type
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type === 'internal' ? 'Internal' : type === 'pixieset' ? 'Pixieset' : 'Google Drive'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Ramadan Iftar 2024"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief description of the gallery"
              />
            </div>

            {/* External fields */}
            {galleryType !== 'internal' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {galleryType === 'pixieset' ? 'Pixieset Collection URL' : 'Google Drive Folder URL'}
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.external_url}
                    onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={galleryType === 'pixieset' ? 'https://client.pixieset.com/...' : 'https://drive.google.com/...'}
                  />
                </div>
              </>
            )}

            {/* Publish */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_published" className="text-sm text-gray-700">
                Publish immediately
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Gallery'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GalleryAdminPage;

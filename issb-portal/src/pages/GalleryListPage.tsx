// Gallery List Page
// Purpose: Display all photo galleries in a beautiful grid layout

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Search,
  Filter,
  Plus,
  Grid3x3,
  List
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useListGalleriesQuery } from '@/store/api/membershipApi';

export const GalleryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pixieset' | 'google_drive' | 'internal'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: galleriesData, isLoading } = useListGalleriesQuery({ published: true });

  // Filter galleries based on search and type
  const filteredGalleries = React.useMemo(() => {
    if (!galleriesData?.galleries) return [];

    return galleriesData.galleries.filter(gallery => {
      const matchesSearch = gallery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gallery.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || gallery.gallery_type === filterType;

      return matchesSearch && matchesType;
    });
  }, [galleriesData?.galleries, searchQuery, filterType]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Camera className="h-8 w-8 text-green-600" />
                Photo Galleries
              </h1>
              <p className="text-gray-600 mt-1">
                Browse photos from our events and activities
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => navigate('/admin/galleries/create')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Gallery
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search galleries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="internal">Internal</option>
                  <option value="pixieset">Pixieset</option>
                  <option value="google_drive">Google Drive</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3x3 className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Galleries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {galleriesData?.galleries?.length || 0}
                </p>
              </div>
              <Camera className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Internal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {galleriesData?.galleries?.filter(g => g.gallery_type === 'internal').length || 0}
                </p>
              </div>
              <ImageIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pixieset</p>
                <p className="text-2xl font-bold text-gray-900">
                  {galleriesData?.galleries?.filter(g => g.gallery_type === 'pixieset').length || 0}
                </p>
              </div>
              <ExternalLink className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Google Drive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {galleriesData?.galleries?.filter(g => g.gallery_type === 'google_drive').length || 0}
                </p>
              </div>
              <ExternalLink className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Gallery Grid/List */}
        {filteredGalleries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
            <p className="text-gray-600">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No galleries available at the moment'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGalleries.map((gallery) => (
              <div
                key={gallery.id}
                onClick={() => navigate(`/galleries/${gallery.id}`)}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {gallery.thumbnail_url ? (
                    <img
                      src={gallery.thumbnail_url}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGalleryTypeBadgeColor(gallery.gallery_type)}`}>
                      {getGalleryTypeLabel(gallery.gallery_type)}
                    </span>
                  </div>

                  {/* External Link Indicator */}
                  {gallery.gallery_type !== 'internal' && (
                    <div className="absolute top-3 left-3 bg-white rounded-full p-2 shadow-sm">
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {gallery.title}
                  </h3>

                  {gallery.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {gallery.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(gallery.created_at).toLocaleDateString()}
                    </div>
                    {gallery.photo_count !== undefined && (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        {gallery.photo_count} photos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGalleries.map((gallery) => (
              <div
                key={gallery.id}
                onClick={() => navigate(`/galleries/${gallery.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-lg transition-shadow cursor-pointer flex gap-4"
              >
                {/* Thumbnail */}
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {gallery.thumbnail_url ? (
                    <img
                      src={gallery.thumbnail_url}
                      alt={gallery.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {gallery.title}
                      </h3>
                      {gallery.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {gallery.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGalleryTypeBadgeColor(gallery.gallery_type)}`}>
                      {getGalleryTypeLabel(gallery.gallery_type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(gallery.created_at).toLocaleDateString()}
                    </div>
                    {gallery.photo_count !== undefined && (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        {gallery.photo_count} photos
                      </div>
                    )}
                    {gallery.gallery_type !== 'internal' && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <ExternalLink className="h-4 w-4" />
                        External Gallery
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryListPage;

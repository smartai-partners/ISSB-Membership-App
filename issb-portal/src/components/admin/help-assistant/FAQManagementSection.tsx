/**
 * FAQ Management Section
 * Complete FAQ CRUD with search, filtering, and accessibility
 */

import React, { useState } from 'react';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FAQTable } from '@/components/admin/help-assistant/FAQTable';
import { FAQFormModal } from '@/components/admin/help-assistant/FAQFormModal';
import { useFAQs, useFAQCategories } from '@/hooks/useHelpAssistant';
import { extractErrorMessage } from '@/lib/error-mapping';
import type { FAQ } from '@/types';

export function FAQManagementSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  // Fetch data
  const { data, isLoading, error, refetch } = useFAQs({
    searchQuery: searchQuery || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  const { data: categoriesData } = useFAQCategories();
  const categories = categoriesData || [];

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingFAQ(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    refetch();
  };

  if (error) {
    return (
      <div
        role="alert"
        aria-live="polite"
        id="faq-panel"
        className="text-center py-12"
      >
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading FAQs</h2>
        <p className="text-gray-600 mb-4">{extractErrorMessage(error)}</p>
        <Button
          onClick={() => refetch()}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div id="faq-panel" role="tabpanel" aria-labelledby="faq-tab" className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">FAQ Knowledge Base</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data?.total || 0} FAQ{(data?.total || 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add New FAQ
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                id="faq-search"
                type="text"
                placeholder="Search questions and answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search FAQs by question or answer"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="sr-only">
              Filter by category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter" aria-label="Filter by category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* FAQ Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="sr-only">Loading FAQs...</span>
        </div>
      ) : (
        <FAQTable faqs={data?.faqs || []} onEdit={handleEdit} />
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingFAQ) && (
        <FAQFormModal
          isOpen={showAddModal || !!editingFAQ}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          faq={editingFAQ || undefined}
        />
      )}
    </div>
  );
}

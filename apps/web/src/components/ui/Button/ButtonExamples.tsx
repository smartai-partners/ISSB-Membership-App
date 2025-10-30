import React, { useState } from 'react';
import { Button } from './Button';
import { 
  Search, 
  Download, 
  Heart, 
  Settings, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Bookmark,
  Share,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

export const ButtonExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    // Simulate async action
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
  };

  return (
    <div className="space-y-12 p-8">
      {/* Basic Variants */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Sizes</h2>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* With Icons */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons with Icons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button icon={<Search size={16} />} variant="primary">
              Search
            </Button>
            <Button icon={<Download size={16} />} variant="outline">
              Download
            </Button>
            <Button icon={<Heart size={16} />} variant="ghost">
              Like
            </Button>
            <Button icon={<Settings size={16} />} iconPosition="right" variant="secondary">
              Settings
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button icon={<Plus size={16} />} variant="primary">
              Add New
            </Button>
            <Button icon={<Edit size={16} />} variant="outline">
              Edit
            </Button>
            <Button icon={<Trash2 size={16} />} variant="danger">
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Loading States</h2>
        <div className="flex flex-wrap gap-4">
          <Button loading variant="primary">
            Loading...
          </Button>
          <Button loading variant="outline">
            Processing
          </Button>
          <Button 
            loading={loading} 
            onClick={handleAsyncAction}
            variant="secondary"
          >
            {loading ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>
      </section>

      {/* Form Actions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Form Actions</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </section>

      {/* Status Actions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Status Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" icon={<CheckCircle size={16} />}>
            Approve
          </Button>
          <Button variant="danger" icon={<XCircle size={16} />}>
            Reject
          </Button>
          <Button variant="outline" icon={<AlertTriangle size={16} />}>
            Review
          </Button>
        </div>
      </section>

      {/* Full Width */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Full Width Button</h2>
        <div className="max-w-md">
          <Button fullWidth variant="primary" icon={<Save size={16} />}>
            Save All Changes
          </Button>
        </div>
      </section>

      {/* Icon Only */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Icon Only Buttons</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            icon={<Heart size={20} />}
            aria-label="Add to favorites"
          />
          <Button 
            variant="outline" 
            icon={<Bookmark size={20} />}
            aria-label="Bookmark"
          />
          <Button 
            variant="outline" 
            icon={<Share size={20} />}
            aria-label="Share"
          />
          <Button 
            variant="outline" 
            icon={<MoreHorizontal size={20} />}
            aria-label="More options"
          />
        </div>
      </section>

      {/* Combined Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Action Toolbar</h2>
        <div className="flex flex-wrap gap-2 border rounded-lg p-4">
          <Button size="sm" variant="outline" icon={<Plus size={14} />}>
            New
          </Button>
          <Button size="sm" variant="outline" icon={<Edit size={14} />}>
            Edit
          </Button>
          <Button size="sm" variant="outline" icon={<Save size={14} />}>
            Save
          </Button>
          <div className="border-l mx-2" />
          <Button size="sm" variant="ghost" icon={<Search size={14} />}>
            Find
          </Button>
          <Button size="sm" variant="ghost" icon={<Settings size={14} />}>
            Settings
          </Button>
        </div>
      </section>

      {/* Card Actions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Card Actions</h2>
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Project Card</h3>
          <p className="text-gray-600">Description of the project goes here...</p>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" icon={<Eye size={14} />}>
              View
            </Button>
            <Button size="sm" variant="outline" icon={<Edit size={14} />}>
              Edit
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={14} />}>
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Navigation Buttons</h2>
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon={<ChevronLeft size={16} />} iconPosition="left">
            Previous
          </Button>
          <Button variant="outline">1 of 3</Button>
          <Button variant="ghost" icon={<ChevronRight size={16} />} iconPosition="right">
            Next
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ButtonExamples;
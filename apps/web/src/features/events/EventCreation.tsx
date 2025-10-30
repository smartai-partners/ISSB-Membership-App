import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, Users, Tag, FileText, Settings, 
  Globe, Building, AlertCircle, Save, Eye, X 
} from 'lucide-react';
import { Event, EventType, MembershipTier, EventStatus, CreateInput } from '@issb/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Checkbox } from '../../components/ui/Checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useEventStore } from './EventStore';
import { cn } from '../../utils/cn';

interface EventCreationProps {
  onSuccess?: (event: Event) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateInput<Event>>;
  isEdit?: boolean;
  eventId?: string;
  className?: string;
}

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  tier: MembershipTier;
  status: EventStatus;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  location: string;
  isVirtual: boolean;
  virtualLink: string;
  capacity?: number;
  tags: string[];
  attachments: string[];
}

const EVENT_TYPES = [
  { value: EventType.CONFERENCE, label: 'Conference' },
  { value: EventType.WORKSHOP, label: 'Workshop' },
  { value: EventType.WEBINAR, label: 'Webinar' },
  { value: EventType.MEETING, label: 'Meeting' },
  { value: EventType.SOCIAL, label: 'Social' },
  { value: EventType.TRAINING, label: 'Training' }
];

const MEMBERSHIP_TIERS = [
  { value: MembershipTier.REGULAR, label: 'Regular Members' },
  { value: MembershipTier.BOARD, label: 'Board Members' },
  { value: MembershipTier.ADMIN, label: 'Admin Members' }
];

const EVENT_STATUSES = [
  { value: EventStatus.DRAFT, label: 'Draft' },
  { value: EventStatus.PUBLISHED, label: 'Published' }
];

export const EventCreation: React.FC<EventCreationProps> = ({
  onSuccess,
  onCancel,
  initialData,
  isEdit = false,
  eventId,
  className
}) => {
  const { createEvent, updateEvent, isLoading } = useEventStore();

  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || EventType.WORKSHOP,
    tier: initialData?.tier || MembershipTier.REGULAR,
    status: initialData?.status || EventStatus.DRAFT,
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
    registrationDeadline: initialData?.registrationDeadline ? new Date(initialData.registrationDeadline).toISOString().slice(0, 16) : '',
    location: initialData?.location || '',
    isVirtual: initialData?.isVirtual || false,
    virtualLink: initialData?.virtualLink || '',
    capacity: initialData?.capacity || undefined,
    tags: initialData?.tags || [],
    attachments: initialData?.attachments || []
  });

  const [errors, setErrors] = useState<Partial<EventFormData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const totalSteps = 4;

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Event type is required';
    }

    if (!formData.tier) {
      newErrors.tier = 'Membership tier is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date and time are required';
    } else if (new Date(formData.startDate) <= new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date and time are required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Check minimum duration (30 minutes)
    if (formData.startDate && formData.endDate) {
      const duration = new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime();
      if (duration < 30 * 60 * 1000) {
        newErrors.endDate = 'Event must be at least 30 minutes long';
      }
    }

    // Validate registration deadline
    if (formData.registrationDeadline) {
      if (new Date(formData.registrationDeadline) >= new Date(formData.startDate)) {
        newErrors.registrationDeadline = 'Registration deadline must be before event start';
      }
      
      // At least 1 hour between registration deadline and event start
      if (formData.startDate) {
        const deadline = new Date(formData.registrationDeadline);
        const oneHourLater = new Date(deadline.getTime() + 60 * 60 * 1000);
        if (oneHourLater >= new Date(formData.startDate)) {
          newErrors.registrationDeadline = 'Registration deadline must be at least 1 hour before event start';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.isVirtual && !formData.location.trim()) {
      newErrors.location = 'Location is required for physical events';
    }

    if (formData.isVirtual && !formData.virtualLink.trim()) {
      newErrors.virtualLink = 'Virtual link is required for virtual events';
    } else if (formData.virtualLink && !isValidUrl(formData.virtualLink)) {
      newErrors.virtualLink = 'Please enter a valid URL';
    }

    if (formData.capacity !== undefined && formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAttachmentAdd = () => {
    if (attachmentInput.trim() && isValidUrl(attachmentInput.trim()) && !formData.attachments.includes(attachmentInput.trim())) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, attachmentInput.trim()]
      }));
      setAttachmentInput('');
    }
  };

  const handleAttachmentRemove = (attachmentToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(attachment => attachment !== attachmentToRemove)
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined
      };

      let result: Event | null = null;
      
      if (isEdit && eventId) {
        result = await updateEvent(eventId, eventData);
      } else {
        result = await createEvent(eventData);
      }

      if (result && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Event save failed:', error);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              currentStep > i + 1 
                ? 'bg-green-600 text-white' 
                : currentStep === i + 1 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            )}>
              {currentStep > i + 1 ? '✓' : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn(
                'w-12 h-1 mx-2',
                currentStep > i + 1 ? 'bg-green-600' : 'bg-gray-200'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
        <p className="text-gray-600">
          Provide the essential details about your event.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Event Title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          placeholder="Enter a descriptive title for your event"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          placeholder="Describe your event, what attendees can expect, and any important details"
          rows={6}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Event Type"
            value={formData.type}
            onChange={(value) => handleInputChange('type', value as EventType)}
            error={errors.type}
            required
          >
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          <Select
            label="Membership Tier"
            value={formData.tier}
            onChange={(value) => handleInputChange('tier', value as MembershipTier)}
            error={errors.tier}
            helperText="Which membership tier can attend this event?"
            required
          >
            {MEMBERSHIP_TIERS.map(tier => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => handleInputChange('status', value as EventStatus)}
          error={errors.status}
          helperText="Draft events are only visible to organizers. Published events are visible to members."
        >
          {EVENT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Date and Time</h3>
        <p className="text-gray-600">
          Set when your event will take place and registration deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date & Time"
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => handleInputChange('startDate', e.target.value)}
          error={errors.startDate}
          required
        />

        <Input
          label="End Date & Time"
          type="datetime-local"
          value={formData.endDate}
          onChange={(e) => handleInputChange('endDate', e.target.value)}
          error={errors.endDate}
          required
        />
      </div>

      <Input
        label="Registration Deadline (Optional)"
        type="datetime-local"
        value={formData.registrationDeadline}
        onChange={(e) => handleInputChange('registrationDeadline', e.target.value || undefined)}
        error={errors.registrationDeadline}
        helperText="Leave empty for open registration until the event starts"
      />

      {formData.startDate && formData.endDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Event Duration</h4>
          <div className="text-sm text-blue-800">
            {(() => {
              const start = new Date(formData.startDate);
              const end = new Date(formData.endDate);
              const diffMs = end.getTime() - start.getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              
              if (diffHours > 0) {
                return diffMinutes > 0 
                  ? `${diffHours}h ${diffMinutes}m`
                  : `${diffHours}h`;
              }
              return `${diffMinutes}m`;
            })()}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Location & Capacity</h3>
        <p className="text-gray-600">
          Specify where your event will take place and capacity limits.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <label className="flex items-center space-x-3">
          <Checkbox
            checked={formData.isVirtual}
            onChange={(checked) => handleInputChange('isVirtual', checked)}
          />
          <div className="flex items-center">
            <Globe className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium">Virtual Event</span>
          </div>
        </label>
      </div>

      {!formData.isVirtual && (
        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          error={errors.location}
          leftIcon={<Building className="w-4 h-4" />}
          placeholder="Enter the physical address or venue name"
          required
        />
      )}

      {formData.isVirtual && (
        <Input
          label="Virtual Meeting Link"
          value={formData.virtualLink}
          onChange={(e) => handleInputChange('virtualLink', e.target.value)}
          error={errors.virtualLink}
          leftIcon={<Globe className="w-4 h-4" />}
          placeholder="https://zoom.us/j/..."
          helperText="Provide the link to your virtual meeting platform"
          required
        />
      )}

      <Input
        label="Capacity (Optional)"
        type="number"
        value={formData.capacity?.toString() || ''}
        onChange={(e) => handleInputChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
        error={errors.capacity}
        leftIcon={<Users className="w-4 h-4" />}
        placeholder="Leave empty for unlimited capacity"
        helperText="Set a limit on how many people can register"
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags & Attachments</h3>
        <p className="text-gray-600">
          Add tags to help people find your event and attach relevant files.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex items-center space-x-2 mb-3">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
            className="flex-1"
          />
          <Button type="button" onClick={handleTagAdd} variant="outline">
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments (Optional)
        </label>
        <div className="flex items-center space-x-2 mb-3">
          <Input
            value={attachmentInput}
            onChange={(e) => setAttachmentInput(e.target.value)}
            placeholder="Enter file URL"
            className="flex-1"
          />
          <Button type="button" onClick={handleAttachmentAdd} variant="outline">
            Add
          </Button>
        </div>
        {formData.attachments.length > 0 && (
          <div className="space-y-2">
            {formData.attachments.map((attachment, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <a
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {attachment}
                </a>
                <button
                  type="button"
                  onClick={() => handleAttachmentRemove(attachment)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div className="text-sm text-yellow-800">
            <div className="font-medium mb-1">Ready to Create Event?</div>
            <div>
              Review all information carefully before submitting. You can edit the event after creation, 
              but certain changes (like date/time) may affect existing registrations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isEdit ? 'Edit Event' : 'Create New Event'}</span>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {renderStepIndicator()}

          <div className="min-h-[500px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button 
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  loading={isLoading}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {isEdit ? 'Update Event' : 'Create Event'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Event Preview"
          size="xl"
        >
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="bg-white rounded-lg border">
              {/* Preview content would go here */}
              <div className="p-6 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Event Preview</h3>
                <p className="text-gray-600">
                  This is how your event will appear to members. Click outside to close.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventCreation;
import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, FileText, AlertCircle, CheckCircle, Calendar, Clock } from 'lucide-react';
import { Event, EventRegistration } from '@issb/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Checkbox } from '../../components/ui/Checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useEventStore } from './EventStore';
import { cn } from '../../utils/cn';

interface EventRegistrationFormProps {
  event: Event;
  onSuccess: (registration: EventRegistration) => void;
  onCancel: () => void;
  className?: string;
}

interface RegistrationData {
  specialRequirements: string;
  dietaryRestrictions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  marketingConsent: boolean;
}

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Shellfish-free',
  'Halal',
  'Kosher',
  'Other'
];

const RELATIONSHIPS = [
  'Spouse/Partner',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Colleague',
  'Doctor',
  'Other'
];

export const EventRegistration: React.FC<EventRegistrationFormProps> = ({
  event,
  onSuccess,
  onCancel,
  className
}) => {
  const { registerForEvent, isLoading } = useEventStore();
  
  const [formData, setFormData] = useState<RegistrationData>({
    specialRequirements: '',
    dietaryRestrictions: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    agreeToTerms: false,
    agreeToPrivacy: false,
    marketingConsent: false
  });

  const [errors, setErrors] = useState<Partial<RegistrationData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: any = {};
    
    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergencyContact = { ...newErrors.emergencyContact, name: 'Emergency contact name is required' };
    }
    
    if (!formData.emergencyContact.phone.trim()) {
      newErrors.emergencyContact = { ...newErrors.emergencyContact, phone: 'Emergency contact phone is required' };
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.emergencyContact.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.emergencyContact = { ...newErrors.emergencyContact, phone: 'Please enter a valid phone number' };
    }
    
    if (!formData.emergencyContact.relationship) {
      newErrors.emergencyContact = { ...newErrors.emergencyContact, relationship: 'Relationship is required' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: any = {};
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
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

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));

    // Clear error for this field
    if (errors.emergencyContact?.[field]) {
      setErrors(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: undefined
        }
      }));
    }
  };

  const handleDietaryRestrictionChange = (restriction: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: checked 
        ? [...prev.dietaryRestrictions, restriction]
        : prev.dietaryRestrictions.filter(r => r !== restriction)
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const registration = await registerForEvent(event.id, {
        eventId: event.id,
        specialRequirements: formData.specialRequirements,
        dietaryRestrictions: formData.dietaryRestrictions,
        emergencyContact: formData.emergencyContact
      });

      if (registration) {
        onSuccess(registration);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
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
              {currentStep > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Contact Information</h3>
        <p className="text-gray-600">
          We need emergency contact information for your safety and security during the event.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Emergency Contact Name"
          value={formData.emergencyContact.name}
          onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
          error={errors.emergencyContact?.name}
          leftIcon={<User className="w-4 h-4" />}
          placeholder="Full name of emergency contact"
          required
        />

        <Input
          label="Emergency Contact Phone"
          value={formData.emergencyContact.phone}
          onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
          error={errors.emergencyContact?.phone}
          leftIcon={<Phone className="w-4 h-4" />}
          placeholder="Phone number with country code"
          required
        />

        <Select
          label="Relationship"
          value={formData.emergencyContact.relationship}
          onChange={(value) => handleEmergencyContactChange('relationship', value)}
          error={errors.emergencyContact?.relationship}
          required
        >
          <option value="">Select relationship</option>
          {RELATIONSHIPS.map(relationship => (
            <option key={relationship} value={relationship}>
              {relationship}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Dietary Restrictions (Optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIETARY_RESTRICTIONS.map(restriction => (
            <label key={restriction} className="flex items-center space-x-2">
              <Checkbox
                checked={formData.dietaryRestrictions.includes(restriction)}
                onChange={(checked) => handleDietaryRestrictionChange(restriction, checked)}
              />
              <span className="text-sm text-gray-700">{restriction}</span>
            </label>
          ))}
        </div>
      </div>

      <Textarea
        label="Special Requirements (Optional)"
        value={formData.specialRequirements}
        onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
        placeholder="Please describe any special requirements, accessibility needs, or other information that would help us accommodate you better."
        rows={4}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Agreement and Consent</h3>
        <p className="text-gray-600">
          Please review and agree to our terms and policies.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-start space-x-3">
            <Checkbox
              checked={formData.agreeToTerms}
              onChange={(checked) => handleInputChange('agreeToTerms', checked)}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Terms and Conditions *
              </div>
              <div className="text-xs text-gray-600 mt-1">
                I agree to the event terms and conditions, including attendance policies, 
                code of conduct, and any specific event rules.
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600 mt-1">{errors.agreeToTerms}</p>
              )}
            </div>
          </label>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-start space-x-3">
            <Checkbox
              checked={formData.agreeToPrivacy}
              onChange={(checked) => handleInputChange('agreeToPrivacy', checked)}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Privacy Policy *
              </div>
              <div className="text-xs text-gray-600 mt-1">
                I consent to the collection and processing of my personal data as described 
                in the privacy policy for event registration and management purposes.
              </div>
              {errors.agreeToPrivacy && (
                <p className="text-sm text-red-600 mt-1">{errors.agreeToPrivacy}</p>
              )}
            </div>
          </label>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-start space-x-3">
            <Checkbox
              checked={formData.marketingConsent}
              onChange={(checked) => handleInputChange('marketingConsent', checked)}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Marketing Communications (Optional)
              </div>
              <div className="text-xs text-gray-600 mt-1">
                I would like to receive updates about future events, news, and special offers.
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Your Registration</h3>
        <p className="text-gray-600">
          Please review your information before submitting your registration.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(event.startDate)}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Name: {formData.emergencyContact.name}</div>
            <div>Phone: {formData.emergencyContact.phone}</div>
            <div>Relationship: {formData.emergencyContact.relationship}</div>
          </div>
        </div>

        {formData.dietaryRestrictions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Dietary Restrictions</h4>
            <div className="text-sm text-gray-600">
              {formData.dietaryRestrictions.join(', ')}
            </div>
          </div>
        )}

        {formData.specialRequirements && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Special Requirements</h4>
            <div className="text-sm text-gray-600">
              {formData.specialRequirements}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Register for Event</CardTitle>
          <div className="text-sm text-gray-600 mt-1">
            <div className="font-medium">{event.title}</div>
            <div>{formatDate(event.startDate)} at {formatTime(event.startDate)}</div>
          </div>
        </CardHeader>

        <CardContent>
          {renderStepIndicator()}

          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {currentStep < totalSteps ? (
                <Button 
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  Submit Registration
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventRegistration;
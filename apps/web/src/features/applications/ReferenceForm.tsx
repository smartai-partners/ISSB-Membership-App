import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { 
  Reference 
} from '../../../../packages/types/src';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Edit,
  Save,
  X,
  Send,
  ExternalLink
} from 'lucide-react';

interface ReferenceFormProps {
  references: Reference[];
  onReferencesChange: (references: Reference[]) => void;
  onSendReferenceRequest?: (reference: Reference, index: number) => Promise<void>;
  isReadOnly?: boolean;
  showRequestActions?: boolean;
  className?: string;
}

interface ReferenceFormData {
  name: string;
  email: string;
  phone: string;
  organization: string;
  relationship: string;
  yearsKnown: number;
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({
  references,
  onReferencesChange,
  onSendReferenceRequest,
  isReadOnly = false,
  showRequestActions = false,
  className = ''
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReferenceFormData>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    relationship: '',
    yearsKnown: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (data: ReferenceFormData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!data.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]+$/.test(data.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!data.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }

    if (!data.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }

    if (data.yearsKnown < 0 || data.yearsKnown > 50) {
      newErrors.yearsKnown = 'Years known must be between 0 and 50';
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof ReferenceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEdit = (index: number) => {
    const reference = references[index];
    setFormData({
      name: reference.name,
      email: reference.email,
      phone: reference.phone,
      organization: reference.organization,
      relationship: reference.relationship,
      yearsKnown: reference.yearsKnown,
    });
    setEditingIndex(index);
    setErrors({});
  };

  const handleSave = () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedReferences = [...references];
    if (editingIndex !== null) {
      updatedReferences[editingIndex] = {
        ...formData,
        verified: references[editingIndex].verified,
        verifiedAt: references[editingIndex].verifiedAt,
      };
      onReferencesChange(updatedReferences);
      setEditingIndex(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      organization: '',
      relationship: '',
      yearsKnown: 0,
    });
    setErrors({});
  };

  const handleAdd = () => {
    if (references.length >= 2) return;

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Check for duplicate email
    const emailExists = references.some(ref => ref.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
      setErrors({ email: 'This email is already used by another reference' });
      return;
    }

    const newReference: Reference = {
      ...formData,
      verified: false,
    };

    onReferencesChange([...references, newReference]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      organization: '',
      relationship: '',
      yearsKnown: 0,
    });
  };

  const handleRemove = (index: number) => {
    const updatedReferences = references.filter((_, i) => i !== index);
    onReferencesChange(updatedReferences);
  };

  const handleSendRequest = async (reference: Reference, index: number) => {
    if (!onSendReferenceRequest) return;

    setIsSubmitting(true);
    try {
      await onSendReferenceRequest(reference, index);
    } catch (error) {
      console.error('Failed to send reference request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = (reference?: Reference, index?: number) => {
    const isEditing = editingIndex === index;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Reference {index !== undefined ? index + 1 : references.length + 1}</span>
              {reference?.verified && (
                <Badge variant="success" className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified</span>
                </Badge>
              )}
            </div>
            {!isReadOnly && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  index !== undefined && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(index)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemove(index)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  )
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={isEditing ? formData.name : reference?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Reference full name"
                disabled={!isEditing}
                error={errors.name}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={isEditing ? formData.email : reference?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
                disabled={!isEditing}
                error={errors.email}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <Input
                value={isEditing ? formData.phone : reference?.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={!isEditing}
                error={errors.phone}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Organization *</label>
              <Input
                value={isEditing ? formData.organization : reference?.organization || ''}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="Company or organization"
                disabled={!isEditing}
                error={errors.organization}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Relationship *</label>
              <Input
                value={isEditing ? formData.relationship : reference?.relationship || ''}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                placeholder="e.g., Former manager, Colleague, Client"
                disabled={!isEditing}
                error={errors.relationship}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Years Known *</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={isEditing ? formData.yearsKnown : reference?.yearsKnown || 0}
                onChange={(e) => handleInputChange('yearsKnown', parseInt(e.target.value) || 0)}
                disabled={!isEditing}
                error={errors.yearsKnown}
              />
            </div>
          </div>

          {reference?.verified && reference.verifiedAt && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Reference Verified</p>
                <p className="text-xs text-green-600">
                  Verified on {new Date(reference.verifiedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {showRequestActions && reference && !reference.verified && (
            <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Reference Request Pending</p>
                  <p className="text-xs text-yellow-600">
                    Awaiting response from {reference.name}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSendRequest(reference, index!)}
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Sending...' : 'Resend Request'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAddForm = () => {
    if (references.length >= 2 || isReadOnly) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Reference</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Reference full name"
                error={errors.name}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
                error={errors.email}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                error={errors.phone}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Organization *</label>
              <Input
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="Company or organization"
                error={errors.organization}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Relationship *</label>
              <Input
                value={formData.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                placeholder="e.g., Former manager, Colleague, Client"
                error={errors.relationship}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Years Known *</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.yearsKnown}
                onChange={(e) => handleInputChange('yearsKnown', parseInt(e.target.value) || 0)}
                error={errors.yearsKnown}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Clear
            </Button>
            <Button onClick={handleAdd} disabled={references.length >= 2}>
              Add Reference
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Please provide two professional references who can attest to your qualifications and character.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• References should know you in a professional context</li>
              <li>• They should be able to speak to your skills and experience</li>
              <li>• Contact information will be verified</li>
              <li>• References will receive an email request to provide feedback</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Existing References */}
      {references.map((reference, index) => renderForm(reference, index))}

      {/* Add Reference Form */}
      {renderAddForm()}

      {/* Reference Summary */}
      {references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reference Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total References</span>
                <Badge variant="default">{references.length}/2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verified References</span>
                <Badge variant="success">
                  {references.filter(ref => ref.verified).length}/{references.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Years Known</span>
                <Badge variant="secondary">
                  {references.length > 0 
                    ? Math.round(references.reduce((sum, ref) => sum + ref.yearsKnown, 0) / references.length)
                    : 0} years
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Reference Request Component for email notifications
export const ReferenceRequest: React.FC<{
  reference: Reference;
  applicantName: string;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ reference, applicantName, onAccept, onDecline }) => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Reference Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-800">
          <strong>{applicantName}</strong> has requested you as a professional reference for their membership application.
        </p>
        
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h4 className="font-medium">Reference Details</h4>
          <div className="text-sm space-y-1">
            <p><strong>Name:</strong> {reference.name}</p>
            <p><strong>Email:</strong> {reference.email}</p>
            <p><strong>Organization:</strong> {reference.organization}</p>
            <p><strong>Relationship:</strong> {reference.relationship}</p>
            <p><strong>Years Known:</strong> {reference.yearsKnown}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onAccept} className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept & Provide Reference
          </Button>
          <Button variant="outline" onClick={onDecline} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Decline Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Reference Form for Reference Provider
export const ReferenceProviderForm: React.FC<{
  reference: Reference;
  applicantName: string;
  onSubmit: (feedback: {
    relationship: string;
    yearsKnown: number;
    skills: string[];
    strengths: string;
    improvements: string;
    recommendation: 'strong' | 'moderate' | 'weak';
    additionalComments: string;
  }) => Promise<void>;
}> = ({ reference, applicantName, onSubmit }) => {
  const [formData, setFormData] = useState({
    relationship: reference.relationship,
    yearsKnown: reference.yearsKnown,
    skills: [] as string[],
    strengths: '',
    improvements: '',
    recommendation: 'moderate' as 'strong' | 'moderate' | 'weak',
    additionalComments: '',
  });

  const skillOptions = [
    'Communication', 'Leadership', 'Technical Skills', 'Problem Solving',
    'Teamwork', 'Reliability', 'Professionalism', 'Creativity',
    'Organizational Skills', 'Time Management', 'Customer Service', 'Project Management'
  ];

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Professional Reference for {applicantName}</CardTitle>
          <p className="text-sm text-gray-600">
            Please provide your honest assessment of {applicantName}'s professional abilities and character.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Relationship to Applicant *</label>
              <Input
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Years You've Known Them *</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.yearsKnown}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsKnown: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          {/* Skills Assessment */}
          <div>
            <label className="block text-sm font-medium mb-3">Professional Skills (Select all that apply)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {skillOptions.map(skill => (
                <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-sm font-medium mb-2">Key Strengths *</label>
            <Textarea
              value={formData.strengths}
              onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
              placeholder="Describe the applicant's key professional strengths..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Areas for Improvement */}
          <div>
            <label className="block text-sm font-medium mb-2">Areas for Improvement</label>
            <Textarea
              value={formData.improvements}
              onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
              placeholder="Any areas where you feel the applicant could improve (optional)..."
              className="min-h-[100px]"
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium mb-3">Overall Recommendation *</label>
            <div className="space-y-2">
              {[
                { value: 'strong', label: 'Strongly Recommend', desc: 'I would highly recommend this applicant' },
                { value: 'moderate', label: 'Recommend', desc: 'I recommend this applicant' },
                { value: 'weak', label: 'Cannot Recommend', desc: 'I cannot recommend this applicant' },
              ].map(option => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={formData.recommendation === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value as any }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Comments */}
          <div>
            <label className="block text-sm font-medium mb-2">Additional Comments</label>
            <Textarea
              value={formData.additionalComments}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
              placeholder="Any additional comments or information you'd like to provide..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="submit">
              Submit Reference
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

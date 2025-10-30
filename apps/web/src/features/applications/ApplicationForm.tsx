import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { MembershipTier, MembershipApplication, Reference, Certification, ApplicationStatus, Document, ExperienceType, DocumentType } from '../../../../packages/types/src';
import { 
  CreateApplicationSchema, 
  PersonalInfoSchema, 
  ProfessionalInfoSchema,
  ApplicationValidationUtils 
} from '../../../../packages/types/src/ApplicationValidators';
import { ChevronLeft, ChevronRight, User, Briefcase, FileText, Upload, CheckCircle2 } from 'lucide-react';

interface FormData {
  applicationType: MembershipTier;
  personalInfo: {
    dateOfBirth?: Date;
    location: string;
    occupation: string;
    organization?: string;
    website?: string;
  };
  professionalInfo: {
    yearsOfExperience: number;
    certifications: Certification[];
    languages: string[];
    areasOfExpertise: string[];
    currentRole: string;
    reference1: Reference;
    reference2: Reference;
  };
  documents: Document[];
  additionalInfo?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

interface StepProps {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

const steps = [
  { id: 'type', title: 'Application Type', icon: CheckCircle2 },
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'professional', title: 'Professional Information', icon: Briefcase },
  { id: 'references', title: 'References', icon: User },
  { id: 'documents', title: 'Documents', icon: Upload },
  { id: 'review', title: 'Review & Submit', icon: FileText },
];

const ApplicationTypeStep: React.FC<StepProps> = ({ data, onChange, onNext }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Membership Tier</h3>
        <div className="grid gap-4">
          {Object.values(MembershipTier).map((tier) => (
            <Card 
              key={tier} 
              className={`cursor-pointer transition-colors ${
                data.applicationType === tier ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
              }`}
              onClick={() => onChange({ applicationType: tier })}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox checked={data.applicationType === tier} readOnly />
                  <div>
                    <h4 className="font-medium capitalize">{tier} Membership</h4>
                    <p className="text-sm text-gray-600">
                      {tier === MembershipTier.REGULAR && 'Basic membership with standard benefits'}
                      {tier === MembershipTier.BOARD && 'Board membership with enhanced privileges'}
                      {tier === MembershipTier.ADMIN && 'Administrative membership with full access'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!data.applicationType}>
          Next
        </Button>
      </div>
    </div>
  );
};

const PersonalInfoStep: React.FC<StepProps> = ({ data, onChange, onNext, onPrevious, errors }) => {
  const handleChange = (field: string, value: any) => {
    onChange({ 
      personalInfo: { 
        ...data.personalInfo, 
        [field]: value 
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Location *</label>
          <Input
            value={data.personalInfo.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="City, State/Country"
            error={errors?.['personalInfo.location']}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Occupation *</label>
          <Input
            value={data.personalInfo.occupation}
            onChange={(e) => handleChange('occupation', e.target.value)}
            placeholder="Your current occupation"
            error={errors?.['personalInfo.occupation']}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Organization</label>
          <Input
            value={data.personalInfo.organization || ''}
            onChange={(e) => handleChange('organization', e.target.value)}
            placeholder="Your organization"
            error={errors?.['personalInfo.organization']}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Website</label>
          <Input
            type="url"
            value={data.personalInfo.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://your-website.com"
            error={errors?.['personalInfo.website']}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth</label>
          <Input
            type="date"
            value={data.personalInfo.dateOfBirth?.toISOString().split('T')[0] || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
            error={errors?.['personalInfo.dateOfBirth']}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!data.personalInfo.location || !data.personalInfo.occupation}>
          Next
        </Button>
      </div>
    </div>
  );
};

const ProfessionalInfoStep: React.FC<StepProps> = ({ data, onChange, onNext, onPrevious, errors }) => {
  const handleChange = (field: string, value: any) => {
    onChange({ 
      professionalInfo: { 
        ...data.professionalInfo, 
        [field]: value 
      } 
    });
  };

  const addLanguage = (language: string) => {
    if (language && !data.professionalInfo.languages.includes(language)) {
      handleChange('languages', [...data.professionalInfo.languages, language]);
    }
  };

  const removeLanguage = (index: number) => {
    handleChange('languages', data.professionalInfo.languages.filter((_, i) => i !== index));
  };

  const addAreaOfExpertise = (area: string) => {
    if (area && !data.professionalInfo.areasOfExpertise.includes(area)) {
      handleChange('areasOfExpertise', [...data.professionalInfo.areasOfExpertise, area]);
    }
  };

  const removeAreaOfExpertise = (index: number) => {
    handleChange('areasOfExpertise', data.professionalInfo.areasOfExpertise.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Years of Experience *</label>
        <Input
          type="number"
          min="0"
          max="50"
          value={data.professionalInfo.yearsOfExperience}
          onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value) || 0)}
          error={errors?.['professionalInfo.yearsOfExperience']}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Current Role *</label>
        <Input
          value={data.professionalInfo.currentRole}
          onChange={(e) => handleChange('currentRole', e.target.value)}
          placeholder="Your current job title"
          error={errors?.['professionalInfo.currentRole']}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Languages *</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a language"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addLanguage((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <Button
              type="button"
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                addLanguage(input.value);
                input.value = '';
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.professionalInfo.languages.map((lang, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Areas of Expertise *</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add an area of expertise"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addAreaOfExpertise((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <Button
              type="button"
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                addAreaOfExpertise(input.value);
                input.value = '';
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.professionalInfo.areasOfExpertise.map((area, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {area}
                <button
                  type="button"
                  onClick={() => removeAreaOfExpertise(index)}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={onNext}
          disabled={
            !data.professionalInfo.yearsOfExperience &&
            !data.professionalInfo.currentRole ||
            data.professionalInfo.languages.length === 0 ||
            data.professionalInfo.areasOfExpertise.length === 0
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
};

const ReferencesStep: React.FC<StepProps> = ({ data, onChange, onNext, onPrevious, errors }) => {
  const handleReferenceChange = (index: 1 | 2, field: string, value: any) => {
    const references = [...data.professionalInfo.references];
    references[index - 1] = { ...references[index - 1], [field]: value };
    onChange({ 
      professionalInfo: { 
        ...data.professionalInfo, 
        [`reference${index}`]: references[index - 1] 
      } 
    });
  };

  return (
    <div className="space-y-6">
      {[1, 2].map((refNum) => (
        <div key={refNum} className="border rounded-lg p-4">
          <h4 className="font-medium mb-4">Reference {refNum}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={data.professionalInfo[`reference${refNum}` as keyof typeof data.professionalInfo]?.name || ''}
                onChange={(e) => handleReferenceChange(refNum as 1 | 2, 'name', e.target.value)}
                placeholder="Reference name"
                error={errors?.[`professionalInfo.reference${refNum}.name`]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={data.professionalInfo[`reference${refNum}` as keyof typeof data.professionalInfo]?.email || ''}
                onChange={(e) => handleReferenceChange(refNum as 1 | 2, 'email', e.target.value)}
                placeholder="email@example.com"
                error={errors?.[`professionalInfo.reference${refNum}.email`]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <Input
                value={data.professionalInfo[`reference${refNum}` as keyof typeof data.professionalInfo]?.phone || ''}
                onChange={(e) => handleReferenceChange(refNum as 1 | 2, 'phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                error={errors?.[`professionalInfo.reference${refNum}.phone`]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Organization *</label>
              <Input
                value={data.professionalInfo[`reference${refNum}` as keyof typeof data.professionalInfo]?.organization || ''}
                onChange={(e) => handleReferenceChange(refNum as 1 | 2, 'organization', e.target.value)}
                placeholder="Organization name"
                error={errors?.[`professionalInfo.reference${refNum}.organization`]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relationship *</label>
              <Input
                value={data.professionalInfo[`reference${refNum}` as keyof typeof data.professionalInfo]?.relationship || ''}
                onChange={(e) => handleReferenceChange(refNum as 1 | 2, 'relationship', e.target.value)}
                placeholder="How you know them"
                error={errors?.[`professionalInfo.reference${refNum}.relationship`]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Years Known *</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={data.professionalInfo[`reference${refNum}` as keyof typeof data.professionalInfo]?.yearsKnown || 0}
                onChange={(e) => handleReferenceChange(refNum as 1 | 2, 'yearsKnown', parseInt(e.target.value) || 0)}
                error={errors?.[`professionalInfo.reference${refNum}.yearsKnown`]}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={onNext}
          disabled={
            !data.professionalInfo.reference1.name ||
            !data.professionalInfo.reference2.name ||
            data.professionalInfo.reference1.email === data.professionalInfo.reference2.email
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
};

const DocumentsStep: React.FC<StepProps> = ({ data, onChange, onNext, onPrevious }) => {
  const handleFileUpload = (files: FileList) => {
    const newDocuments: Document[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: DocumentType.OTHER,
      size: file.size,
      mimeType: file.type,
      path: URL.createObjectURL(file),
      uploadedAt: new Date(),
      uploadedBy: 'current-user-id',
      verified: false,
    }));
    
    onChange({ documents: [...data.documents, ...newDocuments] });
  };

  const removeDocument = (index: number) => {
    onChange({ documents: data.documents.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Upload Required Documents</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Upload documents (PDF, images, etc.)
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Maximum 10MB per file
              </span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
            <Button type="button" className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      {data.documents.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Uploaded Documents</h4>
          <div className="space-y-2">
            {data.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDocument(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={data.documents.length === 0}>
          Next
        </Button>
      </div>
    </div>
  );
};

const ReviewStep: React.FC<StepProps> = ({ data, onChange, onNext, onPrevious, onSave }) => {
  const completeness = ApplicationValidationUtils.calculateCompleteness(data);
  const requirements = ApplicationValidationUtils.meetsMinimumRequirements(data);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Review Your Application</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Application Completeness</span>
            <span className="text-sm font-bold text-blue-900">{completeness}%</span>
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {!requirements.valid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-red-900 mb-2">Missing Required Information:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {requirements.missing.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm capitalize">{data.applicationType} Membership</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Location:</strong> {data.personalInfo.location}</p>
              <p><strong>Occupation:</strong> {data.personalInfo.occupation}</p>
              {data.personalInfo.organization && (
                <p><strong>Organization:</strong> {data.personalInfo.organization}</p>
              )}
              {data.personalInfo.website && (
                <p><strong>Website:</strong> {data.personalInfo.website}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Years of Experience:</strong> {data.professionalInfo.yearsOfExperience}</p>
              <p><strong>Current Role:</strong> {data.professionalInfo.currentRole}</p>
              <div>
                <strong>Languages:</strong> {data.professionalInfo.languages.join(', ')}
              </div>
              <div>
                <strong>Areas of Expertise:</strong> {data.professionalInfo.areasOfExpertise.join(', ')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">References</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>Reference 1:</strong> {data.professionalInfo.reference1.name} ({data.professionalInfo.reference1.email})
              </div>
              <div>
                <strong>Reference 2:</strong> {data.professionalInfo.reference2.name} ({data.professionalInfo.reference2.email})
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{data.documents.length} document(s) uploaded</p>
            </CardContent>
          </Card>
        </div>

        <div className="border-t pt-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={data.agreeToTerms}
                onCheckedChange={(checked) => onChange({ agreeToTerms: checked as boolean })}
              />
              <label className="text-sm">
                I agree to the <a href="#" className="text-blue-600 hover:underline">terms and conditions</a>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={data.agreeToPrivacy}
                onCheckedChange={(checked) => onChange({ agreeToPrivacy: checked as boolean })}
              />
              <label className="text-sm">
                I agree to the <a href="#" className="text-blue-600 hover:underline">privacy policy</a>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={onSave}>
            Save Draft
          </Button>
          <Button 
            onClick={onNext}
            disabled={!data.agreeToTerms || !data.agreeToPrivacy || !requirements.valid}
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ApplicationForm: React.FC<{
  application?: MembershipApplication;
  onSubmit: (data: FormData) => Promise<void>;
  onSave?: (data: FormData) => Promise<void>;
}> = ({ application, onSubmit, onSave }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    applicationType: application?.applicationType || MembershipTier.REGULAR,
    personalInfo: application?.personalInfo || {
      location: '',
      occupation: '',
    },
    professionalInfo: application?.professionalInfo || {
      yearsOfExperience: 0,
      certifications: [],
      languages: [],
      areasOfExpertise: [],
      currentRole: '',
      reference1: {
        name: '',
        email: '',
        phone: '',
        organization: '',
        relationship: '',
        yearsKnown: 0,
        verified: false,
      },
      reference2: {
        name: '',
        email: '',
        phone: '',
        organization: '',
        relationship: '',
        yearsKnown: 0,
        verified: false,
      },
    },
    documents: application?.documents || [],
    additionalInfo: application?.additionalInfo,
    agreeToTerms: false,
    agreeToPrivacy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const validateStep = (stepIndex: number): boolean => {
    setErrors({});
    
    try {
      switch (stepIndex) {
        case 0: // Application Type
          if (!formData.applicationType) {
            setErrors({ applicationType: 'Please select an application type' });
            return false;
          }
          break;
        case 1: // Personal Info
          PersonalInfoSchema.parse(formData.personalInfo);
          break;
        case 2: // Professional Info
          ProfessionalInfoSchema.parse(formData.professionalInfo);
          break;
        case 3: // References
          // References are part of ProfessionalInfo
          break;
        case 4: // Documents
          if (formData.documents.length === 0) {
            setErrors({ documents: 'At least one document is required' });
            return false;
          }
          break;
        case 5: // Review
          if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
            setErrors({ agreements: 'You must agree to all terms' });
            return false;
          }
          break;
      }
      return true;
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path.join('.')] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (onSave) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }
  };

  const renderStep = () => {
    const stepProps = {
      data: formData,
      onChange: updateFormData,
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSave: handleSaveDraft,
      isSubmitting,
      errors,
    };

    switch (currentStep) {
      case 0:
        return <ApplicationTypeStep {...stepProps} />;
      case 1:
        return <PersonalInfoStep {...stepProps} />;
      case 2:
        return <ProfessionalInfoStep {...stepProps} />;
      case 3:
        return <ReferencesStep {...stepProps} />;
      case 4:
        return <DocumentsStep {...stepProps} />;
      case 5:
        return <ReviewStep {...stepProps} onNext={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Membership Application</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-300 bg-white text-gray-300'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-2 hidden md:block">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

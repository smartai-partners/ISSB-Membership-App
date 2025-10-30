import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Checkbox } from '../../../components/ui/Checkbox';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/RadioGroup';
import { 
  MembershipApplication, 
  ApplicationReview as ApplicationReviewType, 
  ReviewDecision,
  MembershipTier,
  ApplicationStatus,
  Reference,
  Certification,
  Document,
  User
} from '../../../../packages/types/src';
import { ApplicationReviewSchema } from '../../../../packages/types/src/ApplicationValidators';
import { 
  FileText, 
  User as UserIcon, 
  Briefcase, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Mail,
  Phone,
  Building,
  Calendar,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';

interface ApplicationReviewProps {
  application: MembershipApplication;
  reviewer: User;
  onSubmitReview: (review: Partial<ApplicationReviewType>) => Promise<void>;
  onRequestDocuments: (documentRequests: string[]) => Promise<void>;
  onScheduleInterview: (date: Date) => Promise<void>;
  isLoading?: boolean;
}

interface ReviewFormData {
  decision: ReviewDecision;
  comments: string;
  documentsReviewed: boolean;
  credentialsVerified: boolean;
  referencesContacted: boolean;
  additionalDocumentsRequired: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  interviewRequired: boolean;
  interviewDate?: Date;
  rating?: number;
}

export const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  application,
  reviewer,
  onSubmitReview,
  onRequestDocuments,
  onScheduleInterview,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'references' | 'review'>('overview');
  const [reviewData, setReviewData] = useState<ReviewFormData>({
    decision: ReviewDecision.PENDING,
    comments: '',
    documentsReviewed: false,
    credentialsVerified: false,
    referencesContacted: false,
    additionalDocumentsRequired: [],
    followUpRequired: false,
    interviewRequired: false,
    rating: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDocumentRequest, setNewDocumentRequest] = useState('');

  const handleReviewSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitReview({
        applicationId: application.id,
        reviewerId: reviewer.id,
        ...reviewData,
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDocuments = async () => {
    if (newDocumentRequest.trim()) {
      const updatedRequests = [...reviewData.additionalDocumentsRequired, newDocumentRequest.trim()];
      setReviewData(prev => ({ ...prev, additionalDocumentsRequired: updatedRequests }));
      await onRequestDocuments(updatedRequests);
      setNewDocumentRequest('');
    }
  };

  const handleScheduleInterview = async () => {
    if (reviewData.interviewDate) {
      await onScheduleInterview(reviewData.interviewDate);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewData(prev => ({ ...prev, rating }))}
            className={`p-1 ${star <= (reviewData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-lg font-semibold capitalize">{application.status.replace('_', ' ')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Application Type</p>
              <p className="text-lg font-semibold capitalize">{application.applicationType} Membership</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{application.personalInfo.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Occupation</p>
              <p className="font-medium">{application.personalInfo.occupation}</p>
            </div>
            {application.personalInfo.organization && (
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="font-medium">{application.personalInfo.organization}</p>
              </div>
            )}
            {application.personalInfo.website && (
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a 
                  href={application.personalInfo.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {application.personalInfo.website}
                </a>
              </div>
            )}
            {application.personalInfo.dateOfBirth && (
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">
                  {new Date(application.personalInfo.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Years of Experience</p>
              <p className="font-medium">{application.professionalInfo.yearsOfExperience}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Role</p>
              <p className="font-medium">{application.professionalInfo.currentRole}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Languages</p>
            <div className="flex flex-wrap gap-2">
              {application.professionalInfo.languages.map((lang, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Areas of Expertise</p>
            <div className="flex flex-wrap gap-2">
              {application.professionalInfo.areasOfExpertise.map((area, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>

          {application.professionalInfo.certifications.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Certifications</p>
              <div className="space-y-2">
                {application.professionalInfo.certifications.map((cert, index) => (
                  <div key={index} className="border rounded p-3">
                    <h4 className="font-medium">{cert.name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                    <p className="text-xs text-gray-500">
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                      {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Documents ({application.documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {application.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{doc.type} • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Request Section */}
      <Card>
        <CardHeader>
          <CardTitle>Request Additional Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Document request (e.g., additional certificates)"
              value={newDocumentRequest}
              onChange={(e) => setNewDocumentRequest(e.target.value)}
            />
            <Button onClick={handleRequestDocuments} disabled={!newDocumentRequest.trim()}>
              Request
            </Button>
          </div>
          
          {reviewData.additionalDocumentsRequired.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Requested Documents:</p>
              <ul className="space-y-1">
                {reviewData.additionalDocumentsRequired.map((req, index) => (
                  <li key={index} className="text-sm text-gray-600">• {req}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReferences = () => (
    <div className="space-y-4">
      {[application.professionalInfo.reference1, application.professionalInfo.reference2].map((ref, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Reference {index + 1}
              {ref.verified ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{ref.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{ref.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{ref.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Organization</p>
                  <p className="font-medium">{ref.organization}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Relationship</p>
                  <p className="font-medium">{ref.relationship}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Years Known</p>
                <p className="font-medium">{ref.yearsKnown}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Decision *</label>
            <RadioGroup
              value={reviewData.decision}
              onValueChange={(value) => setReviewData(prev => ({ ...prev, decision: value as ReviewDecision }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ReviewDecision.APPROVED} id="approved" />
                <label htmlFor="approved" className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ReviewDecision.REJECTED} id="rejected" />
                <label htmlFor="rejected" className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  Reject
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ReviewDecision.NEEDS_MORE_INFO} id="needs-more-info" />
                <label htmlFor="needs-more-info" className="flex items-center gap-2 text-yellow-600">
                  <Clock className="w-4 h-4" />
                  Needs More Information
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ReviewDecision.PENDING} id="pending" />
                <label htmlFor="pending" className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="w-4 h-4" />
                  Pending Review
                </label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Review Comments *</label>
            <Textarea
              value={reviewData.comments}
              onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Provide detailed feedback about your decision..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={reviewData.documentsReviewed}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, documentsReviewed: checked as boolean }))}
              />
              <label>Documents have been thoroughly reviewed</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={reviewData.credentialsVerified}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, credentialsVerified: checked as boolean }))}
              />
              <label>Credentials and qualifications verified</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={reviewData.referencesContacted}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, referencesContacted: checked as boolean }))}
              />
              <label>References have been contacted</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Overall Rating</label>
            {renderStars(0)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={reviewData.followUpRequired}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, followUpRequired: checked as boolean }))}
              />
              <label>Follow-up required</label>
            </div>
            {reviewData.followUpRequired && (
              <div>
                <label className="block text-sm font-medium mb-2">Follow-up Date</label>
                <Input
                  type="date"
                  value={reviewData.followUpDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setReviewData(prev => ({ ...prev, followUpDate: e.target.value ? new Date(e.target.value) : undefined }))}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={reviewData.interviewRequired}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, interviewRequired: checked as boolean }))}
              />
              <label>Interview required</label>
            </div>
            {reviewData.interviewRequired && (
              <div>
                <label className="block text-sm font-medium mb-2">Interview Date</label>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={reviewData.interviewDate?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setReviewData(prev => ({ ...prev, interviewDate: e.target.value ? new Date(e.target.value) : undefined }))}
                  />
                  <Button onClick={handleScheduleInterview} disabled={!reviewData.interviewDate}>
                    Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">
              Save Draft Review
            </Button>
            <Button 
              onClick={handleReviewSubmit}
              disabled={isSubmitting || !reviewData.decision || !reviewData.comments.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Application Review</h1>
            <p className="text-gray-600 mt-1">
              Reviewing application for {application.applicationType} membership
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Reviewer</p>
            <p className="font-medium">{reviewer.firstName} {reviewer.lastName}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'documents', label: 'Documents' },
            { id: 'references', label: 'References' },
            { id: 'review', label: 'Review & Decision' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'references' && renderReferences()}
        {activeTab === 'review' && renderReview()}
      </div>
    </div>
  );
};

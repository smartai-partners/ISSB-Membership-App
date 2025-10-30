import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  MembershipApplication, 
  ApplicationStatus as StatusType,
  User 
} from '../../../../packages/types/src';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Upload,
  Eye,
  Calendar,
  User as UserIcon,
  MessageSquare,
  Download,
  Share
} from 'lucide-react';

interface ApplicationStatusProps {
  application: MembershipApplication;
  applicant?: User;
  onViewDetails?: () => void;
  onRequestDocuments?: () => void;
  onScheduleInterview?: () => void;
  onWithdraw?: () => void;
  onCancel?: () => void;
  isApplicant?: boolean;
  className?: string;
}

interface StatusStep {
  id: StatusType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  textColor: string;
}

const statusSteps: StatusStep[] = [
  {
    id: StatusType.DRAFT,
    label: 'Draft',
    description: 'Application is being prepared',
    icon: FileText,
    color: 'border-gray-400',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
  },
  {
    id: StatusType.SUBMITTED,
    label: 'Submitted',
    description: 'Application submitted and awaiting review',
    icon: Upload,
    color: 'border-blue-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    id: StatusType.UNDER_REVIEW,
    label: 'Under Review',
    description: 'Application is being reviewed by our team',
    icon: Eye,
    color: 'border-yellow-400',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  {
    id: StatusType.PENDING_DOCUMENTS,
    label: 'Additional Documents',
    description: 'Additional documents required',
    icon: AlertCircle,
    color: 'border-orange-400',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  {
    id: StatusType.APPROVED,
    label: 'Approved',
    description: 'Application approved - welcome aboard!',
    icon: CheckCircle,
    color: 'border-green-400',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  {
    id: StatusType.REJECTED,
    label: 'Rejected',
    description: 'Application not approved at this time',
    icon: XCircle,
    color: 'border-red-400',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  {
    id: StatusType.WITHDRAWN,
    label: 'Withdrawn',
    description: 'Application withdrawn by applicant',
    icon: XCircle,
    color: 'border-gray-400',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
  },
];

const getCurrentStepIndex = (status: StatusType): number => {
  return statusSteps.findIndex(step => step.id === status);
};

const getStatusIcon = (status: StatusType) => {
  switch (status) {
    case StatusType.DRAFT:
      return <FileText className="w-5 h-5" />;
    case StatusType.SUBMITTED:
      return <Upload className="w-5 h-5" />;
    case StatusType.UNDER_REVIEW:
      return <Eye className="w-5 h-5" />;
    case StatusType.PENDING_DOCUMENTS:
      return <AlertCircle className="w-5 h-5" />;
    case StatusType.APPROVED:
      return <CheckCircle className="w-5 h-5" />;
    case StatusType.REJECTED:
      return <XCircle className="w-5 h-5" />;
    case StatusType.WITHDRAWN:
      return <XCircle className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

const getStatusBadgeVariant = (status: StatusType): "default" | "secondary" | "destructive" | "success" => {
  switch (status) {
    case StatusType.DRAFT:
    case StatusType.SUBMITTED:
    case StatusType.UNDER_REVIEW:
      return "default";
    case StatusType.PENDING_DOCUMENTS:
      return "secondary";
    case StatusType.APPROVED:
      return "success";
    case StatusType.REJECTED:
    case StatusType.WITHDRAWN:
      return "destructive";
    default:
      return "default";
  }
};

export const ApplicationStatus: React.FC<ApplicationStatusProps> = ({
  application,
  applicant,
  onViewDetails,
  onRequestDocuments,
  onScheduleInterview,
  onWithdraw,
  onCancel,
  isApplicant = false,
  className = '',
}) => {
  const currentStepIndex = getCurrentStepIndex(application.status);
  const currentStep = statusSteps[currentStepIndex];

  const renderTimeline = () => {
    return (
      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-start space-x-4">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${isActive 
                  ? `${step.color} ${step.bgColor}` 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-gray-100 text-gray-400'
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${isActive ? step.textColor : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                    {step.label}
                  </h4>
                  {isActive && (
                    <Badge variant={getStatusBadgeVariant(application.status)}>
                      Current
                    </Badge>
                  )}
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className={`text-sm ${isActive ? 'text-gray-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.description}
                </p>
                
                {/* Show specific dates for completed steps */}
                {index === 0 && application.submittedAt && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                  </div>
                )}
                {index === 1 && application.reviewedAt && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}
                  </div>
                )}
                {index === 4 && application.approvedAt && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Approved: {new Date(application.approvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderApplicantActions = () => {
    const actions = [];

    if (application.status === StatusType.DRAFT) {
      actions.push(
        <Button key="view" variant="outline" onClick={onViewDetails}>
          <Eye className="w-4 h-4 mr-2" />
          View Application
        </Button>
      );
      actions.push(
        <Button key="withdraw" variant="destructive" onClick={onWithdraw}>
          Withdraw Application
        </Button>
      );
    }

    if (application.status === StatusType.PENDING_DOCUMENTS) {
      actions.push(
        <Button key="upload" onClick={onViewDetails}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Documents
        </Button>
      );
    }

    if ([StatusType.SUBMITTED, StatusType.UNDER_REVIEW, StatusType.PENDING_DOCUMENTS].includes(application.status)) {
      actions.push(
        <Button key="withdraw" variant="outline" onClick={onWithdraw}>
          Withdraw Application
        </Button>
      );
    }

    return actions;
  };

  const renderReviewerActions = () => {
    const actions = [];

    if (application.status === StatusType.SUBMITTED) {
      actions.push(
        <Button key="review" onClick={onViewDetails}>
          <Eye className="w-4 h-4 mr-2" />
          Start Review
        </Button>
      );
    }

    if ([StatusType.SUBMITTED, StatusType.UNDER_REVIEW].includes(application.status)) {
      actions.push(
        <Button key="documents" variant="outline" onClick={onRequestDocuments}>
          <AlertCircle className="w-4 h-4 mr-2" />
          Request Documents
        </Button>
      );
      actions.push(
        <Button key="interview" variant="outline" onClick={onScheduleInterview}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Interview
        </Button>
      );
    }

    if (application.status === StatusType.PENDING_DOCUMENTS) {
      actions.push(
        <Button key="continue-review" onClick={onViewDetails}>
          <Eye className="w-4 h-4 mr-2" />
          Continue Review
        </Button>
      );
    }

    if ([StatusType.SUBMITTED, StatusType.UNDER_REVIEW, StatusType.PENDING_DOCUMENTS].includes(application.status)) {
      actions.push(
        <Button key="cancel" variant="destructive" onClick={onCancel}>
          Cancel Application
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(application.status)}
              <div>
                <CardTitle className="text-lg">Application Status</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Application #{application.id.slice(0, 8)} • {application.applicationType} Membership
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusBadgeVariant(application.status)}>
                {application.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${currentStep.bgColor} border ${currentStep.color}`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${currentStep.color} ${currentStep.bgColor}`}>
                <currentStep.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${currentStep.textColor}`}>
                  {currentStep.label}
                </h3>
                <p className={`text-sm mt-1 ${currentStep.textColor} opacity-80`}>
                  {currentStep.description}
                </p>
                {application.status === StatusType.UNDER_REVIEW && (
                  <p className="text-xs text-gray-600 mt-2">
                    Expected review time: 3-5 business days
                  </p>
                )}
                {application.status === StatusType.PENDING_DOCUMENTS && (
                  <p className="text-xs text-gray-600 mt-2">
                    Please upload the requested documents to continue with your application
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isApplicant ? renderApplicantActions() : renderReviewerActions()}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
            {renderTimeline()}
          </div>
        </CardContent>
      </Card>

      {/* Application Summary */}
      {(application.submittedAt || application.reviewedAt || application.approvedAt) && (
        <Card>
          <CardHeader>
            <CardTitle>Key Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {application.submittedAt && (
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-xs text-gray-600">
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {application.reviewedAt && (
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Reviewed</p>
                    <p className="text-xs text-gray-600">
                      {new Date(application.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {application.approvedAt && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-xs text-gray-600">
                      {new Date(application.approvedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Information */}
      {application.reviewedBy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Review Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Reviewed By</p>
                <p className="text-sm text-gray-600">
                  {application.reviewedBy}
                </p>
              </div>
              {application.reviewComments && (
                <div>
                  <p className="text-sm font-medium">Review Comments</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{application.reviewComments}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Status indicator component for lists
export const ApplicationStatusIndicator: React.FC<{
  status: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, showLabel = true, size = 'md' }) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const badgeVariant = getStatusBadgeVariant(status);

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {getStatusIcon(status)}
      </div>
      {showLabel && (
        <Badge variant={badgeVariant} className={size === 'sm' ? 'text-xs' : ''}>
          {status.replace('_', ' ')}
        </Badge>
      )}
    </div>
  );
};

// Status summary component for dashboard
export const ApplicationStatusSummary: React.FC<{
  applications: MembershipApplication[];
  className?: string;
}> = ({ applications, className = '' }) => {
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<StatusType, number>);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {Object.entries(statusCounts).map(([status, count]) => (
        <Card key={status}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </p>
              </div>
              <ApplicationStatusIndicator status={status as StatusType} showLabel={false} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

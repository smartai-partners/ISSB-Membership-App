import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { 
  MembershipApplication, 
  ApplicationStatus, 
  MembershipTier, 
  ReviewDecision,
  ApplicationReview as ApplicationReviewType,
  Document 
} from '@issb/types';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Table, { TableColumn } from '../../components/ui/Table';
import {
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Languages,
  Award,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Star,
  UserCheck,
  FileCheck,
  PhoneCall,
  Calendar as CalendarIcon
} from 'lucide-react';

interface ApplicationStats {
  totalApplications: number;
  pendingReview: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  averageReviewTime: number;
}

interface ReviewFormData {
  decision: ReviewDecision;
  comments: string;
  documentsReviewed: boolean;
  credentialsVerified: boolean;
  referencesContacted: boolean;
}

const ApplicationReview: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const permissions = usePermissionStore();
  
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<MembershipApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    totalApplications: 0,
    pendingReview: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    averageReviewTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  
  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    decision: ReviewDecision.PENDING,
    comments: '',
    documentsReviewed: false,
    credentialsVerified: false,
    referencesContacted: false
  });
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockApplications: MembershipApplication[] = [
        {
          id: '1',
          applicantId: 'user-1',
          applicationType: MembershipTier.BOARD,
          status: ApplicationStatus.UNDER_REVIEW,
          personalInfo: {
            location: 'New York, NY',
            occupation: 'Senior Software Engineer',
            organization: 'Tech Corp Inc.',
            website: 'https://johnsmith.dev'
          },
          professionalInfo: {
            yearsOfExperience: 8,
            certifications: [
              {
                name: 'AWS Certified Solutions Architect',
                issuingOrganization: 'Amazon Web Services',
                issueDate: new Date('2022-03-15'),
                certificateNumber: 'AWS-SA-12345',
                verified: true,
                verifiedAt: new Date('2022-03-20')
              }
            ],
            languages: ['English', 'Spanish', 'French'],
            areasOfExpertise: ['Cloud Architecture', 'DevOps', 'Leadership'],
            currentRole: 'Senior Engineering Manager',
            reference1: {
              name: 'Jane Doe',
              email: 'jane.doe@company.com',
              phone: '+1234567890',
              organization: 'Previous Company',
              relationship: 'Direct Supervisor',
              yearsKnown: 3,
              verified: true,
              verifiedAt: new Date('2024-01-10')
            },
            reference2: {
              name: 'Bob Johnson',
              email: 'bob.johnson@company.com',
              phone: '+1234567891',
              organization: 'Current Company',
              relationship: 'Colleague',
              yearsKnown: 2,
              verified: false
            }
          },
          documents: [
            {
              id: 'doc-1',
              name: 'Resume.pdf',
              type: 'identity' as any,
              size: 1024000,
              mimeType: 'application/pdf',
              path: '/documents/resume.pdf',
              uploadedAt: new Date('2024-01-10'),
              uploadedBy: 'user-1',
              verified: true,
              verifiedAt: new Date('2024-01-11'),
              verifiedBy: 'admin-1'
            }
          ],
          submittedAt: new Date('2024-01-10'),
          reviewedAt: new Date('2024-01-12'),
          reviewedBy: 'admin-1',
          reviewComments: 'Initial review completed. Awaiting reference verification.'
        },
        {
          id: '2',
          applicantId: 'user-2',
          applicationType: MembershipTier.REGULAR,
          status: ApplicationStatus.SUBMITTED,
          personalInfo: {
            location: 'San Francisco, CA',
            occupation: 'UX Designer',
            organization: 'Design Studio LLC',
            website: 'https://sarahdesigns.com'
          },
          professionalInfo: {
            yearsOfExperience: 5,
            certifications: [],
            languages: ['English', 'Mandarin'],
            areasOfExpertise: ['User Experience', 'Design Systems', 'Prototyping'],
            currentRole: 'Senior UX Designer',
            reference1: {
              name: 'Alice Brown',
              email: 'alice@design.com',
              phone: '+1234567892',
              organization: 'Previous Company',
              relationship: 'Team Lead',
              yearsKnown: 2,
              verified: true,
              verifiedAt: new Date('2024-01-08')
            },
            reference2: {
              name: 'Charlie Wilson',
              email: 'charlie@design.com',
              phone: '+1234567893',
              organization: 'Current Company',
              relationship: 'Manager',
              yearsKnown: 1,
              verified: true,
              verifiedAt: new Date('2024-01-09')
            }
          },
          documents: [
            {
              id: 'doc-2',
              name: 'Portfolio.pdf',
              type: 'other' as any,
              size: 5242880,
              mimeType: 'application/pdf',
              path: '/documents/portfolio.pdf',
              uploadedAt: new Date('2024-01-08'),
              uploadedBy: 'user-2',
              verified: false
            }
          ],
          submittedAt: new Date('2024-01-08'),
          reviewComments: 'Application received and pending initial review.'
        },
        {
          id: '3',
          applicantId: 'user-3',
          applicationType: MembershipTier.BOARD,
          status: ApplicationStatus.PENDING_DOCUMENTS,
          personalInfo: {
            location: 'Austin, TX',
            occupation: 'Product Manager',
            organization: 'Startup Inc.'
          },
          professionalInfo: {
            yearsOfExperience: 6,
            certifications: [
              {
                name: 'Certified Scrum Master',
                issuingOrganization: 'Scrum Alliance',
                issueDate: new Date('2021-06-01'),
                certificateNumber: 'CSM-67890',
                verified: false
              }
            ],
            languages: ['English'],
            areasOfExpertise: ['Product Strategy', 'Agile Methodology', 'User Research'],
            currentRole: 'Product Manager',
            reference1: {
              name: 'Diana Prince',
              email: 'diana@startup.com',
              phone: '+1234567894',
              organization: 'Current Company',
              relationship: 'VP of Product',
              yearsKnown: 2,
              verified: false
            },
            reference2: {
              name: 'Bruce Wayne',
              email: 'bruce@startup.com',
              phone: '+1234567895',
              organization: 'Current Company',
              relationship: 'CEO',
              yearsKnown: 1,
              verified: false
            }
          },
          documents: [
            {
              id: 'doc-3',
              name: 'CV.pdf',
              type: 'identity' as any,
              size: 512000,
              mimeType: 'application/pdf',
              path: '/documents/cv.pdf',
              uploadedAt: new Date('2024-01-05'),
              uploadedBy: 'user-3',
              verified: true,
              verifiedAt: new Date('2024-01-06'),
              verifiedBy: 'admin-1'
            }
          ],
          submittedAt: new Date('2024-01-05'),
          reviewComments: 'Missing portfolio documents and work samples.'
        }
      ];
      
      setApplications(mockApplications);
      
      // Calculate stats
      const totalApplications = mockApplications.length;
      const pendingReview = mockApplications.filter(a => 
        a.status === ApplicationStatus.SUBMITTED || 
        a.status === ApplicationStatus.UNDER_REVIEW
      ).length;
      const approvedThisMonth = mockApplications.filter(a => 
        a.status === ApplicationStatus.APPROVED
      ).length;
      const rejectedThisMonth = mockApplications.filter(a => 
        a.status === ApplicationStatus.REJECTED
      ).length;
      
      // Calculate average review time (mock data)
      const averageReviewTime = 3.5; // days
      
      setStats({
        totalApplications,
        pendingReview,
        approvedThisMonth,
        rejectedThisMonth,
        averageReviewTime
      });
      
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];
    
    if (searchTerm) {
      filtered = filtered.filter(application =>
        application.applicantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.personalInfo.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.personalInfo.organization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredApplications(filtered);
  };

  const handleReviewApplication = async () => {
    if (!selectedApplication) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedApplications = applications.map(application =>
        application.id === selectedApplication.id 
          ? { 
              ...application, 
              status: reviewForm.decision === ReviewDecision.APPROVED ? ApplicationStatus.APPROVED : 
                     reviewForm.decision === ReviewDecision.REJECTED ? ApplicationStatus.REJECTED :
                     ApplicationStatus.UNDER_REVIEW,
              reviewedAt: new Date(),
              reviewedBy: currentUser?.id,
              reviewComments: reviewForm.comments
            }
          : application
      );
      
      setApplications(updatedApplications);
      setShowReviewModal(false);
      setSelectedApplication(null);
      resetReviewForm();
    } catch (error) {
      console.error('Failed to review application:', error);
    }
  };

  const handleBulkReview = async (decision: ReviewDecision) => {
    if (selectedApplications.length === 0) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let updatedApplications = [...applications];
      
      selectedApplications.forEach(appId => {
        const appIndex = updatedApplications.findIndex(a => a.id === appId);
        if (appIndex !== -1) {
          updatedApplications[appIndex] = {
            ...updatedApplications[appIndex],
            status: decision === ReviewDecision.APPROVED ? ApplicationStatus.APPROVED : 
                   decision === ReviewDecision.REJECTED ? ApplicationStatus.REJECTED : 
                   ApplicationStatus.UNDER_REVIEW,
            reviewedAt: new Date(),
            reviewedBy: currentUser?.id,
            reviewComments: `Bulk ${decision} by ${currentUser?.firstName} ${currentUser?.lastName}`
          };
        }
      });
      
      setApplications(updatedApplications);
      setSelectedApplications([]);
    } catch (error) {
      console.error('Failed to perform bulk review:', error);
    }
  };

  const resetReviewForm = () => {
    setReviewForm({
      decision: ReviewDecision.PENDING,
      comments: '',
      documentsReviewed: false,
      credentialsVerified: false,
      referencesContacted: false
    });
  };

  const openReviewModal = (application: MembershipApplication) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
  };

  const openDetailsModal = (application: MembershipApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const openDocumentsModal = (application: MembershipApplication) => {
    setSelectedApplication(application);
    setShowDocumentsModal(true);
  };

  const openEmailModal = (application: MembershipApplication) => {
    setSelectedApplication(application);
    setEmailForm({
      subject: `Regarding your ${application.applicationType} membership application`,
      message: ''
    });
    setShowEmailModal(true);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const styles = {
      [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [ApplicationStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
      [ApplicationStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800',
      [ApplicationStatus.PENDING_DOCUMENTS]: 'bg-orange-100 text-orange-800',
      [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-800',
      [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
      [ApplicationStatus.WITHDRAWN]: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      [ApplicationStatus.DRAFT]: <FileText className="w-3 h-3" />,
      [ApplicationStatus.SUBMITTED]: <Clock className="w-3 h-3" />,
      [ApplicationStatus.UNDER_REVIEW]: <Eye className="w-3 h-3" />,
      [ApplicationStatus.PENDING_DOCUMENTS]: <AlertTriangle className="w-3 h-3" />,
      [ApplicationStatus.APPROVED]: <CheckCircle className="w-3 h-3" />,
      [ApplicationStatus.REJECTED]: <XCircle className="w-3 h-3" />,
      [ApplicationStatus.WITHDRAWN]: <XCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const getTierBadge = (tier: MembershipTier) => {
    const styles = {
      [MembershipTier.REGULAR]: 'bg-blue-100 text-blue-800',
      [MembershipTier.BOARD]: 'bg-purple-100 text-purple-800',
      [MembershipTier.ADMIN]: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[tier]}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysSinceSubmission = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const applicationColumns: TableColumn<MembershipApplication>[] = [
    {
      key: 'applicant',
      title: 'Applicant',
      render: (_, application) => (
        <div>
          <div className="font-medium text-gray-900">{application.applicantId}</div>
          <div className="text-sm text-gray-500">{application.personalInfo.occupation}</div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'applicationType',
      render: getTierBadge,
      width: '100px'
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: getStatusBadge,
      width: '130px'
    },
    {
      key: 'organization',
      title: 'Organization',
      render: (_, application) => (
        <span className="text-sm text-gray-600">{application.personalInfo.organization || 'N/A'}</span>
      ),
      width: '150px'
    },
    {
      key: 'submitted',
      title: 'Submitted',
      dataIndex: 'submittedAt',
      render: (date) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDate(date)}</div>
          <div className="text-gray-500">{getDaysSinceSubmission(date)} days ago</div>
        </div>
      ),
      width: '120px'
    },
    {
      key: 'review',
      title: 'Review',
      render: (_, application) => (
        <div className="text-sm">
          {application.reviewedAt ? (
            <div>
              <div className="font-medium text-green-600">Reviewed</div>
              <div className="text-gray-500">{formatDate(application.reviewedAt)}</div>
            </div>
          ) : (
            <div className="font-medium text-orange-600">Pending</div>
          )}
        </div>
      ),
      width: '120px'
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, application) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => openDetailsModal(application)}
          />
          {permissions.canApproveApplications(currentUser!) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => openDocumentsModal(application)}
              />
              {application.status === ApplicationStatus.SUBMITTED || application.status === ApplicationStatus.UNDER_REVIEW ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => openReviewModal(application)}
                />
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                icon={<Mail className="w-4 h-4" />}
                onClick={() => openEmailModal(application)}
              />
            </>
          )}
        </div>
      )
    }
  ];

  const hasApprovePermission = permissions.canApproveApplications(currentUser!);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
          <p className="text-gray-600 mt-1">
            Review and manage membership applications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export Report
          </Button>
          {hasApprovePermission && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleBulkReview(ReviewDecision.APPROVED)}
                disabled={selectedApplications.length === 0}
              >
                Bulk Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleBulkReview(ReviewDecision.REJECTED)}
                disabled={selectedApplications.length === 0}
              >
                Bulk Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
              <p className="text-sm text-blue-600 mt-1">
                All-time submissions
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingReview}</p>
              <p className="text-sm text-orange-600 mt-1">
                Requires attention
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved This Month</p>
              <p className="text-3xl font-bold text-gray-900">{stats.approvedThisMonth}</p>
              <p className="text-sm text-green-600 mt-1">
                +{Math.floor(stats.approvedThisMonth * 0.1)} from last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Review Time</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageReviewTime}</p>
              <p className="text-sm text-purple-600 mt-1">
                Days to complete
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
              Status Filter
            </Button>
          </div>
          
          {selectedApplications.length > 0 && hasApprovePermission && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedApplications.length} selected
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={applicationColumns}
            data={filteredApplications}
            loading={loading}
            selection={{
              selectedRowKeys: selectedApplications,
              onChange: setSelectedApplications
            }}
            pagination={{
              pageSize: 25,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: true
            }}
          />
        </CardContent>
      </Card>

      {/* Review Application Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedApplication(null);
          resetReviewForm();
        }}
        title="Review Application"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Application Summary</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Applicant:</span>
                    <p className="font-medium">{selectedApplication.applicantId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Type:</span>
                    <p className="font-medium">{selectedApplication.applicationType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Occupation:</span>
                    <p className="font-medium">{selectedApplication.personalInfo.occupation}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Experience:</span>
                    <p className="font-medium">{selectedApplication.professionalInfo.yearsOfExperience} years</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Review Checklist</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reviewForm.documentsReviewed}
                    onChange={(e) => setReviewForm({...reviewForm, documentsReviewed: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Documents reviewed and verified</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reviewForm.credentialsVerified}
                    onChange={(e) => setReviewForm({...reviewForm, credentialsVerified: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Credentials and certifications verified</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reviewForm.referencesContacted}
                    onChange={(e) => setReviewForm({...reviewForm, referencesContacted: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">References contacted and verified</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Decision</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setReviewForm({...reviewForm, decision: ReviewDecision.APPROVED})}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    reviewForm.decision === ReviewDecision.APPROVED
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <ThumbsUp className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Approve</div>
                </button>
                
                <button
                  onClick={() => setReviewForm({...reviewForm, decision: ReviewDecision.REJECTED})}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    reviewForm.decision === ReviewDecision.REJECTED
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <ThumbsDown className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Reject</div>
                </button>
                
                <button
                  onClick={() => setReviewForm({...reviewForm, decision: ReviewDecision.NEEDS_MORE_INFO})}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    reviewForm.decision === ReviewDecision.NEEDS_MORE_INFO
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Need More Info</div>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Comments</label>
              <textarea
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                placeholder="Add your review comments..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedApplication(null);
                  resetReviewForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleReviewApplication}>
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Application Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedApplication(null);
        }}
        title="Application Details"
        size="xl"
      >
        {selectedApplication && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium">{selectedApplication.personalInfo.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Occupation:</span>
                    <span className="text-sm font-medium">{selectedApplication.personalInfo.occupation}</span>
                  </div>
                  {selectedApplication.personalInfo.organization && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Organization:</span>
                      <span className="text-sm font-medium">{selectedApplication.personalInfo.organization}</span>
                    </div>
                  )}
                  {selectedApplication.personalInfo.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Website:</span>
                      <span className="text-sm font-medium">{selectedApplication.personalInfo.website}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Professional Information</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Experience & Skills</h5>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Years of Experience:</span>
                      <span className="ml-2 font-medium">{selectedApplication.professionalInfo.yearsOfExperience}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Current Role:</span>
                      <span className="ml-2 font-medium">{selectedApplication.professionalInfo.currentRole}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Areas of Expertise:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedApplication.professionalInfo.areasOfExpertise.map((area, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Languages</h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplication.professionalInfo.languages.map((language, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {language}
                      </span>
                    ))}
                  </div>
                  
                  {selectedApplication.professionalInfo.certifications.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Certifications</h5>
                      {selectedApplication.professionalInfo.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-1">
                          <Award className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm text-gray-600">{cert.name}</span>
                          {cert.verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* References */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">References</h4>
              <div className="grid grid-cols-2 gap-4">
                {[selectedApplication.professionalInfo.reference1, selectedApplication.professionalInfo.reference2].map((ref, index) => (
                  ref && (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{ref.name}</h5>
                        {ref.verified && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>{ref.organization}</div>
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{ref.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <PhoneCall className="w-3 h-3" />
                          <span>{ref.phone}</span>
                        </div>
                        <div className="text-xs">
                          {ref.relationship} • {ref.yearsKnown} years known
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              {hasApprovePermission && (
                <>
                  <Button
                    variant="outline"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={() => {
                      setShowDetailsModal(false);
                      openDocumentsModal(selectedApplication);
                    }}
                  >
                    View Documents
                  </Button>
                  {selectedApplication.status === ApplicationStatus.SUBMITTED || selectedApplication.status === ApplicationStatus.UNDER_REVIEW ? (
                    <Button
                      icon={<MessageSquare className="w-4 h-4" />}
                      onClick={() => {
                        setShowDetailsModal(false);
                        openReviewModal(selectedApplication);
                      }}
                    >
                      Review Application
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedApplication(null);
        }}
        title="Send Email to Applicant"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                placeholder="Enter email subject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                placeholder="Enter your message..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedApplication(null);
                }}
              >
                Cancel
              </Button>
              <Button
                icon={<Mail className="w-4 h-4" />}
                onClick={() => {
                  // Handle email sending here
                  console.log('Sending email:', emailForm, selectedApplication);
                  setShowEmailModal(false);
                  setSelectedApplication(null);
                }}
              >
                Send Email
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicationReview;
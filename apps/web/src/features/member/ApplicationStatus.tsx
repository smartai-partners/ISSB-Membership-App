import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ApplicationStatus as ApplicationStatusType, ApplicationType } from './types';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
  Send,
  RotateCcw
} from 'lucide-react';

const ApplicationStatus: React.FC = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<ApplicationStatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ApplicationType>('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatusType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, typeFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockApplications: ApplicationStatusType[] = [
        {
          id: 'app-001',
          type: 'membership',
          title: 'Gold Membership Upgrade',
          description: 'Upgrade from Silver to Gold membership tier for additional benefits and perks.',
          status: 'under-review',
          submittedAt: '2024-02-15T10:30:00Z',
          lastUpdatedAt: '2024-02-20T14:15:00Z',
          expectedReviewDate: '2024-03-01T00:00:00Z',
          reviewedBy: 'Sarah Johnson',
          notes: 'Application reviewed. Waiting for additional documentation from applicant.',
          documents: [
            {
              id: 'doc-001',
              name: 'Current Membership Certificate',
              type: 'pdf',
              url: '/documents/membership-certificate.pdf',
              uploadedAt: '2024-02-15T10:35:00Z',
              status: 'approved'
            },
            {
              id: 'doc-002',
              name: 'Payment Authorization Form',
              type: 'pdf',
              url: '/documents/payment-auth.pdf',
              uploadedAt: '2024-02-16T09:20:00Z',
              status: 'pending'
            }
          ],
          milestones: [
            {
              id: 'milestone-001',
              title: 'Application Submitted',
              description: 'Your application has been successfully submitted',
              completedAt: '2024-02-15T10:30:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-002',
              title: 'Initial Review',
              description: 'Administrative review of submitted documents',
              completedAt: '2024-02-18T16:45:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-003',
              title: 'Document Verification',
              description: 'Verification of required documents and information',
              status: 'in-progress'
            },
            {
              id: 'milestone-004',
              title: 'Final Approval',
              description: 'Final review and approval decision',
              status: 'pending'
            }
          ],
          nextAction: {
            title: 'Complete Payment Authorization',
            description: 'Please complete and submit the payment authorization form',
            dueDate: '2024-02-25T23:59:59Z'
          }
        },
        {
          id: 'app-002',
          type: 'volunteer',
          title: 'Community Garden Volunteer Application',
          description: 'Application to volunteer as a Community Garden Coordinator.',
          status: 'approved',
          submittedAt: '2024-01-20T14:20:00Z',
          lastUpdatedAt: '2024-02-01T11:30:00Z',
          reviewedBy: 'Michael Chen',
          notes: 'Congratulations! Your application has been approved. Welcome to the team!',
          documents: [
            {
              id: 'doc-003',
              name: 'Volunteer Agreement',
              type: 'pdf',
              url: '/documents/volunteer-agreement.pdf',
              uploadedAt: '2024-01-20T14:25:00Z',
              status: 'approved'
            }
          ],
          milestones: [
            {
              id: 'milestone-005',
              title: 'Application Submitted',
              description: 'Your application has been successfully submitted',
              completedAt: '2024-01-20T14:20:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-006',
              title: 'Application Reviewed',
              description: 'Your application has been thoroughly reviewed',
              completedAt: '2024-01-28T09:15:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-007',
              title: 'Interview Scheduled',
              description: 'Phone interview scheduled with program coordinator',
              completedAt: '2024-01-30T15:00:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-008',
              title: 'Application Approved',
              description: 'Your volunteer application has been approved',
              completedAt: '2024-02-01T11:30:00Z',
              status: 'completed'
            }
          ]
        },
        {
          id: 'app-003',
          type: 'event',
          title: 'Workshop Presenter Application',
          description: 'Application to present a workshop on digital marketing for small businesses.',
          status: 'rejected',
          submittedAt: '2024-01-10T16:45:00Z',
          lastUpdatedAt: '2024-01-25T13:20:00Z',
          reviewedBy: 'Lisa Rodriguez',
          notes: 'Thank you for your interest. While we cannot accept this application at this time, we encourage you to apply for future opportunities.',
          documents: [
            {
              id: 'doc-004',
              name: 'Workshop Proposal',
              type: 'pdf',
              url: '/documents/workshop-proposal.pdf',
              uploadedAt: '2024-01-10T16:50:00Z',
              status: 'approved'
            }
          ],
          milestones: [
            {
              id: 'milestone-009',
              title: 'Application Submitted',
              description: 'Your application has been successfully submitted',
              completedAt: '2024-01-10T16:45:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-010',
              title: 'Application Reviewed',
              description: 'Your application has been thoroughly reviewed',
              completedAt: '2024-01-22T10:30:00Z',
              status: 'completed'
            },
            {
              id: 'milestone-011',
              title: 'Decision Made',
              description: 'Final decision has been made regarding your application',
              completedAt: '2024-01-25T13:20:00Z',
              status: 'completed'
            }
          ]
        },
        {
          id: 'app-004',
          type: 'board',
          title: 'Board Member Nomination',
          description: 'Nomination for position on the Board of Directors.',
          status: 'draft',
          submittedAt: '',
          lastUpdatedAt: '2024-02-22T09:15:00Z',
          documents: [
            {
              id: 'doc-005',
              name: 'Nomination Form',
              type: 'pdf',
              url: '/documents/nomination-form.pdf',
              uploadedAt: '2024-02-22T09:20:00Z',
              status: 'pending'
            }
          ],
          milestones: [
            {
              id: 'milestone-012',
              title: 'Initial Nomination',
              description: 'Nomination form has been started but not completed',
              status: 'in-progress'
            },
            {
              id: 'milestone-013',
              title: 'Supporting Documents',
              description: 'Upload required supporting documents',
              status: 'pending'
            },
            {
              id: 'milestone-014',
              title: 'Submit Application',
              description: 'Final submission of complete application',
              status: 'pending'
            }
          ],
          nextAction: {
            title: 'Complete Nomination Form',
            description: 'Please complete the nomination form with required information',
            dueDate: '2024-03-15T23:59:59Z'
          }
        }
      ];

      // Filter applications
      let filteredApplications = mockApplications;
      
      if (statusFilter !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === statusFilter);
      }

      if (typeFilter !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.type === typeFilter);
      }

      if (searchTerm) {
        filteredApplications = filteredApplications.filter(app =>
          app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setApplications(filteredApplications);
    } catch (error) {
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: ApplicationStatusType) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleWithdraw = async (applicationId: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'withdrawn' as any }
          : app
      ));
      
      setShowWithdrawModal(false);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleResubmit = async (applicationId: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'submitted' as any, submittedAt: new Date().toISOString() }
          : app
      ));
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      submitted: 'bg-blue-100 text-blue-700 border-blue-200',
      'under-review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      withdrawn: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText size={16} className="text-gray-600" />;
      case 'submitted':
        return <Send size={16} className="text-blue-600" />;
      case 'under-review':
        return <Clock size={16} className="text-yellow-600" />;
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      case 'withdrawn':
        return <XCircle size={16} className="text-purple-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      membership: <User size={16} />,
      volunteer: <FileText size={16} />,
      event: <Calendar size={16} />,
      scholarship: <FileText size={16} />,
      board: <User size={16} />,
      other: <FileText size={16} />
    };
    return icons[type as keyof typeof icons] || <FileText size={16} />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not submitted';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysSinceUpdate = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Status</h1>
            <p className="text-gray-600 mt-1">Track and manage your applications</p>
          </div>
          <button
            onClick={fetchApplications}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Types</option>
              <option value="membership">Membership</option>
              <option value="volunteer">Volunteer</option>
              <option value="event">Event</option>
              <option value="scholarship">Scholarship</option>
              <option value="board">Board</option>
              <option value="other">Other</option>
            </select>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No applications match your current filter.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} variant="elevated" className="overflow-hidden">
                {/* Application Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        {getTypeIcon(application.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {application.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {application.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{application.type}</span>
                          <span>•</span>
                          <span>Updated {getDaysSinceUpdate(application.lastUpdatedAt)}</span>
                          {application.submittedAt && (
                            <>
                              <span>•</span>
                              <span>Submitted {formatDate(application.submittedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(application)}
                        icon={<Eye size={14} />}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Next Action */}
                  {application.nextAction && application.status !== 'approved' && application.status !== 'rejected' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {application.nextAction.title}
                          </p>
                          <p className="text-sm text-blue-700">
                            {application.nextAction.description}
                          </p>
                          {application.nextAction.dueDate && (
                            <p className="text-xs text-blue-600 mt-1">
                              Due: {new Date(application.nextAction.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {application.documents && application.documents.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {application.documents.filter(doc => doc.status === 'approved').length} of {application.documents.length} documents approved
                        </span>
                      )}
                      {application.milestones && (
                        <span className="text-sm text-gray-600">
                          {application.milestones.filter(m => m.status === 'completed').length} of {application.milestones.length} milestones completed
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {application.status === 'draft' && (
                        <Button size="sm" variant="primary">
                          Complete Application
                        </Button>
                      )}
                      
                      {(application.status === 'submitted' || application.status === 'under-review') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowWithdrawModal(true)}
                        >
                          Withdraw
                        </Button>
                      )}
                      
                      {application.status === 'rejected' && (
                        <Button size="sm" variant="outline" icon={<RotateCcw size={14} />}>
                          Resubmit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedApplication && (
          <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="xl">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Application Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedApplication.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedApplication.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedApplication.status)} ml-2`}>
                      {getStatusIcon(selectedApplication.status)}
                      {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1).replace('-', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 capitalize">{selectedApplication.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <span className="ml-2">{formatDate(selectedApplication.submittedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="ml-2">{formatDate(selectedApplication.lastUpdatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {selectedApplication.milestones && selectedApplication.milestones.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress Milestones</h4>
                  <div className="space-y-3">
                    {selectedApplication.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className={`mt-1 ${milestone.status === 'completed' ? 'text-green-600' : milestone.status === 'in-progress' ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {milestone.status === 'completed' ? <CheckCircle size={16} /> : 
                           milestone.status === 'in-progress' ? <Clock size={16} /> : 
                           <AlertCircle size={16} />}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                          {milestone.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed: {formatDate(milestone.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
                  <div className="space-y-2">
                    {selectedApplication.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </div>
                          <Button size="sm" variant="outline" icon={<Download size={14} />}>
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedApplication.notes && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Review Notes</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{selectedApplication.notes}</p>
                    {selectedApplication.reviewedBy && (
                      <p className="text-xs text-blue-600 mt-2">
                        Reviewed by: {selectedApplication.reviewedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Withdraw Confirmation Modal */}
        {showWithdrawModal && selectedApplication && (
          <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} size="md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Withdraw Application</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to withdraw your application for "{selectedApplication.title}"? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleWithdraw(selectedApplication.id)}
                  fullWidth
                >
                  Withdraw Application
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={false}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatus;
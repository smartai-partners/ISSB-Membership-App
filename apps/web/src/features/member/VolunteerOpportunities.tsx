import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { VolunteerOpportunity, VolunteerApplicationData } from './types';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  User,
  Calendar,
  Briefcase,
  Target,
  Zap,
  Star,
  X
} from 'lucide-react';

const VolunteerOpportunities: React.FC = () => {
  const { user } = useAuthStore();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState<VolunteerApplicationData>({
    opportunityId: '',
    availability: [],
    experience: '',
    motivation: '',
    references: []
  });
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOpportunities();
  }, [urgencyFilter, searchTerm]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOpportunities: VolunteerOpportunity[] = [
        {
          id: 'vol-001',
          title: 'Community Garden Coordinator',
          description: 'Help organize and maintain our community garden space, coordinating volunteers and scheduling work days.',
          organization: 'Green City Initiative',
          location: 'Downtown Community Garden',
          commitment: '4-6 hours/week',
          skills: ['Organization', 'Gardening', 'Leadership', 'Communication'],
          impact: 'Provide fresh produce to 50+ families and educate community members about sustainable agriculture.',
          urgency: 'medium',
          startDate: '2024-04-01',
          endDate: '2024-10-31',
          spotsAvailable: 2,
          totalSpots: 4,
          tags: ['environment', 'agriculture', 'education', 'community'],
          contactPerson: {
            name: 'Sarah Johnson',
            email: 'sarah@greencity.org',
            phone: '(555) 123-4567'
          }
        },
        {
          id: 'vol-002',
          title: 'Youth Mentorship Program Assistant',
          description: 'Support our youth mentorship program by helping young people develop life skills and academic success.',
          organization: 'Future Leaders Foundation',
          location: 'Various Schools & Community Centers',
          commitment: '2-3 hours/week',
          skills: ['Patience', 'Communication', 'Role Modeling', 'Problem-solving'],
          impact: 'Directly impact 20+ young lives and help them build confidence and achieve their goals.',
          urgency: 'high',
          startDate: '2024-03-15',
          endDate: '2024-12-15',
          spotsAvailable: 5,
          totalSpots: 8,
          tags: ['youth', 'education', 'mentoring', 'leadership'],
          contactPerson: {
            name: 'Michael Chen',
            email: 'michael@futureleaders.org',
            phone: '(555) 234-5678'
          }
        },
        {
          id: 'vol-003',
          title: 'Food Bank Distribution Volunteer',
          description: 'Help distribute food packages to families in need every Saturday morning.',
          organization: 'Community Food Network',
          location: 'Community Center',
          commitment: '3-4 hours/week',
          skills: ['Physical activity', 'Customer service', 'Organization'],
          impact: 'Distribute food to 200+ families weekly and help combat food insecurity.',
          urgency: 'critical',
          startDate: '2024-03-01',
          endDate: '2024-12-31',
          spotsAvailable: 8,
          totalSpots: 15,
          tags: ['food security', 'community service', 'distribution'],
          contactPerson: {
            name: 'Lisa Rodriguez',
            email: 'lisa@communityfoodnet.org'
          }
        },
        {
          id: 'vol-004',
          title: 'Technology Workshop Instructor',
          description: 'Teach basic computer skills and digital literacy to seniors and adults seeking employment.',
          organization: 'Digital Inclusion Alliance',
          location: 'Public Library - Tech Center',
          commitment: '2-4 hours/week',
          skills: ['Technology', 'Teaching', 'Patience', 'Communication'],
          impact: 'Bridge the digital divide for 30+ community members and improve their employability.',
          urgency: 'medium',
          startDate: '2024-04-15',
          endDate: '2024-09-15',
          spotsAvailable: 3,
          totalSpots: 5,
          tags: ['technology', 'education', 'employment', 'seniors'],
          contactPerson: {
            name: 'David Kim',
            email: 'david@digitalinclusion.org',
            phone: '(555) 345-6789'
          }
        },
        {
          id: 'vol-005',
          title: 'Environmental Cleanup Crew',
          description: 'Join our monthly cleanup efforts to restore natural areas and protect wildlife habitats.',
          organization: 'Eco Guardians',
          location: 'Various Parks & Nature Reserves',
          commitment: '4-6 hours/month',
          skills: ['Physical activity', 'Environmental awareness', 'Teamwork'],
          impact: 'Remove 500+ lbs of litter monthly and restore 5 acres of natural habitat.',
          urgency: 'low',
          startDate: '2024-04-20',
          endDate: '2024-11-20',
          spotsAvailable: 12,
          totalSpots: 20,
          tags: ['environment', 'outdoor', 'cleanup', 'wildlife'],
          contactPerson: {
            name: 'Emma Thompson',
            email: 'emma@ecoguardians.org'
          }
        }
      ];

      // Filter opportunities
      let filteredOpportunities = mockOpportunities;
      
      if (urgencyFilter !== 'all') {
        filteredOpportunities = filteredOpportunities.filter(
          opp => opp.urgency === urgencyFilter
        );
      }

      if (searchTerm) {
        filteredOpportunities = filteredOpportunities.filter(opp =>
          opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opp.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
          opp.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setOpportunities(filteredOpportunities);
    } catch (error) {
      setError('Failed to load volunteer opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (opportunity: VolunteerOpportunity) => {
    setSelectedOpportunity(opportunity);
    setApplicationData({
      opportunityId: opportunity.id,
      availability: [],
      experience: '',
      motivation: '',
      references: []
    });
    setShowApplicationModal(true);
  };

  const submitApplication = async (): Promise<boolean> => {
    try {
      setApplicationLoading(true);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAppliedOpportunities(prev => new Set([...prev, selectedOpportunity!.id]));
      setShowApplicationModal(false);
      setSelectedOpportunity(null);
      
      return true;
    } catch (error) {
      return false;
    } finally {
      setApplicationLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      critical: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return <Clock size={14} className="text-green-600" />;
      case 'medium':
        return <TrendingUp size={14} className="text-yellow-600" />;
      case 'high':
        return <AlertCircle size={14} className="text-orange-600" />;
      case 'critical':
        return <Zap size={14} className="text-red-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const handleAvailabilityChange = (timeSlot: string, checked: boolean) => {
    setApplicationData(prev => ({
      ...prev,
      availability: checked 
        ? [...prev.availability, timeSlot]
        : prev.availability.filter(slot => slot !== timeSlot)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading volunteer opportunities...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Opportunities</h1>
            <p className="text-gray-600 mt-1">Make a difference in your community</p>
          </div>
          <button
            onClick={fetchOpportunities}
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
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Urgency Levels</option>
              <option value="critical">Critical Need</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
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

        {/* Opportunities Grid */}
        {opportunities.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Opportunities Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No volunteer opportunities match your current filter.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} variant="elevated" hover interactive className="overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {opportunity.title}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {opportunity.organization}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(opportunity.urgency)}`}>
                      {getUrgencyIcon(opportunity.urgency)}
                      {opportunity.urgency.charAt(0).toUpperCase() + opportunity.urgency.slice(1)}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-3">
                    {opportunity.description}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span className="truncate">{opportunity.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>{opportunity.commitment}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>Starts {new Date(opportunity.startDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>{opportunity.spotsAvailable} of {opportunity.totalSpots} spots available</span>
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Impact</span>
                    </div>
                    <p className="text-sm text-blue-800">{opportunity.impact}</p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          <Star size={10} className="mr-1" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.tags.slice(0, 4).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {appliedOpportunities.has(opportunity.id) ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Application Submitted</span>
                        </div>
                      ) : opportunity.spotsAvailable === 0 ? (
                        <span className="text-sm text-red-600 font-medium">Full</span>
                      ) : (
                        <span className="text-sm text-blue-600 font-medium">
                          {opportunity.spotsAvailable} spot{opportunity.spotsAvailable !== 1 ? 's' : ''} available
                        </span>
                      )}
                    </div>

                    {appliedOpportunities.has(opportunity.id) ? (
                      <Button size="sm" variant="outline" disabled>
                        Applied
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleApply(opportunity)}
                        disabled={opportunity.spotsAvailable === 0}
                        icon={<Heart size={14} />}
                      >
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Application Modal */}
        {showApplicationModal && selectedOpportunity && (
          <Modal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} size="lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Apply for Position</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Opportunity Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-1">{selectedOpportunity.title}</h3>
                <p className="text-sm text-blue-700">{selectedOpportunity.organization}</p>
              </div>

              {/* Application Form */}
              <div className="space-y-6">
                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Availability (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekend mornings', 'Weekend afternoons', 'Weekend evenings'].map((timeSlot) => (
                      <label key={timeSlot} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applicationData.availability.includes(timeSlot)}
                          onChange={(e) => handleAvailabilityChange(timeSlot, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{timeSlot}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relevant Experience
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    rows={4}
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Describe any relevant experience, skills, or background..."
                  />
                </div>

                {/* Motivation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why are you interested in this opportunity?
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    rows={4}
                    value={applicationData.motivation}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, motivation: e.target.value }))}
                    placeholder="Tell us about your motivation to volunteer..."
                  />
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>Volunteer: {user?.firstName} {user?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} />
                      <span>Organization Contact: {selectedOpportunity.contactPerson.name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={submitApplication}
                    loading={applicationLoading}
                    fullWidth
                  >
                    Submit Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowApplicationModal(false)}
                    disabled={applicationLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default VolunteerOpportunities;
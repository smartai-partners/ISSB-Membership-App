import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { MemberProfile as MemberProfileType, ProfileUpdateData, FormState } from './types';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

const MemberProfile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<MemberProfileType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    bio: ''
  });
  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    hasError: false
  });

  // Fetch member profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setFormState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call - replace with actual API endpoint
      const mockProfile: MemberProfileType = {
        id: user!.id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Anytown, ST 12345',
        bio: 'Passionate community member dedicated to making a positive impact.',
        avatarUrl: '',
        joinDate: '2023-01-15',
        membershipTier: 'gold',
        status: 'active'
      };

      setProfile(mockProfile);
      setFormData({
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        phone: mockProfile.phone || '',
        address: mockProfile.address || '',
        bio: mockProfile.bio || ''
      });
    } catch (error) {
      setFormState({
        isLoading: false,
        isSuccess: false,
        error: 'Failed to load profile. Please try again.',
        hasError: true
      });
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormState(prev => ({ ...prev, error: null, isSuccess: false }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      bio: profile?.bio || ''
    });
    setFormState(prev => ({ ...prev, error: null, isSuccess: false }));
  };

  const handleSave = async (): Promise<boolean> => {
    try {
      setFormState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedProfile: MemberProfileType = {
        ...profile!,
        ...formData
      };
      
      setProfile(updatedProfile);
      setFormState({
        isLoading: false,
        isSuccess: true,
        successMessage: 'Profile updated successfully!',
        hasError: false
      });
      
      // Update auth store
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      setIsEditing(false);
      return true;
    } catch (error) {
      setFormState({
        isLoading: false,
        isSuccess: false,
        error: 'Failed to update profile. Please try again.',
        hasError: true
      });
      return false;
    }
  };

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'text-amber-700 bg-amber-100',
      silver: 'text-gray-700 bg-gray-100',
      gold: 'text-yellow-700 bg-yellow-100',
      platinum: 'text-purple-700 bg-purple-100'
    };
    return colors[tier as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-700 bg-green-100',
      inactive: 'text-gray-700 bg-gray-100',
      suspended: 'text-red-700 bg-red-100',
      pending: 'text-yellow-700 bg-yellow-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="outline"
              icon={<Edit3 size={16} />}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Success/Error Messages */}
        {formState.hasError && formState.error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{formState.error}</span>
            </div>
          </Card>
        )}

        {formState.isSuccess && formState.successMessage && (
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span>{formState.successMessage}</span>
            </div>
          </Card>
        )}

        {/* Profile Card */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User size={40} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="flex items-center gap-4 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(profile.membershipTier)}`}>
                    {profile.membershipTier.charAt(0).toUpperCase() + profile.membershipTier.slice(1)} Member
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.status)}`}>
                    {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <Calendar size={16} />
                  <span>Member since {new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    disabled={formState.isLoading}
                  />
                  
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    disabled={formState.isLoading}
                  />
                  
                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={formState.isLoading}
                  />
                  
                  <Input
                    label="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={formState.isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={formState.isLoading}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    loading={formState.isLoading}
                    icon={<Save size={16} />}
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={formState.isLoading}
                    icon={<X size={16} />}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Mail size={20} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone size={20} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{profile.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin size={20} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">{profile.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">About Me</h4>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberProfile;
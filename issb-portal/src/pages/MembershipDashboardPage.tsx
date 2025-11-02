import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  useGetSubscriptionStatusQuery,
  useManageSubscriptionMutation,
  useAddFamilyMemberMutation,
  useRemoveFamilyMemberMutation,
  FamilyMember
} from '@/store/api/membershipApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Users, 
  Calendar, 
  Loader2, 
  UserPlus, 
  Trash2,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MembershipDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  
  const { data: subscriptionStatus, isLoading, refetch } = useGetSubscriptionStatusQuery();
  const [manageSubscription, { isLoading: managing }] = useManageSubscriptionMutation();
  const [addFamilyMember, { isLoading: adding }] = useAddFamilyMemberMutation();
  const [removeFamilyMember, { isLoading: removing }] = useRemoveFamilyMemberMutation();

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    first_name: '',
    last_name: '',
    relationship: '',
    email: '',
    phone: '',
    date_of_birth: ''
  });

  const subscription = subscriptionStatus?.subscription;
  const familyMembers = subscriptionStatus?.familyMembers || [];
  const history = subscriptionStatus?.history || [];

  const getTierName = (priceId: string) => {
    if (priceId === 'student_free') return 'Student';
    if (priceId.includes('individual')) return 'Individual';
    if (priceId.includes('family')) return 'Family';
    return priceId;
  };

  const getTierPrice = (priceId: string) => {
    if (priceId === 'student_free') return '$0';
    if (priceId.includes('individual')) return '$50';
    if (priceId.includes('family')) return '$150';
    return 'N/A';
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      await manageSubscription({ action: 'cancel' }).unwrap();
      alert('Subscription will be cancelled at the end of the billing period');
      refetch();
    } catch (error: any) {
      alert(error.data || 'Failed to cancel subscription');
    }
  };

  const handleChangeTier = async (newTier: string) => {
    if (!confirm(`Are you sure you want to change your subscription to ${newTier}? You will be charged or credited prorated amount.`)) {
      return;
    }

    try {
      await manageSubscription({ action: 'change_tier', newTier }).unwrap();
      alert('Subscription tier updated successfully');
      refetch();
    } catch (error: any) {
      alert(error.data || 'Failed to change subscription tier');
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addFamilyMember(newMember).unwrap();
      setShowAddMember(false);
      setNewMember({
        first_name: '',
        last_name: '',
        relationship: '',
        email: '',
        phone: '',
        date_of_birth: ''
      });
      refetch();
    } catch (error: any) {
      alert(error.data || 'Failed to add family member');
    }
  };

  const handleRemoveFamilyMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) {
      return;
    }

    try {
      await removeFamilyMember(memberId).unwrap();
      refetch();
    } catch (error: any) {
      alert(error.data || 'Failed to remove family member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">No Active Membership</h1>
          <p className="text-gray-600 mb-6">
            You don't have an active membership. Choose a plan to get started.
          </p>
          <Button onClick={() => navigate('/membership')}>
            View Membership Plans
          </Button>
        </div>
      </div>
    );
  }

  const isFamilyTier = subscription.price_id.includes('family');
  const isStudentTier = subscription.price_id === 'student_free';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Success Alert */}
        {success === 'true' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your membership has been activated successfully! Welcome to ISSB.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Membership Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your subscription and family members
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subscription Info */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Current Subscription</h2>
              <Badge className={
                subscription.status === 'active' ? 'bg-green-600' :
                subscription.status === 'cancelled' ? 'bg-red-600' :
                'bg-gray-600'
              }>
                {subscription.status}
              </Badge>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Membership Tier</p>
                  <p className="font-semibold">{getTierName(subscription.price_id)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Monthly Price</p>
                  <p className="font-semibold">{getTierPrice(subscription.price_id)}/month</p>
                </div>
              </div>

              {isFamilyTier && (
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Family Members</p>
                    <p className="font-semibold">{familyMembers.length} / 6</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-6 space-y-3">
              <h3 className="font-semibold mb-3">Manage Subscription</h3>
              
              {!isStudentTier && (
                <>
                  {!subscription.price_id.includes('family') && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleChangeTier('family')}
                      disabled={managing}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Upgrade to Family ($150/month)
                    </Button>
                  )}
                  
                  {!subscription.price_id.includes('individual') && !isStudentTier && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleChangeTier('individual')}
                      disabled={managing}
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-2" />
                      Downgrade to Individual ($50/month)
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleCancelSubscription}
                    disabled={managing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Membership Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>Full portal access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>Priority event registration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>Volunteer opportunities</span>
                </li>
                {isFamilyTier && (
                  <>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                      <span>Family events access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                      <span>Up to 6 family members</span>
                    </li>
                  </>
                )}
              </ul>
            </Card>
          </div>
        </div>

        {/* Family Members Section (Only for Family Tier) */}
        {isFamilyTier && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Family Members</h2>
              <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                <DialogTrigger asChild>
                  <Button disabled={familyMembers.length >= 6}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddFamilyMember} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={newMember.first_name}
                          onChange={(e) => setNewMember({ ...newMember, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={newMember.last_name}
                          onChange={(e) => setNewMember({ ...newMember, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship</Label>
                      <Input
                        id="relationship"
                        value={newMember.relationship}
                        onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                        placeholder="e.g., Spouse, Child, Parent"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={newMember.date_of_birth}
                        onChange={(e) => setNewMember({ ...newMember, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddMember(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={adding}>
                        {adding ? 'Adding...' : 'Add Member'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {familyMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No family members added yet. Click "Add Member" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        {member.first_name} {member.last_name}
                        {member.is_primary && (
                          <Badge className="ml-2 bg-blue-600">Primary</Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                      {member.email && (
                        <p className="text-sm text-gray-500">{member.email}</p>
                      )}
                    </div>
                    {!member.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFamilyMember(member.id)}
                        disabled={removing}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Subscription History */}
        {history.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium capitalize">{item.action.replace('_', ' ')}</p>
                    {item.from_tier && item.to_tier && (
                      <p className="text-sm text-gray-600">
                        From {getTierName(item.from_tier)} to {getTierName(item.to_tier)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.amount !== null && item.amount !== undefined && (
                      <p className="font-semibold">${item.amount}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

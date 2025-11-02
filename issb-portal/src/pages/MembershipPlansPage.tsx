import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useCreateSubscriptionMutation, 
  useCreateStudentSubscriptionMutation,
  useGetSubscriptionStatusQuery 
} from '@/store/api/membershipApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Users, User, GraduationCap, Loader2 } from 'lucide-react';

const membershipTiers = [
  {
    id: 'student',
    name: 'Student',
    price: 0,
    priceDisplay: 'Free',
    icon: GraduationCap,
    features: [
      'Access to basic ISSB Portal features',
      'Newsletter subscription',
      'Basic event access',
      'Community forum access'
    ],
    color: 'bg-blue-50 border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    id: 'individual',
    name: 'Individual Membership',
    price: 50,
    priceDisplay: '$50',
    icon: User,
    features: [
      'Full ISSB Portal access',
      'Priority event registration',
      'Volunteer opportunity alerts',
      'Basic analytics dashboard',
      'Monthly newsletter',
      'Exclusive member events'
    ],
    color: 'bg-emerald-50 border-emerald-200',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    popular: true
  },
  {
    id: 'family',
    name: 'Family Membership',
    price: 150,
    priceDisplay: '$150',
    icon: Users,
    features: [
      'Everything in Individual tier',
      'Up to 6 family members included',
      'Family-focused events and activities',
      'Advanced analytics and reporting',
      'Family volunteer coordination tools',
      'Premium support'
    ],
    color: 'bg-purple-50 border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700'
  }
];

export const MembershipPlansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  const { data: subscriptionStatus, isLoading: statusLoading } = useGetSubscriptionStatusQuery();
  const [createSubscription, { isLoading: creating }] = useCreateSubscriptionMutation();
  const [createStudentSubscription, { isLoading: creatingStudent }] = useCreateStudentSubscriptionMutation();

  const handleSelectTier = async (tierId: string) => {
    if (!user) {
      navigate('/login?redirect=/membership');
      return;
    }

    setSelectedTier(tierId);

    try {
      if (tierId === 'student') {
        await createStudentSubscription().unwrap();
        navigate('/membership/dashboard?success=true');
      } else {
        const result = await createSubscription({
          planType: tierId,
          customerEmail: user.email!
        }).unwrap();
        
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.data || 'Failed to create subscription. Please try again.');
      setSelectedTier(null);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user already has active subscription, redirect to dashboard
  if (subscriptionStatus?.subscription?.status === 'active') {
    navigate('/membership/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Membership
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join ISSB and become part of a vibrant community dedicated to making a difference
          </p>
        </div>

        {/* Membership Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {membershipTiers.map((tier) => {
            const Icon = tier.icon;
            const isLoading = selectedTier === tier.id && (creating || creatingStudent);

            return (
              <Card
                key={tier.id}
                className={`relative p-6 ${tier.color} border-2 transition-all hover:shadow-lg`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-gray-700" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.priceDisplay}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectTier(tier.id)}
                  disabled={isLoading}
                  className={`w-full ${tier.buttonColor} text-white`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>Select {tier.name}</>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center text-gray-600">
          <p className="mb-2">
            All memberships include access to our exclusive member portal and community resources
          </p>
          <p className="text-sm">
            Questions? Contact us at membership@issb.org
          </p>
        </div>
      </div>
    </div>
  );
};

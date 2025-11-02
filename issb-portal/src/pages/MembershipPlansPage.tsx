import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useCreateSubscriptionMutation,
  useCreateVolunteerSubscriptionMutation,
  useGetSubscriptionStatusQuery 
} from '@/store/api/membershipApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, CreditCard, Users, Loader2, DollarSign, Clock } from 'lucide-react';

export const MembershipPlansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const { data: subscriptionStatus, isLoading: statusLoading } = useGetSubscriptionStatusQuery();
  const [createSubscription, { isLoading: creating }] = useCreateSubscriptionMutation();
  const [createVolunteerSubscription, { isLoading: creatingVolunteer }] = useCreateVolunteerSubscriptionMutation();

  const membershipFeatures = [
    'Full ISSB Portal access',
    'Priority event registration',
    'Volunteer opportunity alerts',
    'Member analytics dashboard',
    'Monthly newsletter',
    'Exclusive member events',
    'Community forum access',
    'Member directory listing'
  ];

  const handleSelectPayment = async () => {
    if (!user) {
      navigate('/login?redirect=/membership');
      return;
    }

    setSelectedOption('payment');

    try {
      const result = await createSubscription({
        planType: 'individual_annual',
        customerEmail: user.email!
      }).unwrap();
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.error || 'Failed to create subscription. Please try again.');
      setSelectedOption(null);
    }
  };

  const handleSelectVolunteer = async () => {
    if (!user) {
      navigate('/login?redirect=/membership');
      return;
    }

    setSelectedOption('volunteer');

    try {
      await createVolunteerSubscription().unwrap();
      navigate('/membership/dashboard?success=volunteer');
    } catch (error: any) {
      console.error('Volunteer subscription error:', error);
      alert(error.error || 'Failed to create volunteer commitment. Please try again.');
      setSelectedOption(null);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user already has active or pending subscription, redirect to dashboard
  if (subscriptionStatus?.subscription) {
    navigate('/membership/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join ISSB Membership
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            Become part of a vibrant community dedicated to making a difference
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <span className="text-2xl font-bold">$360/year</span>
            <span className="mx-2">or</span>
            <span className="text-2xl font-bold">30 volunteer hours</span>
          </div>
        </div>

        {/* Membership Benefits */}
        <Card className="mb-12 p-8 bg-white shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Annual Membership Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {membershipFeatures.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-lg text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Options */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Payment Option
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Select the option that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Payment Option */}
          <Card className="relative p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 transition-all hover:shadow-xl">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600">
              Instant Access
            </Badge>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-full mb-4">
                <CreditCard className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Pay $360
              </h3>
              <p className="text-lg text-gray-600">
                Annual membership fee
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Immediate activation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Secure Stripe payment</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Auto-renewal option</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Tax-deductible receipt</span>
              </li>
            </ul>

            <Button
              onClick={handleSelectPayment}
              disabled={selectedOption !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6"
            >
              {selectedOption === 'payment' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pay $360 Now
                </>
              )}
            </Button>
          </Card>

          {/* Volunteer Option */}
          <Card className="relative p-8 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 transition-all hover:shadow-xl">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
              Community Service
            </Badge>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Volunteer 30 Hours
              </h3>
              <p className="text-lg text-gray-600">
                Give back to the community
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">30 hours = $360 value</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Flexible scheduling</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Admin hour approval</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Community engagement</span>
              </li>
            </ul>

            <Button
              onClick={handleSelectVolunteer}
              disabled={selectedOption !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
            >
              {selectedOption === 'volunteer' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  Commit to 30 Hours
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center text-gray-600 bg-gray-100 p-6 rounded-lg">
          <p className="mb-2 text-lg">
            Both options provide full annual membership with all benefits included
          </p>
          <p className="text-sm mb-2">
            Volunteer hours must be completed and approved by an admin within the membership year
          </p>
          <p className="text-sm">
            Questions? Contact us at membership@issb.org
          </p>
        </div>

        {/* Value Proposition */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Why Join ISSB?
          </h3>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            ISSB membership connects you with like-minded individuals committed to community service and cultural preservation. 
            Whether you choose to pay or volunteer, you're investing in a stronger, more vibrant community.
          </p>
        </div>
      </div>
    </div>
  );
};

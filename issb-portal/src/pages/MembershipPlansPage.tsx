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
import { CheckCircle2, CreditCard, Users, Loader2, DollarSign, Clock, Sparkles } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading membership information...</p>
        </div>
      </div>
    );
  }

  // If user already has active or pending subscription, redirect to dashboard
  if (subscriptionStatus?.subscription) {
    navigate('/membership/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Join ISSB Membership
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Become part of a vibrant community dedicated to making a difference
          </p>
          <div className="inline-flex items-center bg-primary-100 text-primary-900 px-6 py-3 rounded-full border border-primary-200 shadow-sm">
            <span className="text-2xl font-bold">$360/year</span>
            <span className="mx-3 text-gray-600">or</span>
            <span className="text-2xl font-bold">30 volunteer hours</span>
          </div>
        </div>

        {/* Membership Benefits */}
        <div className="card-modern-lg mb-12 animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Annual Membership Benefits
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {membershipFeatures.map((feature, index) => (
              <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="p-1 bg-primary-100 rounded-lg mr-3 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary-600" />
                </div>
                <span className="text-base text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Options Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Choose Your Payment Option
          </h2>
          <p className="text-lg text-gray-600">
            Select the option that works best for you
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Payment Option */}
          <div className="relative animate-slide-up">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white border-none shadow-md z-10">
              Instant Access
            </Badge>
            <div className="card-modern-lg bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">
                  Pay $360
                </h3>
                <p className="text-lg text-gray-600 font-medium">
                  Annual membership fee
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Immediate activation</span>
                </li>
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Secure Stripe payment</span>
                </li>
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Auto-renewal option</span>
                </li>
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Tax-deductible receipt</span>
                </li>
              </ul>

              <Button
                onClick={handleSelectPayment}
                disabled={selectedOption !== null}
                size="lg"
                className="w-full text-lg shadow-lg"
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
            </div>
          </div>

          {/* Volunteer Option */}
          <div className="relative animate-slide-up animation-delay-150">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-700 text-white border-none shadow-md z-10">
              Community Service
            </Badge>
            <div className="card-modern-lg bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl mb-4 shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">
                  Volunteer 30 Hours
                </h3>
                <p className="text-lg text-gray-600 font-medium">
                  Give back to the community
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">30 hours = $360 value</span>
                </li>
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Flexible scheduling</span>
                </li>
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Admin hour approval</span>
                </li>
                <li className="flex items-start p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Community engagement</span>
                </li>
              </ul>

              <Button
                onClick={handleSelectVolunteer}
                disabled={selectedOption !== null}
                variant="secondary"
                size="lg"
                className="w-full text-lg shadow-md border-2"
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
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card-modern text-center text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 mb-12">
          <p className="mb-3 text-lg font-medium">
            Both options provide full annual membership with all benefits included
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Volunteer hours must be completed and approved by an admin within the membership year
          </p>
          <p className="text-sm text-gray-600">
            Questions? Contact us at <a href="mailto:membership@issb.org" className="text-primary-600 hover:text-primary-700 font-medium">membership@issb.org</a>
          </p>
        </div>

        {/* Value Proposition */}
        <div className="text-center bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Why Join ISSB?
          </h3>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            ISSB membership connects you with like-minded individuals committed to community service and cultural preservation. 
            Whether you choose to pay or volunteer, you're investing in a stronger, more vibrant community.
          </p>
        </div>
      </div>
    </div>
  );
};

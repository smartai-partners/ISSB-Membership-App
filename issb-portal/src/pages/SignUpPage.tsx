import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail } from '@/lib/form-validation';
import { HandHeart, CheckCircle, DollarSign, Info } from 'lucide-react';

export function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    volunteer_commitment: false,
    initial_donation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const membershipFee = 360;
  const donationAmount = parseFloat(formData.initial_donation) || 0;
  const balanceDue = Math.max(0, membershipFee - donationAmount);

  // Error message mapping for better UX
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Supabase specific error codes
      if (message.includes('email already') || message.includes('already registered')) {
        return 'An account with this email already exists. Please try logging in instead.';
      }
      
      if (message.includes('invalid email')) {
        return 'Please enter a valid email address.';
      }
      
      if (message.includes('password')) {
        return 'Password must be at least 6 characters long.';
      }
      
      if (message.includes('weak password')) {
        return 'Password is too weak. Please choose a stronger password.';
      }
      
      if (message.includes('signup disabled')) {
        return 'Account registration is currently disabled. Please contact support.';
      }
      
      if (message.includes('rate limit')) {
        return 'Too many registration attempts. Please wait a few minutes before trying again.';
      }
      
      if (message.includes('network') || message.includes('connection')) {
        return 'Network connection error. Please check your internet connection and try again.';
      }
      
      if (message.includes('database') || message.includes('constraint')) {
        return 'Unable to create account due to a database error. Please try again or contact support.';
      }
      
      // Fallback to original message
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const donationAmount = parseFloat(formData.initial_donation) || 0;
      
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        volunteer_commitment: formData.volunteer_commitment,
        donation_amount: donationAmount,
      });

      if (error) throw error;
      navigate('/');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your ISSB account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Islamic Society of Sarasota and Bradenton
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Membership Information */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start mb-3">
                <Info className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-green-900">Community Membership</h3>
                  <p className="text-xs text-green-700 mt-1">
                    One simple membership for everyone - $360/year or 30 volunteer hours
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Volunteer Commitment Checkbox */}
                <div className="flex items-start">
                  <input
                    id="volunteer_commitment"
                    name="volunteer_commitment"
                    type="checkbox"
                    checked={formData.volunteer_commitment}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5"
                  />
                  <label htmlFor="volunteer_commitment" className="ml-2 block text-sm text-gray-700">
                    <span className="font-medium">I commit to volunteering 30 hours to waive my membership fee</span>
                    <span className="block text-xs text-gray-600 mt-0.5">
                      Volunteer hours never expire and count toward your membership
                    </span>
                  </label>
                </div>

                {/* Optional Initial Donation */}
                <div>
                  <label htmlFor="initial_donation" className="block text-sm font-medium text-gray-700">
                    Optional: Make an Initial Donation
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="initial_donation"
                      name="initial_donation"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.initial_donation}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="pl-8 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Any donation will be applied to your $360 membership fee
                  </p>
                  
                  {donationAmount > 0 && (
                    <div className="mt-2 p-2 bg-white rounded border border-green-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Membership Fee:</span>
                        <span className="font-medium text-gray-900">${membershipFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Donation Applied:</span>
                        <span className="font-medium">-${Math.min(donationAmount, membershipFee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-gray-200 mt-1 pt-1">
                        <span className="text-gray-900">Balance Due:</span>
                        <span className={balanceDue === 0 ? 'text-green-600' : 'text-amber-600'}>
                          ${balanceDue.toFixed(2)}
                        </span>
                      </div>
                      {donationAmount > membershipFee && (
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>Remaining Donation:</span>
                          <span>${(donationAmount - membershipFee).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

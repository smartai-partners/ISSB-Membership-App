import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[LOGIN] Starting login process...');

    try {
      console.log('[LOGIN] Calling signIn...');
      const { error } = await signIn(email, password);
      console.log('[LOGIN] signIn returned:', { error: !!error });
      
      if (error) throw error;
      
      console.log('[LOGIN] Login successful, navigating...');
      navigate('/');
    } catch (err) {
      console.log('[LOGIN] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      console.log('[LOGIN] Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-lg text-gray-600 mb-1">
            Sign in to ISSB Portal
          </p>
          <p className="text-sm text-gray-500">
            Islamic Society of Sarasota and Bradenton
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-light border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label-modern">
                Email address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern pl-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label-modern">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

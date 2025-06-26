import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get('token');
    
    if (!resetToken) {
      setError('Missing reset token. Please use the link from your email.');
      setIsValidating(false);
      return;
    }

    setToken(resetToken);
    
    const validateToken = async () => {
      try {
        const response = await apiService.validateResetToken(resetToken);
        if (response.valid) {
          setIsTokenValid(true);
        } else {
          setError(response.message || 'Invalid or expired reset token.');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to validate reset token.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Missing reset token.');
      return;
    }
    
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await apiService.resetPassword(token, password);
      setIsCompleted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground className="flex min-h-screen flex-col">
      <div className="mx-auto mt-8 w-full max-w-md px-4 sm:px-0">
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
            <Calendar size={40} />
          </div>
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Your Password
          </h2>
          <p className="text-center text-gray-600">
            Create a new password for your TimeOff Manager account
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl animate-scale-in">
          {isValidating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Validating your reset token...</p>
            </div>
          ) : isCompleted ? (
            <div className="text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Password Reset Complete</h3>
              <p className="mt-2 text-gray-600">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => navigate('/login')}
              >
                Return to Login
              </Button>
            </div>
          ) : isTokenValid ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Enter new password"
                    minLength={4}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 4 characters long.
                </p>
              </div>

              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full py-3"
                size="lg"
                disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 4}
              >
                Reset Password
              </Button>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Invalid Reset Link</h3>
              <p className="mt-2 text-gray-600">
                {error || 'This password reset link is invalid or has expired.'}
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => navigate('/login')}
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 TimeOff Manager. Built with modern web technologies.
          </p>
        </div>
      </div>
    </GradientBackground>
  );
};

export default ResetPasswordPage;
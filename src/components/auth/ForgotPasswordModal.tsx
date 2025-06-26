import React, { useState } from 'react';
import { X, Mail, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitted ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
            <p className="text-sm text-gray-600">
              If an account exists with the email <strong>{email}</strong>, we've sent instructions to reset your password.
            </p>
            <p className="text-xs text-gray-500">
              Please check your spam folder if you don't see the email in your inbox.
            </p>
            <Button
              onClick={onClose}
              className="mt-4"
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll send a password reset link to this email address.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!email.trim() || isSubmitting}
                icon={<ArrowRight size={16} />}
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
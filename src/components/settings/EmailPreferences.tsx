import React, { useState, useEffect } from 'react';
import { X, Mail, Check, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface EmailPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmailPreferences: React.FC<EmailPreferencesProps> = ({ isOpen, onClose }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEmailPreferences();
    }
  }, [isOpen]);

  const fetchEmailPreferences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const preferences = await apiService.getEmailPreferences();
      setEmailNotifications(preferences.emailNotifications);
      setEmailVerified(preferences.emailVerified);
    } catch (error: any) {
      console.error('Failed to fetch email preferences:', error);
      setError('Failed to load email preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.updateEmailPreferences(emailNotifications);
      setSuccess('Email preferences updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to update email preferences:', error);
      setError('Failed to update email preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading preferences...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                <div className="flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                <div className="flex items-center">
                  <Check size={16} className="mr-2" />
                  {success}
                </div>
              </div>
            )}

            {/* Email Verification Status */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email Verification</h3>
                  <p className="text-sm text-gray-500">
                    {emailVerified ? 'Your email is verified' : 'Email verification not required for demo'}
                  </p>
                </div>
                <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                  emailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {emailVerified ? 'Verified' : 'Demo Mode'}
                </div>
              </div>
            </div>

            {/* Email Notifications Toggle */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">
                    Receive email alerts for time-off updates and important notifications
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                </label>
              </div>
            </div>

            {/* Email Types */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 font-medium text-gray-900">You'll receive emails for:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  Request approvals and rejections
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  New requests requiring your review (managers/admins)
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                  Password resets and security updates
                </li>
                <li className="flex items-center">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  Account welcome messages
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreferences;
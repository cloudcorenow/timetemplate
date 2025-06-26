import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Calendar, Clock, User, FileText, Bell, Mail, Key, HelpCircle, Search, Filter, CheckCircle, XCircle, Plus } from 'lucide-react';
import Button from '../ui/Button';
import TouchOptimizedCard from './TouchOptimizedCard';
import Badge from '../ui/Badge';

interface MobileHelpSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileHelpSupport: React.FC<MobileHelpSupportProps> = ({ isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <HelpCircle size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help & Support</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        {/* Getting Started */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('getting-started')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2 mr-3">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Getting Started</span>
            </div>
            {expandedSection === 'getting-started' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'getting-started' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Welcome to TimeOff Manager! This guide will help you navigate the mobile version of the app.
                </p>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Navigation</h4>
                <p>
                  The app has five main sections accessible from the bottom navigation bar:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Home</strong> - View your dashboard with request statistics</li>
                  <li><strong>Calendar</strong> - See all time-off requests on a calendar</li>
                  <li><strong>Request</strong> - Create new time-off requests</li>
                  <li><strong>Team</strong> - View all team members across departments</li>
                  <li><strong>Manage</strong> - Admin-only section for employee management</li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">User Profile</h4>
                <p>
                  Access your profile by tapping the menu icon in the top-left corner, then tapping on your profile information.
                </p>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Creating Requests */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('creating-requests')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-2 mr-3">
                <Plus size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Creating Requests</span>
            </div>
            {expandedSection === 'creating-requests' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'creating-requests' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  To create a new time-off request:
                </p>
                
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Tap the "+" button</strong> in the bottom navigation bar or the "New Time Off Request" button on the dashboard.
                  </li>
                  <li>
                    <strong>Select request type</strong>:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Paid Time Off</strong> - For vacations and personal days</li>
                      <li><strong>Sick Leave</strong> - For medical appointments and illness</li>
                      <li><strong>Time Edit</strong> - To correct clock in/out times</li>
                      <li><strong>Other</strong> - For any other time-off needs</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Select date(s)</strong> - Choose a single date or date range
                  </li>
                  <li>
                    <strong>For Time Edit requests</strong> - Enter original and requested times
                  </li>
                  <li>
                    <strong>Provide a reason</strong> - Explain why you need time off
                  </li>
                  <li>
                    <strong>Submit your request</strong> - Tap the "Submit Request" button
                  </li>
                </ol>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 flex items-start">
                    <HelpCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>Your request will be sent to your manager for approval. You'll receive a notification when your request is approved or rejected.</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Managing Requests */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('managing-requests')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-2 mr-3">
                <FileText size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Managing Requests</span>
            </div>
            {expandedSection === 'managing-requests' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'managing-requests' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <h4 className="font-medium text-gray-900 dark:text-white">For Employees</h4>
                <p>
                  View your requests on the dashboard. Each request will show its current status:
                </p>
                <div className="flex space-x-2 mb-2">
                  <Badge variant="warning" size="sm">Pending</Badge>
                  <Badge variant="success" size="sm">Approved</Badge>
                  <Badge variant="error" size="sm">Rejected</Badge>
                </div>
                <p>
                  Tap on any request to expand it and see more details.
                </p>
                
                <h4 className="font-medium text-gray-900 dark:text-white">For Managers & Admins</h4>
                <p>
                  As a manager or admin, you can approve or reject requests:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Find the pending request on your dashboard</li>
                  <li>Tap to expand the request details</li>
                  <li>Use the "Approve" or "Reject" buttons</li>
                  <li>If rejecting, provide a reason when prompted</li>
                </ol>
                
                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-amber-700 dark:text-amber-300 flex items-start">
                    <Clock size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>Managers cannot approve their own requests. Another manager or admin must approve them.</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Using the Calendar */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('using-calendar')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/50 p-2 mr-3">
                <Calendar size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Using the Calendar</span>
            </div>
            {expandedSection === 'using-calendar' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'using-calendar' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  The calendar view shows all time-off requests across your team:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Color indicators</strong> show request status:
                    <div className="flex space-x-2 mt-1">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-amber-400 mr-1"></div>
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-400 mr-1"></div>
                        <span>Approved</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-red-400 mr-1"></div>
                        <span>Rejected</span>
                      </div>
                    </div>
                  </li>
                  <li>
                    <strong>Navigate months</strong> using the arrows at the top
                  </li>
                  <li>
                    <strong>Tap on a date</strong> to see all requests for that day
                  </li>
                  <li>
                    <strong>Use filters</strong> to show only specific request types or statuses
                  </li>
                  <li>
                    <strong>Tap "Today"</strong> button to quickly jump to the current date
                  </li>
                </ul>
                
                <p>
                  The calendar is a great way to plan your time off around your team's schedule and avoid conflicts.
                </p>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Team Overview */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('team-overview')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-2 mr-3">
                <User size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Team Overview</span>
            </div>
            {expandedSection === 'team-overview' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'team-overview' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  The Team Overview section shows all members of your organization:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Search</strong> for team members by name, email, or department
                  </li>
                  <li>
                    <strong>Filter</strong> by department using the tabs at the top
                  </li>
                  <li>
                    <strong>View details</strong> for each team member including:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Name and profile picture</li>
                      <li>Email address</li>
                      <li>Department</li>
                      <li>Role (Employee or Manager)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Contact</strong> team members directly by tapping the email icon
                  </li>
                </ul>
                
                <p>
                  This view helps you understand your organization's structure and find contact information for your colleagues.
                </p>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Notifications */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('notifications')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-2 mr-3">
                <Bell size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Notifications</span>
            </div>
            {expandedSection === 'notifications' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'notifications' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Stay updated with notifications about your time-off requests:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Access notifications</strong> by tapping the bell icon in the top-right corner
                  </li>
                  <li>
                    <strong>Notification types</strong>:
                    <ul className="list-disc pl-5 mt-1">
                      <li><span className="text-blue-600 dark:text-blue-400">Info</span> - General updates and information</li>
                      <li><span className="text-green-600 dark:text-green-400">Success</span> - Approved requests</li>
                      <li><span className="text-amber-600 dark:text-amber-400">Warning</span> - Important alerts</li>
                      <li><span className="text-red-600 dark:text-red-400">Error</span> - Rejected requests or issues</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Unread notifications</strong> show a red badge with the count
                  </li>
                  <li>
                    <strong>Mark as read</strong> by tapping on a notification
                  </li>
                  <li>
                    <strong>Mark all as read</strong> using the button at the top of the notifications panel
                  </li>
                </ul>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 flex items-start">
                    <Mail size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>You can also receive email notifications. Configure your preferences in the Email Settings section of your profile.</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Search & Filters */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('search-filters')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-teal-100 dark:bg-teal-900/50 p-2 mr-3">
                <Search size={18} className="text-teal-600 dark:text-teal-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Search & Filters</span>
            </div>
            {expandedSection === 'search-filters' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'search-filters' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Find what you need quickly with search and filters:
                </p>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Global Search</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tap the search icon in the top-right corner</li>
                  <li>Search for requests, employees, or departments</li>
                  <li>Use recent searches for quick access</li>
                  <li>Tap on search results to navigate directly</li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Dashboard Filters</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Filter requests by status (All, Pending, Approved, Rejected)</li>
                  <li>Tap the filter icon for additional filtering options</li>
                  <li>Filter by date range or request type</li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Calendar Filters</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tap the filter icon to show/hide the filter panel</li>
                  <li>Filter by request status</li>
                  <li>View color-coded indicators for different request types</li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Team Filters</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Filter team members by department</li>
                  <li>Search for specific team members by name or email</li>
                </ul>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Account Settings */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('account-settings')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2 mr-3">
                <Key size={18} className="text-gray-600 dark:text-gray-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Account Settings</span>
            </div>
            {expandedSection === 'account-settings' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'account-settings' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Manage your account settings:
                </p>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Profile Settings</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Access your profile</strong> by tapping the menu icon, then your profile information
                  </li>
                  <li>
                    <strong>Update profile picture</strong> by tapping on your avatar
                  </li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Email Preferences</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Configure email notifications</strong> by tapping "Email Preferences" in your profile
                  </li>
                  <li>
                    <strong>Toggle email notifications</strong> on/off for different types of updates
                  </li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Display Settings</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Toggle dark mode</strong> by tapping "Dark Mode" or "Light Mode" in your profile
                  </li>
                </ul>
                
                <h4 className="font-medium text-gray-900 dark:text-white">Logout</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Log out</strong> by tapping the "Logout" button at the bottom of your profile
                  </li>
                </ul>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Troubleshooting */}
        <TouchOptimizedCard className="overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => toggleSection('troubleshooting')}
          >
            <div className="flex items-center">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-2 mr-3">
                <HelpCircle size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Troubleshooting</span>
            </div>
            {expandedSection === 'troubleshooting' ? (
              <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'troubleshooting' && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Common issues and solutions:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Request not showing up</h4>
                    <p>
                      If your request doesn't appear after submission:
                    </p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Pull down to refresh the dashboard</li>
                      <li>Check your internet connection</li>
                      <li>Log out and log back in</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Can't approve/reject requests</h4>
                    <p>
                      If you're a manager and can't approve requests:
                    </p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Verify you have manager permissions</li>
                      <li>Check if it's your own request (managers can't approve their own requests)</li>
                      <li>Refresh the app and try again</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Calendar not loading</h4>
                    <p>
                      If the calendar view is empty or not loading:
                    </p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Check your internet connection</li>
                      <li>Try navigating to a different month</li>
                      <li>Restart the app</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">App performance issues</h4>
                    <p>
                      If the app is running slowly:
                    </p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Close other apps running in the background</li>
                      <li>Clear your browser cache (if using web version)</li>
                      <li>Check for app updates</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 flex items-start">
                    <Mail size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>For additional support, please contact your administrator or email <strong>support@timeoff-manager.com</strong></span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </TouchOptimizedCard>

        {/* Contact Support */}
        <TouchOptimizedCard className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Need more help?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Our support team is available Monday-Friday, 9am-5pm
            </p>
            <Button
              onClick={() => window.open('mailto:support@timeoff-manager.com')}
              icon={<Mail size={16} />}
            >
              Contact Support
            </Button>
          </div>
        </TouchOptimizedCard>
      </div>

      {/* Close Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 ios-safe-bottom">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default MobileHelpSupport;
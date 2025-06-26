import React, { useState } from 'react';
import { Info, X, Mail, Check, Clock } from 'lucide-react';

interface PayrollNotificationBannerProps {
  className?: string;
}

const PayrollNotificationBanner: React.FC<PayrollNotificationBannerProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className={`rounded-lg bg-blue-50 border border-blue-200 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">Payroll Notifications</h3>
          <div className="mt-2 text-sm text-blue-700">
            {isConfirmed ? (
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <p>Payroll notifications are enabled. Approved time off and time edit requests will automatically notify payroll@sapphiremfg.com.</p>
              </div>
            ) : (
              <p>
                When time off requests (PTO, sick leave, or time edits) are approved, an automatic notification is sent to payroll@sapphiremfg.com 
                to ensure proper processing.
              </p>
            )}
          </div>
          
          {showDetails && (
            <div className="mt-3 bg-white bg-opacity-50 rounded-md p-3 text-sm text-blue-700">
              <p className="font-medium mb-2">Notification details include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Employee name and department</li>
                <li>Type of request (PTO, sick leave, or time edit)</li>
                <li>Start and end dates</li>
                <li>Total number of days</li>
                <li>For time edits: original and requested clock times</li>
                <li>Manager who approved the request</li>
              </ul>
              <button
                type="button"
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-3 w-3 mr-1" />
                Hide details
              </button>
            </div>
          )}
          
          {!showDetails && !isConfirmed && (
            <button
              type="button"
              className="mt-1 text-blue-600 hover:text-blue-800 font-medium flex items-center"
              onClick={() => setShowDetails(true)}
            >
              <Clock className="h-3 w-3 mr-1" />
              View notification details
            </button>
          )}
          
          {!isConfirmed && (
            <div className="mt-3">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setIsConfirmed(true)}
              >
                <Mail className="h-4 w-4 mr-1.5" />
                Confirm Understanding
              </button>
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setIsVisible(false)}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollNotificationBanner;
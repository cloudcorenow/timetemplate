import React, { useState } from 'react';
import { Info, X, Mail, Check } from 'lucide-react';

interface PayrollNotificationBannerProps {
  className?: string;
}

const PayrollNotificationBanner: React.FC<PayrollNotificationBannerProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

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
                <p>Payroll notifications are enabled. Approved time off requests will automatically notify payroll@sapphiremfg.com.</p>
              </div>
            ) : (
              <p>
                When time off requests are approved, an automatic notification is sent to payroll@sapphiremfg.com 
                to ensure proper processing of paid time off and sick leave.
              </p>
            )}
          </div>
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
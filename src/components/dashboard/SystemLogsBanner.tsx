import React, { useState } from 'react';
import { Database, Server, Laptop, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

interface SystemLogsBannerProps {
  className?: string;
}

const SystemLogsBanner: React.FC<SystemLogsBannerProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <div className={`rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Database className="h-5 w-5 text-blue-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">System Monitoring Available</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              You now have access to both server-side and client-side logs to help monitor system activity and troubleshoot issues.
            </p>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md bg-white bg-opacity-50 p-3">
                <div className="flex items-center mb-2">
                  <Server className="h-4 w-4 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">Server Logs</h4>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  View backend activity including:
                </p>
                <ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
                  <li>API requests and responses</li>
                  <li>Database operations</li>
                  <li>Authentication events</li>
                  <li>Email notifications</li>
                </ul>
              </div>
              
              <div className="rounded-md bg-white bg-opacity-50 p-3">
                <div className="flex items-center mb-2">
                  <Laptop className="h-4 w-4 text-indigo-600 mr-2" />
                  <h4 className="font-medium text-indigo-800">Client Logs</h4>
                </div>
                <p className="text-xs text-indigo-700 mb-2">
                  Monitor frontend activity including:
                </p>
                <ul className="text-xs text-indigo-700 list-disc pl-5 space-y-1">
                  <li>User interactions</li>
                  <li>Resource loading</li>
                  <li>Rendering errors</li>
                  <li>Network requests</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => navigate('/logs')}
                icon={<ArrowRight size={16} />}
              >
                View System Logs
              </Button>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setIsVisible(false)}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogsBanner;
import React from 'react';
import { TimeOffRequest } from '../../types/request';
import RequestCard from './RequestCard';

interface RequestListProps {
  requests: TimeOffRequest[];
  isManager: boolean;
}

const RequestList: React.FC<RequestListProps> = ({ requests, isManager }) => {
  if (requests.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-gray-500">No requests found</p>
        {!isManager && (
          <p className="mt-2 text-sm text-gray-400">
            Create a new time off request to get started
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <RequestCard 
          key={request.id} 
          request={request} 
          isManager={isManager}
        />
      ))}
    </div>
  );
};

export default RequestList;
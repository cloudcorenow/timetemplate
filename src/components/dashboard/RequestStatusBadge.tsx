import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { RequestStatus } from '../../types/request';

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
          <Clock size={12} className="mr-1" />
          Pending
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
          <CheckCircle2 size={12} className="mr-1" />
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
          <XCircle size={12} className="mr-1" />
          Rejected
        </span>
      );
    default:
      return null;
  }
};

export default RequestStatusBadge;
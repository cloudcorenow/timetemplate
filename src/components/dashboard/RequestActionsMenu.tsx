import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Trash2, Edit, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import { useRequestStore } from '../../store/requestStore';
import { useAuth } from '../../context/AuthContext';
import RequestDetailsModal from './RequestDetailsModal';
import EditRequestModal from './EditRequestModal';

interface RequestActionsMenuProps {
  requestId: string;
  employeeName: string;
  status?: string;
  employeeId?: string;
}

const RequestActionsMenu: React.FC<RequestActionsMenuProps> = ({ 
  requestId, 
  employeeName, 
  status = 'pending',
  employeeId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { forceRefresh } = useRequestStore();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewDetails = () => {
    setShowDetailsModal(true);
    setIsOpen(false);
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${employeeName}'s request?`)) {
      setIsDeleting(true);
      try {
        // Call the API to delete the request
        await apiService.deleteRequest(requestId);
        
        // Refresh the requests list
        await forceRefresh();
        
        addToast({
          type: 'success',
          title: 'Request Deleted',
          message: `${employeeName}'s request has been deleted successfully`
        });
      } catch (error) {
        console.error('Failed to delete request:', error);
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete the request. Please try again.'
        });
      } finally {
        setIsDeleting(false);
      }
    }
    setIsOpen(false);
  };

  const handleArchive = () => {
    addToast({
      type: 'success',
      title: 'Request Archived',
      message: `${employeeName}'s request has been archived`
    });
    setIsOpen(false);
  };

  // Check if the current user can delete this request
  const canDelete = () => {
    if (!user) return false;
    
    // Admins and managers can delete any request
    if (user.role === 'admin' || user.role === 'manager') return true;
    
    // Employees can only delete their own requests when they're in pending status
    if (user.role === 'employee') {
      return employeeId === user.id && status === 'pending';
    }
    
    return false;
  };

  // Check if the current user can edit this request
  const canEdit = () => {
    if (!user) return false;
    
    // Admins and managers can edit any request
    if (user.role === 'admin' || user.role === 'manager') return true;
    
    // Employees can only edit their own requests when they're in pending status
    if (user.role === 'employee') {
      return employeeId === user.id && status === 'pending';
    }
    
    return false;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="More options"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 animate-scale-in">
          <button
            onClick={handleViewDetails}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Eye size={16} className="mr-3 text-gray-400" />
            View Details
          </button>
          
          {canEdit() && (
            <button
              onClick={handleEdit}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit size={16} className="mr-3 text-gray-400" />
              Edit Request
            </button>
          )}
          
          <button
            onClick={handleArchive}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Archive size={16} className="mr-3 text-gray-400" />
            Archive
          </button>
          
          {canDelete() && (
            <>
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} className="mr-3" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Request Details Modal */}
      <RequestDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        requestId={requestId}
      />

      {/* Edit Request Modal */}
      <EditRequestModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        requestId={requestId}
      />
    </div>
  );
};

export default RequestActionsMenu;
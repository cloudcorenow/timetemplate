import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Trash2, Edit, Copy, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

interface RequestActionsMenuProps {
  requestId: string;
  employeeName: string;
}

const RequestActionsMenu: React.FC<RequestActionsMenuProps> = ({ requestId, employeeName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

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
    // In a real app, this would navigate to a detailed view
    addToast({
      type: 'info',
      title: 'View Request Details',
      message: `Viewing details for ${employeeName}'s request`
    });
    setIsOpen(false);
  };

  const handleEdit = () => {
    addToast({
      type: 'info',
      title: 'Edit Request',
      message: `Editing ${employeeName}'s request`
    });
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${employeeName}'s request?`)) {
      addToast({
        type: 'success',
        title: 'Request Deleted',
        message: `${employeeName}'s request has been deleted`
      });
    }
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    addToast({
      type: 'info',
      title: 'Request Duplicated',
      message: `Created a copy of ${employeeName}'s request`
    });
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
          
          <button
            onClick={handleEdit}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Edit size={16} className="mr-3 text-gray-400" />
            Edit Request
          </button>
          
          <button
            onClick={handleDuplicate}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Copy size={16} className="mr-3 text-gray-400" />
            Duplicate
          </button>
          
          <button
            onClick={handleArchive}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <Archive size={16} className="mr-3 text-gray-400" />
            Archive
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleDelete}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestActionsMenu;
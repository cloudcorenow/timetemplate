import React, { useState } from 'react';
import { Search, X, Clock, User, Calendar } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearch: React.FC<MobileSearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToast({
        type: 'info',
        title: 'Search',
        message: `Searching for "${searchQuery}"...`
      });
      onClose();
    }
  };

  const recentSearches = [
    { icon: User, text: 'John Doe requests', type: 'employee' },
    { icon: Calendar, text: 'December 2024', type: 'date' },
    { icon: Clock, text: 'Pending requests', type: 'status' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests, employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="p-4">
        {searchQuery ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Search Results</h3>
            <p className="text-sm text-gray-500">
              Searching for "{searchQuery}"...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Recent Searches</h3>
            <div className="space-y-2">
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(item.text);
                    handleSearch(new Event('submit') as any);
                  }}
                  className="flex w-full items-center rounded-lg p-3 text-left hover:bg-gray-50 active:bg-gray-100"
                >
                  <item.icon size={16} className="mr-3 text-gray-400" />
                  <span className="text-sm text-gray-700">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearch;
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';
import { Users } from 'lucide-react';

const TeamOverviewPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const teamMembers = isAdmin 
    ? mockUsers.filter(member => member.role !== 'admin') // Show all non-admin users
    : mockUsers.filter(member => member.department === user?.department);

  // Get unique departments for admin view
  const departments = isAdmin 
    ? [...new Set(mockUsers.filter(u => u.role !== 'admin').map(u => u.department))]
    : [user?.department].filter(Boolean);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Overview</h1>
        <p className="mt-1 text-gray-600">
          {isAdmin ? 'View all employees across departments' : 'Manage and view your team members'}
        </p>
      </div>

      {isAdmin ? (
        // Admin view - grouped by department
        <div className="space-y-6">
          {departments.map(department => {
            const departmentMembers = mockUsers.filter(member => 
              member.department === department && member.role !== 'admin'
            );
            
            return (
              <div key={department} className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{department}</h2>
                      <p className="text-sm text-gray-500">{departmentMembers.length} team members</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {departmentMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-full">
                        <img
                          src={member.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.role}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Manager view - single department
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {user?.department} Team
                </h2>
                <p className="text-sm text-gray-500">{teamMembers.length} team members</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <img
                    src={member.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                  <p className="text-xs text-gray-400">{member.department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamOverviewPage;
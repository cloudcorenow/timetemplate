import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { Users } from 'lucide-react';
import { apiService } from '../services/api';

const TeamOverviewPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let data;
        if (isAdmin) {
          // Admin gets all users except other admins
          data = await apiService.getUsers();
          setEmployees(data.filter((emp: User) => emp.role !== 'admin'));
        } else {
          // Manager gets team members from their department
          data = await apiService.getTeamMembers();
          setEmployees(data);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [isAdmin]);

  // Group employees by department for admin view
  const groupedEmployees = isAdmin 
    ? employees.reduce((acc, employee) => {
        const dept = employee.department;
        if (!acc[dept]) {
          acc[dept] = [];
        }
        acc[dept].push(employee);
        return acc;
      }, {} as Record<string, User[]>)
    : { [user?.department || '']: employees };

  const departments = Object.keys(groupedEmployees).filter(dept => dept && groupedEmployees[dept].length > 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Overview</h1>
        <p className="mt-1 text-gray-600">
          {isAdmin ? 'View all employees across departments' : 'Manage and view your team members'}
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-lg bg-white p-8 shadow-md text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No team members found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {departments.map(department => {
            const departmentMembers = groupedEmployees[department];
            
            return (
              <div key={department} className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{department}</h2>
                      <p className="text-sm text-gray-500">{departmentMembers.length} team member{departmentMembers.length !== 1 ? 's' : ''}</p>
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
                        <p className={`text-sm ${
                          member.role === 'manager' 
                            ? 'text-purple-600 font-medium' 
                            : 'text-gray-500'
                        }`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamOverviewPage;
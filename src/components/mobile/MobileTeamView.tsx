import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/user';
import { Users, Search, Filter, Building2, Mail, Phone, Calendar, Award, Crown, UserCheck, Star } from 'lucide-react';
import { apiService } from '../../services/api';
import TouchOptimizedCard from './TouchOptimizedCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import ScheduleModal from '../team/ScheduleModal';

const MobileTeamView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await apiService.getTeamMembers();
        console.log('Team members fetched:', data);
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching team members:', error);
        
        if (isAdmin) {
          try {
            const adminData = await apiService.getUsers();
            console.log('Admin users fetched:', adminData);
            setEmployees(adminData.filter((emp: User) => emp.role !== 'admin'));
          } catch (adminError) {
            console.error('Error fetching admin users:', adminError);
            setError('Failed to load team members');
          }
        } else {
          setError('Failed to load team members');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [isAdmin]);

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Group employees by department
  const groupedEmployees = filteredEmployees.reduce((acc, employee) => {
    const dept = employee.department;
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(employee);
    return acc;
  }, {} as Record<string, User[]>);

  const handleSchedule = (employee: User) => {
    setSelectedEmployee(employee);
    setShowScheduleModal(true);
  };

  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown size={14} className="text-purple-500" />;
      case 'admin':
        return <Star size={14} className="text-yellow-500" />;
      default:
        return <UserCheck size={14} className="text-blue-500" />;
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-red-100 text-red-800'
    ];
    
    const index = department.length % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                selectedDepartment === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              All
            </button>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  selectedDepartment === dept
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <TouchOptimizedCard className="p-3">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{employees.length}</p>
              <p className="text-xs text-gray-600">Team Members</p>
            </div>
          </div>
        </TouchOptimizedCard>
        
        <TouchOptimizedCard className="p-3">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-2">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{departments.length}</p>
              <p className="text-xs text-gray-600">Departments</p>
            </div>
          </div>
        </TouchOptimizedCard>
      </div>

      {/* Team Members */}
      {filteredEmployees.length === 0 ? (
        <TouchOptimizedCard className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedDepartment !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No team members have been added yet'
            }
          </p>
        </TouchOptimizedCard>
      ) : (
        <div className="space-y-6">
          {selectedDepartment === 'all' ? (
            // Group by department
            Object.entries(groupedEmployees).map(([department, departmentMembers]) => (
              <div key={department}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Building2 size={16} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">{department}</h2>
                  </div>
                  <Badge 
                    variant="default" 
                    size="sm"
                    className={getDepartmentColor(department)}
                  >
                    {departmentMembers.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {departmentMembers.map((member) => (
                    <TouchOptimizedCard key={member.id} className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="h-12 w-12 overflow-hidden rounded-full">
                            <img
                              src={member.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-sm">
                            {getRoleIcon(member.role)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => window.open(`mailto:${member.email}`)}
                            className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => handleSchedule(member)}
                            className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                          >
                            <Calendar size={16} />
                          </button>
                        </div>
                      </div>
                    </TouchOptimizedCard>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show filtered results without grouping
            <div className="space-y-3">
              {filteredEmployees.map((member) => (
                <TouchOptimizedCard key={member.id} className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-12 w-12 overflow-hidden rounded-full">
                        <img
                          src={member.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-sm">
                        {getRoleIcon(member.role)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        <Badge 
                          variant="default" 
                          size="sm" 
                          className={`ml-2 ${getDepartmentColor(member.department)}`}
                        >
                          {member.department}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => window.open(`mailto:${member.email}`)}
                        className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={() => handleSchedule(member)}
                        className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                      >
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>
                </TouchOptimizedCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {selectedEmployee && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
};

export default MobileTeamView;
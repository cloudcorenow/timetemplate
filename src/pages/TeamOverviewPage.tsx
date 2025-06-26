import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { Users, Search, Filter, MapPin, Mail, Phone, Calendar, Award, Building2, UserCheck, Crown, Star } from 'lucide-react';
import { apiService } from '../services/api';
import GradientBackground from '../components/ui/GradientBackground';
import AnimatedCard from '../components/ui/AnimatedCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ScheduleModal from '../components/team/ScheduleModal';

const TeamOverviewPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
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

  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);
  const roles = [...new Set(employees.map(emp => emp.role))].filter(Boolean);

  const handleSchedule = (employee: User) => {
    setSelectedEmployee(employee);
    setShowScheduleModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown size={16} className="text-purple-500" />;
      case 'admin':
        return <Star size={16} className="text-yellow-500" />;
      default:
        return <UserCheck size={16} className="text-blue-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return <Badge variant="info" size="sm">Manager</Badge>;
      case 'admin':
        return <Badge variant="warning" size="sm">Admin</Badge>;
      default:
        return <Badge variant="default" size="sm">Employee</Badge>;
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

  const renderEmployeeCard = (employee: User, index: number) => (
    <AnimatedCard 
      key={employee.id} 
      className="overflow-hidden hover:shadow-lg transition-all duration-300"
      delay={index * 50}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-white shadow-lg">
              <img
                src={employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                alt={employee.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-md">
              {getRoleIcon(employee.role)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{employee.name}</h3>
                <p className="text-sm text-gray-500 truncate">{employee.email}</p>
              </div>
              {getRoleBadge(employee.role)}
            </div>
            
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <Building2 size={14} className="mr-2 text-gray-400" />
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDepartmentColor(employee.department)}`}>
                {employee.department}
              </span>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Mail size={14} />}
                onClick={() => window.open(`mailto:${employee.email}`)}
              >
                Email
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Calendar size={14} />}
                onClick={() => handleSchedule(employee)}
              >
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );

  const renderEmployeeList = (employee: User, index: number) => (
    <AnimatedCard 
      key={employee.id} 
      className="overflow-hidden hover:shadow-md transition-all duration-200"
      delay={index * 25}
    >
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
              <img
                src={employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                alt={employee.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
              {getRoleIcon(employee.role)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{employee.name}</h3>
                <p className="text-sm text-gray-500">{employee.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDepartmentColor(employee.department)}`}>
                  {employee.department}
                </span>
                {getRoleBadge(employee.role)}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<Mail size={14} />}
              onClick={() => window.open(`mailto:${employee.email}`)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Calendar size={14} />}
              onClick={() => handleSchedule(employee)}
            />
          </div>
        </div>
      </div>
    </AnimatedCard>
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading team members...</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
            <p className="mt-1 text-gray-600">
              View all team members across departments ({filteredEmployees.length} of {employees.length} members)
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedCard className="p-6">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={100}>
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-3">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => emp.role === 'manager').length}
                </p>
                <p className="text-sm text-gray-600">Managers</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={200}>
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={300}>
            <div className="flex items-center">
              <div className="rounded-lg bg-orange-100 p-3">
                <UserCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => emp.role === 'employee').length}
                </p>
                <p className="text-sm text-gray-600">Employees</p>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Filters */}
        <AnimatedCard className="p-6" delay={400}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AnimatedCard>

        {/* Team Members */}
        {filteredEmployees.length === 0 ? (
          <AnimatedCard className="p-12 text-center" delay={500}>
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No team members have been added yet'
              }
            </p>
          </AnimatedCard>
        ) : (
          <div className="space-y-8">
            {selectedDepartment === 'all' ? (
              // Group by department
              Object.entries(groupedEmployees).map(([department, departmentMembers], deptIndex) => (
                <div key={department}>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{department}</h2>
                        <p className="text-sm text-gray-500">
                          {departmentMembers.length} team member{departmentMembers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getDepartmentColor(department)}`}>
                      {departmentMembers.length} members
                    </span>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {departmentMembers.map((member, index) => 
                        renderEmployeeCard(member, deptIndex * 10 + index)
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {departmentMembers.map((member, index) => 
                        renderEmployeeList(member, deptIndex * 10 + index)
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Show filtered results without grouping
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedDepartment !== 'all' ? selectedDepartment : 'All Departments'}
                    {selectedRole !== 'all' && ` - ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}s`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filteredEmployees.length} team member{filteredEmployees.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredEmployees.map((member, index) => 
                      renderEmployeeCard(member, index)
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEmployees.map((member, index) => 
                      renderEmployeeList(member, index)
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {selectedEmployee && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          employee={selectedEmployee}
        />
      )}
    </GradientBackground>
  );
};

export default TeamOverviewPage;
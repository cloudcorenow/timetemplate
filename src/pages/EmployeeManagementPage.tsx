import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { UserPlus, Pencil, Trash2, Check, X, Key, Mail, Search, Filter, Users, Crown, Star, UserCheck, Building2, Calendar, Phone, MoreVertical } from 'lucide-react';
import { apiService } from '../services/api';
import GradientBackground from '../components/ui/GradientBackground';
import AnimatedCard from '../components/ui/AnimatedCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ImageUpload from '../components/ui/ImageUpload';

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Project Management', 'Shop', 'IT'];

const EmployeeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(null);
  const [sendingTestEmailTo, setSendingTestEmailTo] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [testEmailData, setTestEmailData] = useState({
    subject: '',
    message: '',
    type: 'info'
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: departments[0],
    role: 'employee' as const,
    avatar: ''
  });

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const users = await apiService.getUsers();
        // Filter out admin users from the display
        setEmployees(users.filter((u: User) => u.role !== 'admin'));
        setError(null);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Failed to load employees');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user]);

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const handleAddEmployee = async () => {
    try {
      await apiService.createUser(newEmployee);
      
      // Refresh the employee list
      const users = await apiService.getUsers();
      setEmployees(users.filter((u: User) => u.role !== 'admin'));
      
      setIsAddingEmployee(false);
      setNewEmployee({
        name: '',
        email: '',
        department: departments[0],
        role: 'employee',
        avatar: ''
      });
      setError(null);
    } catch (error: any) {
      console.error('Error adding employee:', error);
      setError(error.message || 'Failed to add employee');
    }
  };

  const handleEditEmployee = (employee: User) => {
    setEditingEmployee(employee);
    setNewEmployee({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      avatar: employee.avatar || ''
    });
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      await apiService.updateUser(editingEmployee.id, newEmployee);
      
      // Refresh the employee list
      const users = await apiService.getUsers();
      setEmployees(users.filter((u: User) => u.role !== 'admin'));
      
      setEditingEmployee(null);
      setNewEmployee({
        name: '',
        email: '',
        department: departments[0],
        role: 'employee',
        avatar: ''
      });
      setError(null);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      setError(error.message || 'Failed to update employee');
    }
  };

  const handleResetPassword = async () => {
    if (!resettingPasswordFor || !newPassword.trim()) return;

    try {
      await apiService.resetUserPassword(resettingPasswordFor.id, newPassword);
      
      setResettingPasswordFor(null);
      setNewPassword('');
      setError(null);
      
      // Show success message
      alert(`Password reset successfully for ${resettingPasswordFor.name}. They will be notified of the change via email.`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password');
    }
  };

  const handleSendTestEmail = async () => {
    if (!sendingTestEmailTo || !testEmailData.subject.trim() || !testEmailData.message.trim()) return;

    try {
      await apiService.sendTestEmail(
        sendingTestEmailTo.email,
        testEmailData.subject,
        testEmailData.message,
        testEmailData.type
      );
      
      setSendingTestEmailTo(null);
      setTestEmailData({ subject: '', message: '', type: 'info' });
      setError(null);
      
      // Show success message
      alert(`Test email sent successfully to ${sendingTestEmailTo.name} (${sendingTestEmailTo.email})`);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setError(error.message || 'Failed to send test email');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteUser(id);
      
      // Remove from local state
      setEmployees(employees.filter(emp => emp.id !== id));
      setError(null);
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      setError(error.message || 'Failed to delete employee');
    }
  };

  const cancelEdit = () => {
    setEditingEmployee(null);
    setIsAddingEmployee(false);
    setResettingPasswordFor(null);
    setSendingTestEmailTo(null);
    setNewPassword('');
    setTestEmailData({ subject: '', message: '', type: 'info' });
    setNewEmployee({
      name: '',
      email: '',
      department: departments[0],
      role: 'employee',
      avatar: ''
    });
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
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
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
              <h3 className="font-semibold text-gray-900 truncate">{employee.name}</h3>
              <p className="text-sm text-gray-500 truncate">{employee.email}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDepartmentColor(employee.department)}`}>
                  <Building2 size={12} className="mr-1" />
                  {employee.department}
                </span>
                {getRoleBadge(employee.role)}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil size={14} />}
              onClick={() => handleEditEmployee(employee)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Key size={14} />}
              onClick={() => setResettingPasswordFor(employee)}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Mail size={14} />}
              onClick={() => setSendingTestEmailTo(employee)}
              className="flex-1"
            >
              Email
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => handleDeleteEmployee(employee.id)}
              className="flex-1 text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );

  if (user?.role !== 'admin') {
    return (
      <GradientBackground>
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </div>
      </GradientBackground>
    );
  }

  if (isLoading) {
    return (
      <GradientBackground>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading employees...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="mt-1 text-gray-600">
              Add, edit, or remove employees from the system
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
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              onClick={() => setIsAddingEmployee(true)}
              icon={<UserPlus size={16} />}
              disabled={editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
            >
              Add Employee
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <AnimatedCard className="bg-red-50 border border-red-200">
            <div className="p-4 text-sm text-red-700">
              {error}
            </div>
          </AnimatedCard>
        )}

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
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(employees.map(emp => emp.department))].length}
                </p>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" delay={300}>
            <div className="flex items-center">
              <div className="rounded-lg bg-orange-100 p-3">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => new Date(emp.created_at).getMonth() === new Date().getMonth()).length}
                </p>
                <p className="text-sm text-gray-600">New This Month</p>
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
                placeholder="Search employees..."
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
                <option value="employee">Employees</option>
                <option value="manager">Managers</option>
              </select>
            </div>
          </div>
        </AnimatedCard>

        {/* Add/Edit Employee Form */}
        {(isAddingEmployee || editingEmployee) && (
          <AnimatedCard className="p-6" delay={500}>
            <h3 className="mb-6 text-xl font-semibold text-gray-900">
              {editingEmployee ? 'Edit Employee' : 'New Employee'}
            </h3>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profile Picture Upload */}
              <div className="lg:col-span-2 flex justify-center">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Picture
                  </label>
                  <ImageUpload
                    currentImage={newEmployee.avatar}
                    onImageChange={(imageData) => setNewEmployee({ ...newEmployee, avatar: imageData || '' })}
                    size="lg"
                  />
                </div>
              </div>
              
              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as User['role'] })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={cancelEdit}
                icon={<X size={16} />}
              >
                Cancel
              </Button>
              <Button
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                disabled={!newEmployee.name || !newEmployee.email}
                icon={<Check size={16} />}
              >
                {editingEmployee ? 'Update' : 'Save'}
              </Button>
            </div>
          </AnimatedCard>
        )}

        {/* Reset Password Form */}
        {resettingPasswordFor && (
          <AnimatedCard className="bg-amber-50 border border-amber-200" delay={500}>
            <div className="p-6">
              <h3 className="mb-4 text-xl font-semibold text-amber-800">
                Reset Password for {resettingPasswordFor.name}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (minimum 4 characters)"
                  className="w-full rounded-lg border border-amber-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
                />
                <p className="mt-2 text-xs text-amber-600">
                  The user will be notified about this password change via email and must use the new password to log in.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={cancelEdit}
                  icon={<X size={16} />}
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={handleResetPassword}
                  disabled={!newPassword.trim() || newPassword.length < 4}
                  icon={<Key size={16} />}
                >
                  Reset Password
                </Button>
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Test Email Form */}
        {sendingTestEmailTo && (
          <AnimatedCard className="bg-blue-50 border border-blue-200" delay={500}>
            <div className="p-6">
              <h3 className="mb-4 text-xl font-semibold text-blue-800">
                Send Test Email to {sendingTestEmailTo.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Email Type</label>
                  <select
                    value={testEmailData.type}
                    onChange={(e) => setTestEmailData({ ...testEmailData, type: e.target.value })}
                    className="w-full rounded-lg border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={testEmailData.subject}
                    onChange={(e) => setTestEmailData({ ...testEmailData, subject: e.target.value })}
                    placeholder="Test email subject"
                    className="w-full rounded-lg border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Message</label>
                  <textarea
                    value={testEmailData.message}
                    onChange={(e) => setTestEmailData({ ...testEmailData, message: e.target.value })}
                    placeholder="Test email message content"
                    rows={4}
                    className="w-full rounded-lg border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <p className="text-xs text-blue-700">
                    This will send a test email to <strong>{sendingTestEmailTo.email}</strong> to verify email functionality.
                    The email will be formatted according to the selected type with a professional template.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={cancelEdit}
                  icon={<X size={16} />}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendTestEmail}
                  disabled={!testEmailData.subject.trim() || !testEmailData.message.trim()}
                  icon={<Mail size={16} />}
                >
                  Send Test Email
                </Button>
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Employee List */}
        {filteredEmployees.length === 0 ? (
          <AnimatedCard className="p-12 text-center" delay={600}>
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No employees have been added yet'
              }
            </p>
            <Button
              onClick={() => setIsAddingEmployee(true)}
              icon={<UserPlus size={16} />}
              disabled={isAddingEmployee || editingEmployee !== null}
            >
              Add Your First Employee
            </Button>
          </AnimatedCard>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEmployees.map((employee, index) => renderEmployeeCard(employee, index))}
          </div>
        ) : (
          <AnimatedCard className="overflow-hidden" delay={600}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="relative h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                              alt={employee.name}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 shadow-sm">
                              {getRoleIcon(employee.role)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDepartmentColor(employee.department)}`}>
                          {employee.department}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {getRoleBadge(employee.role)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Pencil size={14} />}
                            onClick={() => handleEditEmployee(employee)}
                            disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Key size={14} />}
                            onClick={() => setResettingPasswordFor(employee)}
                            disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Mail size={14} />}
                            onClick={() => setSendingTestEmailTo(employee)}
                            disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        )}
      </div>
    </GradientBackground>
  );
};

export default EmployeeManagementPage;
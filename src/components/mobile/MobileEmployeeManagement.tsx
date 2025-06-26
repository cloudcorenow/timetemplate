import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/user';
import { UserPlus, Pencil, Trash2, Check, X, Key, Mail, Search, Filter, Users, Crown, Star, UserCheck, Building2, MoreVertical } from 'lucide-react';
import { apiService } from '../../services/api';
import TouchOptimizedCard from './TouchOptimizedCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Project Management', 'Shop', 'IT'];

const MobileEmployeeManagement: React.FC = () => {
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
  const [showFilters, setShowFilters] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
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
    
    return matchesSearch && matchesDepartment;
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
    setShowActionMenu(null);
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
      setShowActionMenu(null);
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

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  // Render add/edit employee form
  if (isAddingEmployee || editingEmployee) {
    return (
      <div className="space-y-6 pb-20">
        <h3 className="text-xl font-semibold text-gray-900">
          {editingEmployee ? 'Edit Employee' : 'New Employee'}
        </h3>
        
        <div className="space-y-4">
          {/* Profile Picture */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gray-200">
              <img 
                src={newEmployee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          
          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture URL
            </label>
            <input
              type="text"
              value={newEmployee.avatar}
              onChange={(e) => setNewEmployee({ ...newEmployee, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={newEmployee.department}
              onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as User['role'] })}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4 ios-safe-bottom">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={cancelEdit}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
              disabled={!newEmployee.name || !newEmployee.email}
              className="flex-1"
            >
              {editingEmployee ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render reset password form
  if (resettingPasswordFor) {
    return (
      <div className="space-y-6 pb-20">
        <h3 className="text-xl font-semibold text-amber-800">
          Reset Password
        </h3>
        
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 overflow-hidden rounded-full mr-3">
              <img 
                src={resettingPasswordFor.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt={resettingPasswordFor.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-amber-900">{resettingPasswordFor.name}</p>
              <p className="text-sm text-amber-700">{resettingPasswordFor.email}</p>
            </div>
          </div>
          
          <p className="text-sm text-amber-700 mb-4">
            You are about to reset the password for this employee. They will be notified via email.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (minimum 4 characters)"
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4 ios-safe-bottom">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={cancelEdit}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={handleResetPassword}
              disabled={!newPassword.trim() || newPassword.length < 4}
              className="flex-1"
            >
              Reset Password
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render test email form
  if (sendingTestEmailTo) {
    return (
      <div className="space-y-6 pb-20">
        <h3 className="text-xl font-semibold text-blue-800">
          Send Test Email
        </h3>
        
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 overflow-hidden rounded-full mr-3">
              <img 
                src={sendingTestEmailTo.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt={sendingTestEmailTo.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-blue-900">{sendingTestEmailTo.name}</p>
              <p className="text-sm text-blue-700">{sendingTestEmailTo.email}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Type
            </label>
            <select
              value={testEmailData.type}
              onChange={(e) => setTestEmailData({ ...testEmailData, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={testEmailData.subject}
              onChange={(e) => setTestEmailData({ ...testEmailData, subject: e.target.value })}
              placeholder="Test email subject"
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={testEmailData.message}
              onChange={(e) => setTestEmailData({ ...testEmailData, message: e.target.value })}
              placeholder="Test email message content"
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4 ios-safe-bottom">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={cancelEdit}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendTestEmail}
              disabled={!testEmailData.subject.trim() || !testEmailData.message.trim()}
              className="flex-1"
            >
              Send Email
            </Button>
          </div>
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
            placeholder="Search employees..."
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

      {/* Add Employee Button */}
      <Button
        onClick={() => setIsAddingEmployee(true)}
        icon={<UserPlus size={16} />}
        className="w-full"
      >
        Add New Employee
      </Button>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Employee List */}
      {filteredEmployees.length === 0 ? (
        <TouchOptimizedCard className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedDepartment !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No employees have been added yet'
            }
          </p>
          <Button
            onClick={() => setIsAddingEmployee(true)}
            icon={<UserPlus size={16} />}
          >
            Add Your First Employee
          </Button>
        </TouchOptimizedCard>
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((employee) => (
            <TouchOptimizedCard key={employee.id} className="p-4 relative">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-12 w-12 overflow-hidden rounded-full">
                    <img
                      src={employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                      alt={employee.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-sm">
                    {getRoleIcon(employee.role)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{employee.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                  <div className="mt-1 flex items-center">
                    <Badge 
                      variant="default" 
                      size="sm" 
                      className={getDepartmentColor(employee.department)}
                    >
                      {employee.department}
                    </Badge>
                    <Badge 
                      variant={employee.role === 'manager' ? 'info' : 'default'} 
                      size="sm"
                      className="ml-2"
                    >
                      {employee.role}
                    </Badge>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowActionMenu(showActionMenu === employee.id ? null : employee.id)}
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              
              {/* Action Menu */}
              {showActionMenu === employee.id && (
                <div className="absolute right-2 top-16 z-10 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={() => handleEditEmployee(employee)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil size={16} className="mr-3 text-gray-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setResettingPasswordFor(employee);
                      setShowActionMenu(null);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Key size={16} className="mr-3 text-gray-400" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => {
                      setSendingTestEmailTo(employee);
                      setShowActionMenu(null);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Mail size={16} className="mr-3 text-gray-400" />
                    Send Test Email
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-3" />
                    Delete
                  </button>
                </div>
              )}
            </TouchOptimizedCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileEmployeeManagement;
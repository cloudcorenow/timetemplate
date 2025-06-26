import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { UserPlus, Pencil, Trash2, Check, X, Key, Mail } from 'lucide-react';
import { apiService } from '../services/api';

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

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
        <p className="mt-1 text-gray-600">
          Add, edit, or remove employees from the system
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            Employees ({employees.length})
          </h2>
          <button
            onClick={() => setIsAddingEmployee(true)}
            className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            disabled={editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
          >
            <UserPlus size={16} className="mr-2" />
            Add Employee
          </button>
        </div>

        {(isAddingEmployee || editingEmployee) && (
          <div className="mb-6 rounded-lg border border-gray-200 p-4">
            <h3 className="mb-4 text-lg font-medium text-gray-700">
              {editingEmployee ? 'Edit Employee' : 'New Employee'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Avatar URL (optional)</label>
                <input
                  type="url"
                  value={newEmployee.avatar}
                  onChange={(e) => setNewEmployee({ ...newEmployee, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={cancelEdit}
                className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                disabled={!newEmployee.name || !newEmployee.email}
                className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <Check size={16} className="mr-2" />
                {editingEmployee ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {resettingPasswordFor && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-4 text-lg font-medium text-amber-800">
              Reset Password for {resettingPasswordFor.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-amber-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (minimum 4 characters)"
                className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-amber-600">
                The user will be notified about this password change via email and must use the new password to log in.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelEdit}
                className="flex items-center rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword.trim() || newPassword.length < 4}
                className="flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                <Key size={16} className="mr-2" />
                Reset Password
              </button>
            </div>
          </div>
        )}

        {sendingTestEmailTo && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-4 text-lg font-medium text-blue-800">
              Send Test Email to {sendingTestEmailTo.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700">Email Type</label>
                <select
                  value={testEmailData.type}
                  onChange={(e) => setTestEmailData({ ...testEmailData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700">Subject</label>
                <input
                  type="text"
                  value={testEmailData.subject}
                  onChange={(e) => setTestEmailData({ ...testEmailData, subject: e.target.value })}
                  placeholder="Test email subject"
                  className="mt-1 block w-full rounded-md border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700">Message</label>
                <textarea
                  value={testEmailData.message}
                  onChange={(e) => setTestEmailData({ ...testEmailData, message: e.target.value })}
                  placeholder="Test email message content"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-blue-600">
                This will send a test email to {sendingTestEmailTo.email} to verify email functionality.
              </p>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={cancelEdit}
                className="flex items-center rounded-md border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={!testEmailData.subject.trim() || !testEmailData.message.trim()}
                className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <Mail size={16} className="mr-2" />
                Send Test Email
              </button>
            </div>
          </div>
        )}

        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
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
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                            alt={employee.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {employee.department}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        employee.role === 'manager' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit employee"
                          disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setResettingPasswordFor(employee)}
                          className="text-amber-600 hover:text-amber-900"
                          title="Reset password"
                          disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => setSendingTestEmailTo(employee)}
                          className="text-green-600 hover:text-green-900"
                          title="Send test email"
                          disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete employee"
                          disabled={isAddingEmployee || editingEmployee !== null || resettingPasswordFor !== null || sendingTestEmailTo !== null}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
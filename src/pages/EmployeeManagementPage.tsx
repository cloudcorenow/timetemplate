import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { UserPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { apiService } from '../services/api';

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Project Management', 'Shop', 'IT'];

const EmployeeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: departments[0],
    role: 'employee' as const
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
      // In a real implementation, you would call an API to create the employee
      // For now, we'll just add it to the local state
      const employee: User = {
        id: Math.random().toString(36).substring(2, 9),
        ...newEmployee,
        password: 'password' // Default password
      };
      
      setEmployees([...employees, employee]);
      setIsAddingEmployee(false);
      setNewEmployee({
        name: '',
        email: '',
        department: departments[0],
        role: 'employee'
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      setError('Failed to add employee');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      // In a real implementation, you would call an API to delete the employee
      // For now, we'll just remove it from the local state
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Failed to delete employee');
    }
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
          >
            <UserPlus size={16} className="mr-2" />
            Add Employee
          </button>
        </div>

        {isAddingEmployee && (
          <div className="mb-6 rounded-lg border border-gray-200 p-4">
            <h3 className="mb-4 text-lg font-medium text-gray-700">New Employee</h3>
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
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingEmployee(false)}
                className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!newEmployee.name || !newEmployee.email}
                className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <Check size={16} className="mr-2" />
                Save
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
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit employee"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete employee"
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
import { User } from '../types/user';
import { TimeOffRequest } from '../types/request';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Juan Carranza',
    email: 'employee@example.com',
    password: 'password',
    role: 'employee',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '2',
    name: 'Ana Ramirez',
    email: 'manager@example.com',
    password: 'password',
    role: 'manager',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '3',
    name: 'Alissa Pryor',
    email: 'alice@example.com',
    password: 'password',
    role: 'employee',
    department: 'Marketing',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '4',
    name: 'Charly Osornio',
    email: 'bob@example.com',
    password: 'password',
    role: 'employee',
    department: 'Sales',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '5',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
    department: 'IT',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '6',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'password',
    role: 'employee',
    department: 'Project Management',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '7',
    name: 'Mike Rodriguez',
    email: 'mike@example.com',
    password: 'password',
    role: 'employee',
    department: 'Shop',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  }
];

// Mock requests with sample data
export const mockRequests: TimeOffRequest[] = [
  {
    id: 'req1',
    employee: mockUsers[0], // Juan Carranza
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-17'),
    type: 'paid time off',
    reason: 'Family vacation to the mountains',
    status: 'approved',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
    approvedBy: mockUsers[1] // Ana Ramirez
  },
  {
    id: 'req2',
    employee: mockUsers[2], // Alissa Pryor
    startDate: new Date('2025-02-20'),
    endDate: new Date('2025-02-21'),
    type: 'sick leave',
    reason: 'Flu symptoms, need to recover',
    status: 'pending',
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-12')
  },
  {
    id: 'req3',
    employee: mockUsers[3], // Charly Osornio
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-05'),
    type: 'paid time off',
    reason: 'Wedding anniversary celebration',
    status: 'pending',
    createdAt: new Date('2025-01-13'),
    updatedAt: new Date('2025-01-13')
  },
  {
    id: 'req4',
    employee: mockUsers[5], // Sarah Johnson
    startDate: new Date('2025-01-08'),
    endDate: new Date('2025-01-08'),
    type: 'time edit',
    reason: 'Forgot to clock out yesterday',
    status: 'approved',
    createdAt: new Date('2025-01-09'),
    updatedAt: new Date('2025-01-09'),
    approvedBy: mockUsers[1], // Ana Ramirez
    originalClockIn: '08:00',
    originalClockOut: '17:00',
    requestedClockIn: '08:00',
    requestedClockOut: '18:00'
  },
  {
    id: 'req5',
    employee: mockUsers[6], // Mike Rodriguez
    startDate: new Date('2025-02-28'),
    endDate: new Date('2025-03-01'),
    type: 'other',
    reason: 'Personal appointment that cannot be rescheduled',
    status: 'rejected',
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-11'),
    approvedBy: mockUsers[1], // Ana Ramirez
    rejectionReason: 'Insufficient notice period. Please submit requests at least 2 weeks in advance.'
  }
];
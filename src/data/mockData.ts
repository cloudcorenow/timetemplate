import { User } from '../types/user';
import { TimeOffRequest } from '../types/request';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Juan Carranza',
    email: 'employee@example.com',
    role: 'employee',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '2',
    name: 'Ana Ramirez',
    email: 'manager@example.com',
    role: 'manager',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '3',
    name: 'Alissa Pryor',
    email: 'alice@example.com',
    role: 'employee',
    department: 'Marketing',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '4',
    name: 'Charly Osornio',
    email: 'bob@example.com',
    role: 'employee',
    department: 'Sales',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '5',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    department: 'IT',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '6',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'employee',
    department: 'Project Management',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: '7',
    name: 'Mike Rodriguez',
    email: 'mike@example.com',
    role: 'employee',
    department: 'Shop',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  }
];

// Empty mock requests array
export const mockRequests: TimeOffRequest[] = [];
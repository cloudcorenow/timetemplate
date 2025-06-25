const API_BASE_URL = 'https://timeoff-manager.lamado.workers.dev/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      credentials: 'include' as RequestCredentials,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to Cloudflare Workers. Please check your connection.');
      }
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = response.token;
    localStorage.setItem('token', response.token);
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateAvatar(avatar: string) {
    return this.request('/auth/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar }),
    });
  }

  // Request methods
  async getRequests() {
    return this.request('/requests');
  }

  async createRequest(requestData: any) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequestStatus(id: string, status: string, rejectionReason?: string) {
    return this.request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  // Notification methods
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  // User methods
  async getUsers() {
    return this.request('/users');
  }

  async getTeamMembers() {
    return this.request('/users/team');
  }

  // Utility methods
  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }
}

export const apiService = new ApiService();
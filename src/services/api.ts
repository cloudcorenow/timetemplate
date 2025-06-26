const API_BASE_URL = 'https://sapphireapp.site/api';

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
        throw new Error('Cannot connect to server. Please check your connection.');
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

  // Email preferences methods
  async getEmailPreferences() {
    return this.request('/auth/email-preferences');
  }

  async updateEmailPreferences(emailNotifications: boolean) {
    return this.request('/auth/email-preferences', {
      method: 'PATCH',
      body: JSON.stringify({ emailNotifications }),
    });
  }

  // Request methods
  async getRequests() {
    return this.request('/requests');
  }

  async getRequest(id: string) {
    return this.request(`/requests/${id}`);
  }

  async createRequest(requestData: any) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequest(id: string, requestData: any) {
    return this.request(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequestStatus(id: string, status: string, rejectionReason?: string) {
    return this.request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  async deleteRequest(id: string) {
    return this.request(`/requests/${id}`, {
      method: 'DELETE',
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

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async resetUserPassword(id: string, newPassword: string) {
    return this.request(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword }),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getTeamMembers() {
    return this.request('/users/team');
  }

  // Test email method (admin only)
  async sendTestEmail(to: string, subject: string, message: string, type: string = 'info') {
    return this.request('/test-email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, message, type }),
    });
  }

  // Logs methods (admin only)
  async getLogs(filters?: { level?: string; category?: string; startDate?: string; endDate?: string }) {
    let queryParams = '';
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      queryParams = `?${params.toString()}`;
    }
    
    return this.request(`/logs${queryParams}`);
  }

  // System status (admin only)
  async getSystemStatus() {
    return this.request('/debug/system-status');
  }

  // Utility methods
  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }
}

export const apiService = new ApiService();
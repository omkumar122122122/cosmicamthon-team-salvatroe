import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

function normalizeUser(user) {
  if (!user) return null;
  const fullName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return {
    ...user,
    id: user.id,
    name: fullName,
    fullName,
    email: user.email,
    role: 'donor',
    avatar: (fullName.charAt(0) || 'D').toUpperCase(),
    department: 'Philanthropic Partner',
  };
}

class DonorService {
  async register(donorData) {
    const response = await apiClient.post('/donors/register', donorData);
    const data = unwrap(response);
    return {
      message: data.message,
      user: normalizeUser(data.user),
      tokens: data.tokens,
    };
  }

  async login(credentials) {
    const response = await apiClient.post('/donors/login', credentials);
    const data = unwrap(response);
    return {
      message: data.message,
      user: normalizeUser(data.user),
      tokens: data.tokens,
    };
  }

  async getProfile() {
    const response = await apiClient.get('/donors/profile');
    return unwrap(response);
  }

  async createDonation(donationData) {
    const response = await apiClient.post('/donors/donations', donationData);
    return unwrap(response);
  }

  async getDonations() {
    const response = await apiClient.get('/donors/donations');
    return unwrap(response);
  }

  async getStats() {
    const response = await apiClient.get('/donors/stats');
    return unwrap(response);
  }
}

export const donorService = new DonorService();

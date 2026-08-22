/**
 * Staff Service
 * Dedicated API integration layers for System Admin staff and Orphanage staff endpoints
 */

import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

/**
 * Service for Platform/System Admin Staff management (/admin/staff)
 */
export const adminStaffService = {
  async getAll(params = {}) {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await apiClient.get('/admin/staff', cleanParams);
    return unwrap(response);
  },

  async getById(id) {
    const response = await apiClient.get(`/admin/staff/${id}`);
    return unwrap(response);
  },

  async create(staffData) {
    const response = await apiClient.post('/admin/staff', staffData);
    return unwrap(response);
  },

  async update(id, updates) {
    const response = await apiClient.patch(`/admin/staff/${id}`, updates);
    return unwrap(response);
  },

  async delete(id) {
    const response = await apiClient.delete(`/admin/staff/${id}`);
    return unwrap(response);
  },

  async deactivate(id) {
    const response = await apiClient.patch(`/admin/staff/${id}/deactivate`);
    return unwrap(response);
  },

  async reactivate(id) {
    const response = await apiClient.patch(`/admin/staff/${id}/reactivate`);
    return unwrap(response);
  },
};

/**
 * Service for Care Home / Orphanage Staff management (/orphanage/staff)
 */
export const orphanageStaffService = {
  async getAll(params = {}) {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await apiClient.get('/orphanage/staff', cleanParams);
    return unwrap(response);
  },

  async getById(id) {
    const response = await apiClient.get(`/orphanage/staff/${id}`);
    return unwrap(response);
  },

  async create(staffData) {
    const response = await apiClient.post('/orphanage/staff', staffData);
    return unwrap(response);
  },

  async update(id, updates) {
    const response = await apiClient.patch(`/orphanage/staff/${id}`, updates);
    return unwrap(response);
  },

  async deactivate(id) {
    const response = await apiClient.patch(`/orphanage/staff/${id}/deactivate`);
    return unwrap(response);
  },

  async reactivate(id) {
    const response = await apiClient.patch(`/orphanage/staff/${id}/reactivate`);
    return unwrap(response);
  },
};

/**
 * Legacy staff service interface for backward compatibility
 */
export const staffService = {
  async getAll(params = {}) {
    return orphanageStaffService.getAll(params);
  },

  async getById(id) {
    return orphanageStaffService.getById(id);
  },

  async getByOrphanage(orphanageId, params = {}) {
    return orphanageStaffService.getAll({ ...params, orphanageId });
  },

  async getAvailable(orphanageId) {
    const response = await apiClient.get(`/staff/available/${orphanageId}`);
    return unwrap(response);
  },

  async create(staffData) {
    return orphanageStaffService.create(staffData);
  },

  async update(id, updates) {
    return orphanageStaffService.update(id, updates);
  },

  async deactivate(id) {
    return orphanageStaffService.deactivate(id);
  },

  async reactivate(id) {
    return orphanageStaffService.reactivate(id);
  },
};

import { apiClient as api } from './apiClient';

export const settingsService = {
  /**
   * Get all system settings
   */
  async getAll() {
    const response = await api.get('/settings');
    return response.data;
  },

  /**
   * Get settings for a specific section
   */
  async getSection(section) {
    const response = await api.get(`/settings/${section}`);
    return response.data;
  },

  /**
   * Update settings for a specific section
   */
  async update(section, data) {
    const response = await api.patch(`/settings/${section}`, data);
    return response.data;
  },

  /**
   * Create a manual backup
   */
  async createBackup() {
    const response = await api.post('/settings/backup');
    return response.data;
  },

  /**
   * Restore from a backup
   */
  async restoreBackup(backupId) {
    const response = await api.post('/settings/restore', { backupId });
    return response.data;
  },

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults() {
    const response = await api.post('/settings/reset-default');
    return response.data;
  },

  /**
   * Get list of available backups
   */
  async getBackups() {
    const response = await api.get('/settings/backups');
    return response.data;
  },
};

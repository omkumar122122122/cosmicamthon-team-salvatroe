import { apiClient } from './apiClient';

function unwrap(res) {
  if (res && typeof res === 'object' && 'data' in res) {
    return res.data;
  }
  return res;
}

export const postAdoptionService = {
  /**
   * Get 6-month assessment schedule for parent/child
   */
  async getSchedule(params = {}) {
    const response = await apiClient.get('/post-adoption/schedule', params);
    return unwrap(response);
  },

  /**
   * Initialize a new assessment session
   */
  async startAssessment(data) {
    const response = await apiClient.post('/post-adoption/start', data);
    return unwrap(response);
  },

  /**
   * Get age-bracketed welfare questions for a child
   */
  async getQuestions(childId) {
    const response = await apiClient.get(`/post-adoption/questions/${childId}`);
    return unwrap(response);
  },

  /**
   * Process facial expression analysis
   */
  async uploadFace(data) {
    const response = await apiClient.post('/post-adoption/upload-face', data);
    return unwrap(response);
  },

  /**
   * Process audio/voice sentiment analysis
   */
  async uploadVoice(data) {
    const response = await apiClient.post('/post-adoption/upload-voice', data);
    return unwrap(response);
  },

  /**
   * Submit completed assessment with answers & scores
   */
  async submitAssessment(data) {
    const response = await apiClient.post('/post-adoption/submit', data);
    return unwrap(response);
  },

  /**
   * Get assessment report by ID
   */
  async getReport(id) {
    const response = await apiClient.get(`/post-adoption/report/${id}`);
    return unwrap(response);
  },
};

import { apiClient } from './apiClient';

// Helper: unwrap the TransformInterceptor envelope
function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

export const childrenService = {
  /**
   * Get all children with filters and pagination
   * @returns {Promise<{ data: Array, pagination: Object, summary: Object }>}
   */
  async getAll(params = {}) {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await apiClient.get('/children', cleanParams);
    return unwrap(response);
  },

  /**
   * Get child profile by ID
   * @param {string} id
   * @returns {Promise<Object>} Child profile data
   */
  async getById(id) {
    const response = await apiClient.get(`/children/${id}/profile`);
    return unwrap(response);
  },

  /**
   * Get recently registered children
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRecent(limit = 5) {
    const response = await apiClient.get('/children', { limit, sortBy: 'createdAt', sortOrder: 'desc' });
    return unwrap(response);
  },

  /**
   * Register a new child intake record
   * @param {Object} childData
   * @returns {Promise<Object>} Created child response
   */
  async register(childData) {
    const response = await apiClient.post('/children/register', childData);
    return unwrap(response);
  },

  /**
   * Legacy create method for backward compatibility
   */
  async create(childData, photoFile) {
    if (photoFile) {
      const reader = new FileReader();
      const photoBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(photoFile);
      });
      childData.photo = photoBase64;
    }
    return this.register(childData);
  },

  /**
   * Start AI Face Enrollment Session
   * @param {string} childId
   * @returns {Promise<Object>}
   */
  async startFaceEnrollment(childId) {
    const response = await apiClient.post(`/children/${childId}/face-enrollment/start`, {});
    return unwrap(response);
  },

  /**
   * Process a single live camera face frame
   * @param {string} childId
   * @param {Object} frameData
   * @returns {Promise<Object>}
   */
  async processFaceFrame(childId, frameData) {
    const response = await apiClient.post(`/children/${childId}/face-enrollment/process-frame`, frameData);
    return unwrap(response);
  },

  /**
   * Complete multi-pose AI Face Enrollment pipeline
   * Evaluates poses, picks smiling photo as profile picture, generates 512-d biometric embedding
   * @param {string} childId
   * @param {Array} capturedFrames
   * @returns {Promise<Object>}
   */
  async completeFaceEnrollment(childId, capturedFrames, masterEmbedding) {
    const formattedFrames = (capturedFrames || []).map((frame) => ({
      childId: frame.childId || childId,
      pose: frame.pose || "FRONT_NEUTRAL",
      imageBase64: frame.imageBase64 || frame.imageUrl || "",
      lightingQuality: frame.lightingQuality ?? 95,
      blurScore: frame.blurScore ?? 92,
    }));

    const payload = {
      childId,
      capturedFrames: formattedFrames,
    };

    if (masterEmbedding && Array.isArray(masterEmbedding) && masterEmbedding.length === 512) {
      payload.masterEmbedding = masterEmbedding;
    }

    console.log("===== FACE ENROLLMENT PAYLOAD =====");
    console.log({
      childId,
      hasMasterEmbedding: !!payload.masterEmbedding,
      masterEmbeddingLength: payload.masterEmbedding?.length,
      capturedFramesLength: formattedFrames.length,
      firstCapturedFrame: formattedFrames[0],
    });
    console.log("====================================");

    const response = await apiClient.post(`/children/${childId}/face-enrollment/complete`, payload);
    return unwrap(response);
  },

  /**
   * Start Live AI Attendance Session for an Orphanage
   */
  async startAttendanceSession(orphanageId, cameraId = 'CAM-01-MAIN') {
    const response = await apiClient.post('/children/attendance/session/start', { orphanageId, cameraId });
    return unwrap(response);
  },

  /**
   * Process live camera snapshot for biometric face recognition & matching against database
   */
  async recognizeFrame(sessionId, imageBase64, cameraId = 'CAM-01-MAIN') {
    const response = await apiClient.post('/children/attendance/recognize-frame', {
      sessionId,
      imageBase64,
      cameraId,
    });
    return unwrap(response);
  },

  /**
   * End Attendance Session & trigger absentee detection summary
   */
  async endAttendanceSession(sessionId) {
    const response = await apiClient.post('/children/attendance/session/end', { sessionId });
    return unwrap(response);
  },

  /**
   * Get current attendance session status
   */
  async getAttendanceSessionStatus(orphanageId) {
    const response = await apiClient.get('/children/attendance/session/status', { orphanageId });
    return unwrap(response);
  },

  /**
   * Update child information
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<void>}
   */
  async update(id, updates) {
    const response = await apiClient.patch(`/children/${id}`, updates);
    return unwrap(response);
  },

  /**
   * Delete a child record (soft delete)
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const response = await apiClient.delete(`/children/${id}/archive`);
    return unwrap(response);
  },

  /**
   * Get medical history for a child
   * @param {string} id
   * @returns {Promise<Array>}
   */
  async getMedicalHistory(id) {
    const response = await apiClient.get(`/children/${id}/profile`);
    const profile = unwrap(response);
    return profile.medicalHistories || [];
  },
};

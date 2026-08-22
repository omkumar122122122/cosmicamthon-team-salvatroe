/**
 * visitRequestsService.js — Visit Request API client
 * Backend: /api/v1/visit-requests/*
 */

import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

function dateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function titleCaseEnum(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function initialsFromName(name) {
  return (name || 'Parent')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'P';
}

function normalizeVisitRequest(request) {
  if (!request) return request;

  const parent = request.parent || {};
  const orphanage = request.orphanage || {};
  const fullName = parent.fullName || 'Unknown Parent';
  const risk = titleCaseEnum(request.riskLevel);
  const uploadedDocuments = request.uploadedDocuments || request.documents || [];

  return {
    ...request,
    visitDate: dateOnly(request.visitDate),
    orphanageId: request.orphanageId || orphanage.id,
    parentId: request.parentId || parent.id,
    childId: request.childId || request.child?.id,
    parentName: fullName,
    initials: initialsFromName(fullName),
    age: parent.age ?? 'N/A',
    occupation: parent.occupation || 'Not provided',
    phone: parent.phone || 'N/A',
    email: parent.email || 'N/A',
    address: parent.address || 'N/A',
    familyMembers: parent.familyMembers || 'N/A',
    income: parent.income || 'N/A',
    risk,
    riskLabel: risk,
    timeline: request.adoptionTimeline || 'Not provided',
    meetingRoom: request.meetingRoom || 'Pending assignment',
    assignedStaff: request.assignedStaff || 'Unassigned',
    specialNotes: request.specialRequirements || request.instructions || request.reason || 'No special notes provided.',
    documents: uploadedDocuments,
    arrivalTime: request.expectedArrivalTime || request.visitTime,
    checkIn: request.checkInTime || '--',
    checkOut: request.checkOutTime || '--',
    verification: request.verification || {},
    orphanageName: orphanage.name || 'Unknown Orphanage',
  };
}

function normalizeList(response) {
  const payload = unwrap(response) || {};
  const data = Array.isArray(payload) ? payload : payload.data || [];

  return {
    ...payload,
    data: data.map(normalizeVisitRequest),
    pagination: payload.pagination || payload.meta || {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
    },
  };
}

export const visitRequestsService = {
  /**
   * Create a visit request (Parent)
   * @param {Object} payload
   */
  async create(payload) {
    const response = await apiClient.post('/visit-requests', payload);
    return normalizeVisitRequest(unwrap(response));
  },

  /**
   * List visit requests with filters
   * Parent sees own; Orphanage sees their orphanage; Admin sees all
   */
  async getAll(params = {}) {
    const cleanParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await apiClient.get('/visit-requests', cleanParams);
    return normalizeList(response);
  },

  /**
   * Get single visit request by ID
   */
  async getById(id) {
    const response = await apiClient.get(`/visit-requests/${id}`);
    return normalizeVisitRequest(unwrap(response));
  },

  /**
   * Get dashboard stats for orphanage/admin manage page
   */
  async getStats(params = {}) {
    const response = await apiClient.get('/visit-requests/stats', params);
    return unwrap(response);
  },

  /**
   * Get my requests (parent shortcut)
   */
  async getMyRequests(params = {}) {
    const response = await apiClient.get('/visit-requests/my-requests', params);
    return normalizeList(response);
  },

  /**
   * Get today's scheduled visits
   */
  async getTodayVisits() {
    const response = await apiClient.get('/visit-requests/today');
    const payload = unwrap(response);
    return Array.isArray(payload) ? payload.map(normalizeVisitRequest) : [];
  },

  /**
   * Approve a visit request (Orphanage / Admin)
   */
  async approve(id, data = {}) {
    const response = await apiClient.patch(`/visit-requests/${id}/approve`, data);
    return unwrap(response);
  },

  /**
   * Reject a visit request
   */
  async reject(id, { reason, comments } = {}) {
    const response = await apiClient.patch(`/visit-requests/${id}/reject`, {
      reason,
      comments,
    });
    return unwrap(response);
  },

  /**
   * Reschedule a visit request
   */
  async reschedule(id, { newDate, newTime, reason, notifyParent } = {}) {
    const response = await apiClient.patch(`/visit-requests/${id}/reschedule`, {
      newDate,
      newTime,
      reason,
      notifyParent,
    });
    return unwrap(response);
  },

  /**
   * Request additional documents from parent
   */
  async requestDocuments(id, documentsData) {
    const response = await apiClient.patch(`/visit-requests/${id}/request-documents`, {
      missingDocuments: documentsData.missingDocuments || documentsData.requiredDocuments || [],
      note: documentsData.note,
    });
    return unwrap(response);
  },

  /**
   * Cancel a visit request (Parent or Admin)
   */
  async cancel(id, reason) {
    const response = await apiClient.patch(`/visit-requests/${id}/cancel`, { cancellationReason: reason });
    return unwrap(response);
  },

  /**
   * Respond to a reschedule request (Parent)
   */
  async respondReschedule(id, { action, reason } = {}) {
    const response = await apiClient.patch(`/visit-requests/${id}/respond-reschedule`, {
      action,
      reason,
    });
    return unwrap(response);
  },

  /**
   * Mark visit as completed
   */
  async complete(id, feedbackData) {
    const response = await apiClient.patch(`/visit-requests/${id}/complete`, feedbackData);
    return unwrap(response);
  },

  /**
   * Check in a visit request on visit day
   */
  async checkIn(id) {
    const response = await apiClient.patch(`/visit-requests/${id}/check-in`);
    return unwrap(response);
  },

  /**
   * Mark visit request as No Show
   */
  async noShow(id, { reason } = {}) {
    const response = await apiClient.patch(`/visit-requests/${id}/no-show`, { reason });
    return unwrap(response);
  },
};

/**
 * nfcService.js — NFC API client for Parent and Orphanage interactions
 * Backend: /api/v1/nfc/*
 */

import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

export const nfcService = {
  /**
   * Public lookup endpoint for scanned NFC tag / ID
   * GET /api/v1/nfc/visit/:tokenOrId
   */
  async getVisitByToken(tokenOrId) {
    if (!tokenOrId) throw new Error('NFC token or ID is required');
    const response = await apiClient.get(`/nfc/visit/${encodeURIComponent(tokenOrId)}`);
    return unwrap(response);
  },

  /**
   * Dedicated Parent & Visit Details lookup by NFC ID
   * GET /api/v1/nfc/parent/:nfcId
   */
  async getParentByNfcId(nfcId) {
    if (!nfcId) throw new Error('NFC ID is required');
    const response = await apiClient.get(`/nfc/parent/${encodeURIComponent(nfcId)}`);
    return unwrap(response);
  },

  /**
   * Gate verification endpoint for orphanage gate reader
   * POST /api/v1/nfc/verify
   */
  async verifyNfcTap(payload) {
    const response = await apiClient.post('/nfc/verify', payload);
    return unwrap(response);
  },

  /**
   * Authenticated lookup for a parent's approved visit request
   * GET /api/v1/nfc/request/:visitRequestId
   */
  async getPassByVisitRequestId(visitRequestId) {
    const response = await apiClient.get(`/nfc/request/${visitRequestId}`);
    return unwrap(response);
  },

  /**
   * Explicitly generate or fetch NFC pass for an approved visit
   * POST /api/v1/nfc/request/:visitRequestId/generate
   */
  async generatePass(visitRequestId) {
    const response = await apiClient.post(`/nfc/request/${visitRequestId}/generate`);
    return unwrap(response);
  },
};

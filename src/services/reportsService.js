import { apiClient } from './apiClient';

/**
 * Reports Service
 * Handles all report-related API calls
 */

export const reportsService = {
  /**
   * GET /reports/dashboard-stats
   * Returns: { aiSafetyScore, complianceRate, highRiskChildren, avgAttendance }
   * Each metric: { value: "94%", trend: "+2.1%", direction: "up" }
   */
  getDashboardStats: () => apiClient.get('/reports/dashboard-stats'),

  /**
   * GET /reports/monthly-trend
   * Returns: { labels: string[], datasets: ChartDatasetDto[] }
   * For LineChart displaying 6-month trends
   */
  getMonthlyTrend: () => apiClient.get('/reports/monthly-trend'),

  /**
   * GET /reports/risk-distribution
   * Returns: { labels: string[], datasets: RiskDatasetDto[] }
   * For Doughnut chart displaying risk distribution
   */
  getRiskDistribution: () => apiClient.get('/reports/risk-distribution'),

  /**
   * GET /reports/compliance-summary
   * Returns: { submittedForms, pendingReviews, inspectionScore }
   * Each metric: { value, percentage, status, statusColor }
   */
  getComplianceSummary: () => apiClient.get('/reports/compliance-summary'),

  /**
   * GET /reports/activity-breakdown
   * Returns: { activities: ActivityItemDto[] }
   * Each activity: { label, count, total, percentage }
   */
  getActivityBreakdown: () => apiClient.get('/reports/activity-breakdown'),

  /**
   * POST /reports/export
   * Body: { format: 'PDF'|'EXCEL'|'CSV', reportType: 'DASHBOARD'|..., filters: {} }
   * Returns: { exportId, status, message, downloadUrl? }
   */
  exportReport: (format, reportType = 'DASHBOARD', filters = {}) =>
    apiClient.post('/reports/export', { format, reportType, filters }),

  /**
   * GET /reports/history
   * Returns: { exports: ReportHistoryItemDto[], total: number }
   */
  getExportHistory: () => apiClient.get('/reports/history'),

  /**
   * GET /reports/:id/download
   * Returns: { downloadUrl: string }
   */
  getDownloadUrl: (exportId) => apiClient.get(`/reports/${exportId}/download`),
};

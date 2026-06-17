import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getTrailSegments: (status?: string) =>
    api.get('/admin/trail-segments', { params: { status } }),
  createTrailSegment: (data: any) => api.post('/admin/trail-segments', data),
  updateTrailSegment: (id: number, data: any) =>
    api.put(`/admin/trail-segments/${id}`, data),
  deleteTrailSegment: (id: number) => api.delete(`/admin/trail-segments/${id}`),
  getObservationPoints: (segmentId?: number, status?: string) =>
    api.get('/admin/observation-points', { params: { segment_id: segmentId, status } }),
  createObservationPoint: (data: any) => api.post('/admin/observation-points', data),
  updateObservationPoint: (id: number, data: any) =>
    api.put(`/admin/observation-points/${id}`, data),
  deleteObservationPoint: (id: number) => api.delete(`/admin/observation-points/${id}`),
  getActivityRoutes: (status?: string) =>
    api.get('/admin/activity-routes', { params: { status } }),
  createActivityRoute: (data: any) => api.post('/admin/activity-routes', data),
  updateActivityRoute: (id: number, data: any) =>
    api.put(`/admin/activity-routes/${id}`, data),
  deleteActivityRoute: (id: number) => api.delete(`/admin/activity-routes/${id}`),
  getEquipments: (category?: string, status?: string) =>
    api.get('/admin/equipments', { params: { category, status } }),
  createEquipment: (data: any) => api.post('/admin/equipments', data),
  updateEquipment: (id: number, data: any) =>
    api.put(`/admin/equipments/${id}`, data),
  deleteEquipment: (id: number) => api.delete(`/admin/equipments/${id}`),
  getInspectionCycles: () => api.get('/admin/inspection-cycles'),
  createInspectionCycle: (data: any) => api.post('/admin/inspection-cycles', data),
  updateInspectionCycle: (id: number, data: any) =>
    api.put(`/admin/inspection-cycles/${id}`, data),
};

export const inspectorApi = {
  getPendingSegments: () => api.get('/inspector/pending-segments'),
  getInspectionRecords: (segmentId?: number, startDate?: string, endDate?: string, status?: string) =>
    api.get('/inspector/inspection-records', {
      params: { segment_id: segmentId, start_date: startDate, end_date: endDate, status },
    }),
  createInspectionRecord: (data: any) => api.post('/inspector/inspection-records', data),
  getObservationPoints: (segmentId: number) =>
    api.get(`/inspector/observation-points/${segmentId}`),
  updatePointStatus: (pointId: number, status: string, bleachersStatus?: string) =>
    api.put(`/inspector/observation-points/${pointId}/status`, null, {
      params: { status, bleachers_status: bleachersStatus },
    }),
};

export const leaderApi = {
  getBatches: (routeId?: number, startDate?: string, endDate?: string, status?: string, leaderId?: number) =>
    api.get('/leader/batches', {
      params: { route_id: routeId, start_date: startDate, end_date: endDate, status, leader_id: leaderId },
    }),
  createBatch: (data: any) => api.post('/leader/batches', data),
  updateBatch: (id: number, data: any) => api.put(`/leader/batches/${id}`, data),
  getRouteChanges: (batchId: number) =>
    api.get(`/leader/route-changes/${batchId}`),
  createRouteChange: (data: any) => api.post('/leader/route-changes', data),
  getFeedbacks: (batchId: number) => api.get(`/leader/feedbacks/${batchId}`),
  createFeedback: (data: any) => api.post('/leader/feedbacks', data),
  getAvailableRoutes: () => api.get('/leader/available-routes'),
  getRouteRisk: (routeId: number) => api.get(`/leader/route-risk/${routeId}`),
};

export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview'),
  getRouteHeatmap: (startDate?: string, endDate?: string) =>
    api.get('/dashboard/route-heatmap', { params: { start_date: startDate, end_date: endDate } }),
  getAnomalyDistribution: () => api.get('/dashboard/anomaly-distribution'),
  getInspectionWorkload: (startDate?: string, endDate?: string) =>
    api.get('/dashboard/inspection-workload', {
      params: { start_date: startDate, end_date: endDate },
    }),
  getPendingPoints: () => api.get('/dashboard/pending-points'),
  getHighFrequencyAnomalies: (threshold?: number, days?: number) =>
    api.get('/dashboard/high-frequency-anomalies', { params: { threshold, days } }),
  getOverdueInspections: () => api.get('/dashboard/overdue-inspections'),
  getActivityPeakHours: (days?: number) =>
    api.get('/dashboard/activity-peak-hours', { params: { days } }),
  getRiskOverlap: () => api.get('/dashboard/risk-overlap'),
  getRiskBatches: () => api.get('/dashboard/risk-batches'),
};

export default api;

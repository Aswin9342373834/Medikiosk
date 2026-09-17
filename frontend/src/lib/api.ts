import axios from 'axios';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api`;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: any;
  headers?: Record<string, string>;
}

const api = {
  async request(endpoint: string, options: RequestOptions = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await axios({
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        headers,
      });
      return response.data;
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Network request failed';
      throw new Error(errMsg);
    }
  },

  // Auth
  async login(credentials: { email: string; password: string }) {
    const data = await this.request('/auth/login', { method: 'POST', data: credentials });
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData: any) {
    return this.request('/auth/register', { method: 'POST', data: userData });
  },

  async getMe() {
    return this.request('/auth/me');
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  // Patient & Clinical Intake
  async opRegister(data: any) {
    return this.request('/patients/op-register', { method: 'POST', data });
  },

  async getPatientProfile() {
    return this.request('/patients/profile');
  },

  async submitClinicalHistory(historyData: any) {
    return this.request('/clinical-history/submit-history', { method: 'POST', data: historyData });
  },

  async getAdaptiveQuestion(currentHistory: any, language: string) {
    return this.request('/clinical-history/adaptive-question', {
      method: 'POST',
      data: { currentHistory, language }
    });
  },

  async getPatientClinicalHistory(patientId: string) {
    return this.request(`/clinical-history/patient/${patientId}`);
  },

  async reviewAISummary(historyId: string, reviewData: { doctorReviewStatus: string; doctorNotes?: string; editedSummary?: string }) {
    return this.request(`/clinical-history/${historyId}/review`, { method: 'PATCH', data: reviewData });
  },

  // Document Management & Visibility
  async uploadDocument(formData: FormData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMyDocuments() {
    return this.request('/documents/my-documents');
  },

  async getPatientDocuments(patientId: string) {
    return this.request(`/documents/patient/${patientId}`);
  },

  async getDocument(docId: string) {
    return this.request(`/documents/${docId}`);
  },

  async updateDocumentVisibility(docId: string, visibility: 'Released' | 'Private') {
    return this.request(`/documents/${docId}/visibility`, {
      method: 'PATCH',
      data: { visibility }
    });
  },

  // Doctor Portal
  async getDoctorQueue() {
    return this.request('/doctors/queue');
  },

  async getDoctorPatientDetails(patientId: string) {
    return this.request(`/doctors/patient-details/${patientId}`);
  },

  // Prescriptions & Consultations
  async createPrescription(prescriptionData: any) {
    return this.request('/prescriptions', { method: 'POST', data: prescriptionData });
  },

  async getPatientPrescriptions(patientId: string) {
    return this.request(`/prescriptions/patient/${patientId}`);
  },

  async startConsultation(patientId: string, department?: string) {
    return this.request('/consultations/start', { method: 'POST', data: { patientId, department } });
  },

  async completeConsultation(consultationData: any) {
    return this.request('/consultations/complete', { method: 'POST', data: consultationData });
  },

  // Admin Dashboard
  async getAdminStats() {
    return this.request('/admin/stats');
  },

  async getAdminDepartments() {
    return this.request('/admin/departments');
  },

  async getAdminKiosks() {
    return this.request('/admin/kiosks');
  },

  async getAdminLogs() {
    return this.request('/admin/logs');
  },

  async getAdminSchemes() {
    return this.request('/admin/schemes');
  },

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  },

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  // AI & Ollama Status
  async getAIStatus() {
    return this.request('/ai/status');
  }
};

export default api;

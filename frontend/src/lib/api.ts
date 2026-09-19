import axios from 'axios';

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // Client-side fallback check
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // When running on deployed domains (like *.vercel.app) without an explicit API URL
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Return relative /api path so Next.js rewrites can proxy to backend
      return '/api';
    }
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

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
      if (error.response) {
        // Backend or proxy returned an error response (4xx, 5xx)
        const isVercelPrivateDns =
          error.response.status === 404 &&
          (error.response.headers?.['x-vercel-error'] === 'DNS_HOSTNAME_RESOLVED_PRIVATE' ||
           (typeof error.response.data === 'string' && error.response.data.includes('DNS_HOSTNAME_RESOLVED_PRIVATE')));

        let serverMessage = error.response.data?.message;
        if (!serverMessage) {
          if (isVercelPrivateDns) {
            serverMessage = 'Backend Not Connected: Vercel cannot reach http://127.0.0.1:5000. Please configure NEXT_PUBLIC_API_URL in Vercel Project Settings with your live HTTPS backend URL.';
          } else if (error.response.status === 404) {
            serverMessage = `Endpoint not found (404) at ${API_BASE_URL}${endpoint}. Please verify that the backend is online and NEXT_PUBLIC_API_URL is configured in Vercel.`;
          } else {
            serverMessage = `Request failed with status ${error.response.status}`;
          }
        }

        const err: any = new Error(serverMessage);
        err.status = error.response.status;
        err.code = isVercelPrivateDns ? 'DNS_HOSTNAME_RESOLVED_PRIVATE' : error.response.data?.code;
        err.response = error.response;
        throw err;
      } else if (error.request) {
        // No response received (offline, DNS failure, connection refused, CORS rejected, or mixed content blocked)
        const isMixedContent = typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:');
        let errorMsg = 'Unable to connect to the MediKiosk server. Please check your network connection or verify that the backend is online.';
        if (isMixedContent) {
          errorMsg = 'Security Error: HTTPS deployment cannot communicate with an insecure HTTP backend. Please configure NEXT_PUBLIC_API_URL in Vercel to a secure HTTPS backend endpoint.';
        }
        const err: any = new Error(errorMsg);
        err.isNetworkError = true;
        err.code = 'NETWORK_ERROR';
        throw err;
      } else {
        throw new Error(error.message || 'An unexpected request error occurred.');
      }
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

  // Departments & Clinical Mode
  async getDepartments() {
    return this.request('/departments');
  },

  async getDepartment(id: string) {
    return this.request(`/departments/${id}`);
  },

  // OPD Visit Lifecycle
  async createOpdVisit(data: { departmentId: string; preferredLanguage?: string; visitType?: string; opdType?: string; reasonForVisit?: string }) {
    return this.request('/opd/visits', { method: 'POST', data });
  },

  async getActiveOpdVisit() {
    return this.request('/opd/visits/active');
  },

  async getOpdVisits() {
    return this.request('/opd/visits');
  },

  async getOpdVisit(id: string) {
    return this.request(`/opd/visits/${id}`);
  },

  async updateOpdVisitStatus(id: string, status: string) {
    return this.request(`/opd/visits/${id}/status`, { method: 'PATCH', data: { status } });
  },

  // Consent
  async recordConsent(consentData: { opdVisitId?: string; purpose?: string; consentGiven?: boolean; version?: string; language?: string }) {
    return this.request('/consent', { method: 'POST', data: consentData });
  },

  async getPatientConsent(patientId: string) {
    return this.request(`/consent/patient/${patientId}`);
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

  async updateExtractedData(docId: string, updateData: { ocrText?: string; extractedData?: any; documentType?: string }) {
    return this.request(`/documents/${docId}/extracted-data`, {
      method: 'PATCH',
      data: updateData
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
  },

  // FHIR R4 Bundle Export
  async getPatientFhirBundle(patientId: string) {
    return this.request(`/patients/${patientId}/fhir-bundle`);
  },

  async getOpdVisitFhirBundle(visitId: string) {
    return this.request(`/opd/visits/${visitId}/fhir`);
  }
};

export default api;

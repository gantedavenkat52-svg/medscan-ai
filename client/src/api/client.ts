const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function getAuthToken(): string | null {
  return localStorage.getItem('medscan_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('medscan_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('medscan_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await response.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: () => request<any>('/auth/demo-login', { method: 'POST' }),
  getCurrentUser: () => request<any>('/auth/me'),

  // Profile
  getProfile: () => request<any>('/profile'),
  updateProfile: (data: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  exportHealthData: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/profile/export`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unable to export health data');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medscan_health_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  // Symptoms
  checkSymptoms: (data: any) => request<any>('/symptoms/check', { method: 'POST', body: JSON.stringify(data) }),
  getSymptomHistory: () => request<any[]>('/symptoms/history'),

  // Daily Reports
  saveDailyReport: (data: any) => request<any>('/daily-reports', { method: 'POST', body: JSON.stringify(data) }),
  getDailyReports: () => request<any[]>('/daily-reports'),
  getLatestDailyReport: () => request<any>('/daily-reports/latest'),

  // Lab Reports
  getSampleTemplates: () => request<any[]>('/lab-reports/samples'),
  analyzeSampleReport: (sampleId: string) => request<any>('/lab-reports/sample-analyze', { method: 'POST', body: JSON.stringify({ sampleId }) }),
  uploadLabReport: (formData: FormData) => request<any>('/lab-reports/upload', { method: 'POST', body: formData }),
  getLabReports: () => request<any[]>('/lab-reports'),
  getLabReportById: (id: string) => request<any>(`/lab-reports/${id}`),
  getMarkerTrends: () => request<any>('/lab-reports/trends/markers'),

  // Care
  searchDoctors: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/care/doctors?${query}`);
  },
  getDoctorAvailability: (doctorId: string) => request<any>(`/care/doctors/${doctorId}/availability`),
  getAppointments: () => request<any>('/care/appointments'),
  searchHospitals: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/care/hospitals?${query}`);
  },
  getCareRecommendations: (data: { conditions?: string[]; flaggedTests?: string[]; city?: string; urgent?: boolean }) =>
    request<any>('/care/recommendations', { method: 'POST', body: JSON.stringify(data) }),
  searchLabs: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/care/labs?${query}`);
  },
  requestAppointment: (data: any) => request<any>('/care/appointments/request', { method: 'POST', body: JSON.stringify(data) }),

  // Assistant
  askAssistant: (message: string) => request<any>('/assistant/ask', { method: 'POST', body: JSON.stringify({ message }) }),
  getAssistantHistory: () => request<any>('/assistant/history'),

  // Timeline
  getTimeline: (type?: string) => request<any[]>(`/timeline${type ? `?type=${type}` : ''}`),
  addTimelineEvent: (data: any) => request<any>('/timeline', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  addDoctor: (data: any) => request<any>('/admin/doctors', { method: 'POST', body: JSON.stringify(data) }),
  addHospital: (data: any) => request<any>('/admin/hospitals', { method: 'POST', body: JSON.stringify(data) }),
  addLab: (data: any) => request<any>('/admin/labs', { method: 'POST', body: JSON.stringify(data) })
};

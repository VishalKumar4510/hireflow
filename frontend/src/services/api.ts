export const getApiBaseUrl = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('hireflow_api_url')?.trim().replace(/\/+$/, '') : '';
  const env = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const base = custom || env || '/api';
  return base.endsWith('/api') ? base : `${base}/api`;
};

export const setApiBaseUrl = (url: string) => {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed) {
    localStorage.setItem('hireflow_api_url', trimmed);
  } else {
    localStorage.removeItem('hireflow_api_url');
  }
};

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('hireflow_token', token);
    } else {
      localStorage.removeItem('hireflow_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('hireflow_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const baseUrl = getApiBaseUrl();
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || '';
      throw new Error(
        `Cannot reach backend API at "${baseUrl}". If your backend is hosted on Render, verify it is running or set VITE_API_URL in Vercel settings. (${errorMsg})`
      );
    }

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 404) {
        throw new Error(
          `Backend endpoint not found (404) at "${baseUrl}${endpoint}". Please check your backend URL configuration.`
        );
      }
      throw new Error(errorData?.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const result = await this.request<{ token: string; recruiter: Record<string, unknown> }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async register(email: string, password: string, name: string) {
    const result = await this.request<{ token: string; recruiter: Record<string, unknown> }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(result.token);
    return result;
  }

  async getProfile() {
    return this.request<Record<string, unknown>>('/auth/profile');
  }

  // Dashboard
  async getDashboard() {
    return this.request<Record<string, unknown>>('/dashboard');
  }

  // Jobs
  async getJobs() {
    return this.request<Record<string, unknown>[]>('/jobs');
  }

  async getJob(id: string) {
    return this.request<Record<string, unknown>>(`/jobs/${id}`);
  }

  async createJob(data: { title: string; department: string; location: string; description: string }) {
    return this.request<Record<string, unknown>>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeJob(id: string) {
    return this.request<Record<string, unknown>>(`/jobs/${id}/analyze`, { method: 'POST' });
  }

  async updateRequirements(jobId: string, requirements: Record<string, unknown>[]) {
    return this.request<Record<string, unknown>[]>(`/jobs/${jobId}/requirements`, {
      method: 'PUT',
      body: JSON.stringify({ requirements }),
    });
  }

  async getRequirements(jobId: string) {
    return this.request<Record<string, unknown>[]>(`/jobs/${jobId}/requirements`);
  }

  async deleteJob(id: string) {
    return this.request<void>(`/jobs/${id}`, { method: 'DELETE' });
  }

  // Candidates
  async uploadResumes(jobId: string, files: File[], onProgress?: (pct: number) => void) {
    const formData = new FormData();
    files.forEach(f => formData.append('resumes', f));

    // Use XMLHttpRequest for progress tracking
    if (onProgress) {
      return new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${getApiBaseUrl()}/candidates/upload/${jobId}`);
        
        const token = this.getToken();
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
    }

    return this.request<Record<string, unknown>>(`/candidates/upload/${jobId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async getCandidatesForJob(jobId: string) {
    return this.request<Record<string, unknown>[]>(`/candidates/job/${jobId}`);
  }

  async getCandidate(id: string) {
    return this.request<Record<string, unknown>>(`/candidates/${id}`);
  }

  async mapEvidence(candidateId: string, jobId: string) {
    return this.request<Record<string, unknown>[]>(`/candidates/${candidateId}/map-evidence/${jobId}`, { method: 'POST' });
  }

  async getCandidateSummary(candidateId: string, jobId: string) {
    return this.request<Record<string, unknown>>(`/candidates/${candidateId}/summary/${jobId}`);
  }

  async groupCandidates(jobId: string) {
    return this.request<Record<string, unknown>[]>(`/candidates/group/${jobId}`, { method: 'POST' });
  }

  // Interviews
  async createInterviewSession(candidateId: string, jobId: string) {
    return this.request<Record<string, unknown>>('/interviews/session', {
      method: 'POST',
      body: JSON.stringify({ candidate_id: candidateId, job_id: jobId }),
    });
  }

  async getInterviewSession(id: string) {
    return this.request<Record<string, unknown>>(`/interviews/session/${id}`);
  }

  async generateQuestions(sessionId: string, focusAreas?: string[]) {
    return this.request<Record<string, unknown>[]>(`/interviews/session/${sessionId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ focus_areas: focusAreas }),
    });
  }

  async submitInterviewNotes(sessionId: string, notes: string) {
    return this.request<Record<string, unknown>>(`/interviews/session/${sessionId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async analyzeInterview(sessionId: string) {
    return this.request<Record<string, unknown>>(`/interviews/session/${sessionId}/analyze`, { method: 'POST' });
  }

  async generateEvaluation(sessionId: string) {
    return this.request<Record<string, unknown>>(`/interviews/session/${sessionId}/evaluate`, { method: 'POST' });
  }

  async getCandidateInterviews(candidateId: string) {
    return this.request<Record<string, unknown>[]>(`/interviews/candidate/${candidateId}`);
  }

  // Search
  async searchCandidates(query: string, jobId?: string, filters?: Record<string, unknown>) {
    return this.request<Record<string, unknown>[]>('/search', {
      method: 'POST',
      body: JSON.stringify({ query, job_id: jobId, filters }),
    });
  }

  // Audit
  async getAuditLogs(entityType: string, entityId: string) {
    return this.request<Record<string, unknown>[]>(`/audit/entity/${entityType}/${entityId}`);
  }

  async getRecentAuditLogs(limit?: number) {
    return this.request<Record<string, unknown>[]>(`/audit/recent?limit=${limit || 50}`);
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();

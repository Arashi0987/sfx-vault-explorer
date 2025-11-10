const API_BASE_URL = 'http://localhost:5000';

export interface SFXFile {
  id: number;
  filename: string;
  filepath: string;
  duration_seconds: number;
  length: string;
  tags: string[];
  notes: string;
  project: string;
  checksum: string;
  mtime: number;
  created_at: string;
  updated_at: string;
}

export interface SearchParams {
  q?: string;
  tags?: string[];
  project?: string;
}

export const api = {
  async getFiles(params?: SearchParams): Promise<SFXFile[]> {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.set('q', params.q);
    if (params?.tags?.length) queryParams.set('tags', params.tags.join(','));
    if (params?.project) queryParams.set('project', params.project);
    
    const url = `${API_BASE_URL}/api/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async getFile(id: number): Promise<SFXFile> {
    const response = await fetch(`${API_BASE_URL}/api/files/${id}`);
    if (!response.ok) throw new Error('Failed to fetch file');
    return response.json();
  },

  async updateNotes(id: number, notes: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/files/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error('Failed to update notes');
  },

  async addTags(id: number, tags: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/files/${id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    if (!response.ok) throw new Error('Failed to add tags');
  },

  async removeTags(id: number, tags: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/files/${id}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    if (!response.ok) throw new Error('Failed to remove tags');
  },

  async scanNow(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/scan_now`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to trigger scan');
  },

  async checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },
};

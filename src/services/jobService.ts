import api from "@/lib/api"; // Your existing API utility

export interface IJob {
  _id: string;
  name: string;
  description: string | object;
  long_description?: string | object;
  createdAt: string;
  updatedAt: string;
}

export const jobService = {
  // Get all jobs
  getAllJobs: async (search?: string, sortBy?: string, sortOrder?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    
    const response = await api.get(`/org/jobs?${params.toString()}`);
    return response.data;
  },

  // Get job by ID
  getJobById: async (id: string) => {
    const response = await api.get(`/org/jobs/${id}`);
    return response.data;
  },

  // Create new job
  createJob: async (jobData: Partial<IJob>) => {
    const response = await api.post('/org/jobs', jobData);
    return response.data;
  },

  // Update job
  updateJob: async (id: string, jobData: Partial<IJob>) => {
    const response = await api.put(`/org/jobs/${id}`, jobData);
    return response.data;
  },

  // Delete job
  deleteJob: async (id: string) => {
    const response = await api.delete(`/org/jobs/${id}`);
    return response.data;
  },

  // Delete multiple jobs
  deleteMultipleJobs: async (ids: string[]) => {
    const response = await api.delete('/org/jobs/bulk/delete', { data: { ids } });
    return response.data;
  },

  // Get jobs count
  getJobsCount: async (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await api.get(`/org/jobs/count?${params.toString()}`);
    return response.data;
  }
};

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createSchedule = async (tasks) => {
  const response = await api.post('/api/schedule', tasks);
  return response.data;
};

export const getPlan = async (planId) => {
  const response = await api.get(`/api/schedule/${planId}`);
  return response.data;
};

export const listPlans = async () => {
  const response = await api.get('/api/plans');
  return response.data;
};

export const downloadPlan = async (planId) => {
  const response = await api.get(`/api/download/${planId}`);
  return response.data;
};

export const deletePlan = async (planId) => {
  const response = await api.delete(`/api/schedule/${planId}`);
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;

import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('deadlock_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me')
};

export const processAPI = {
  getAll: () => API.get('/processes'),
  create: (data) => API.post('/processes', data),
  update: (id, data) => API.put(`/processes/${id}`, data),
  delete: (id) => API.delete(`/processes/${id}`)
};

export const resourceAPI = {
  getAll: () => API.get('/resources'),
  create: (data) => API.post('/resources', data),
  update: (id, data) => API.put(`/resources/${id}`, data),
  delete: (id) => API.delete(`/resources/${id}`)
};

export const deadlockAPI = {
  detect: (data) => API.post('/deadlock/detect', data),
  bankers: (data) => API.post('/deadlock/bankers', data),
  cycles: (data) => API.post('/deadlock/cycles', data),
  recover: (data) => API.post('/deadlock/recover', data)
};

export const simulationAPI = {
  getAll: () => API.get('/simulations'),
  getById: (id) => API.get(`/simulations/${id}`),
  create: (data) => API.post('/simulations', data),
  delete: (id) => API.delete(`/simulations/${id}`)
};

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
  getActivity: () => API.get('/dashboard/activity')
};

export const adminAPI = {
  getUsers: () => API.get('/admin/users'),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getSimulations: () => API.get('/admin/simulations')
};

export default API;

import axios from 'axios';

const API_BASE_URL = '/api';

const deviceConfigApi = {
  listMachines: () => axios.get(`${API_BASE_URL}/device-config/machines`),

  createMachine: (request) => axios.post(`${API_BASE_URL}/device-config/machines`, request),

  updateMachine: (id, request) => axios.put(`${API_BASE_URL}/device-config/machines/${id}`, request),

  deleteMachine: (id) => axios.delete(`${API_BASE_URL}/device-config/machines/${id}`),

  connect: (id) => axios.post(`${API_BASE_URL}/device-config/machines/${id}/connect`),

  disconnect: (id) => axios.post(`${API_BASE_URL}/device-config/machines/${id}/disconnect`),

  status: () => axios.get(`${API_BASE_URL}/device-config/status`),
};

export default deviceConfigApi;

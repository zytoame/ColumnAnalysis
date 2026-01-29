import service from './request';

const API_BASE_URL = '/api';

const deviceConfigApi = {
  listMachines: () => service.get(`/device-config/machines`),

  createMachine: (request) => service.post(`/device-config/machines`, request),

  updateMachine: (id, request) => service.put(`/device-config/machines/${id}`, request),

  deleteMachine: (id) => service.delete(`/device-config/machines/${id}`),

  connect: (id) => service.post(`/device-config/machines/${id}/connect`),

  disconnect: (id) => service.post(`/device-config/machines/${id}/disconnect`),

  status: () => service.get(`/device-config/status`),
};

export default deviceConfigApi;

import http from '../lib/http';

const deviceConfigApi = {
  listMachines: () => http.get(`/device-config/machines`),
  listDepartments: () => http.get(`/device-config/departments`),
  createMachine: (request) => http.post(`/device-config/machines`, request),

  updateMachine: (id, request) => http.put(`/device-config/machines/${id}`, request),

  deleteMachine: (id) => http.delete(`/device-config/machines/${id}`),

  connect: (id) => http.post(`/device-config/machines/${id}/connect`),

  disconnect: (id) => http.post(`/device-config/machines/${id}/disconnect`),

  status: () => http.get(`/device-config/status`),
};

export default deviceConfigApi;

import axios from 'axios';

const API_BASE_URL = '/api';

const signatureSettingsApi = {
  getSettings: () => axios.get(`/signature-settings`),

  updateSettings: (request) => axios.post(`/signature-settings`, request),

  uploadEnglishSignature: (role, file) => {
    const formData = new FormData();
    formData.append('role', role);
    formData.append('file', file);
    return axios.post(`/signature-settings/signature-en`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default signatureSettingsApi;

import axios from 'axios';

const API_BASE_URL = '/api';

const signatureSettingsApi = {
  getSettings: () => axios.get(`${API_BASE_URL}/signature-settings`),

  updateSettings: (request) => axios.post(`${API_BASE_URL}/signature-settings`, request),
};

export default signatureSettingsApi;

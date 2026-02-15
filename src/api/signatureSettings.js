import http from '../lib/http';

const signatureSettingsApi = {
  getSettings: () => http.get(`/signature-settings`),
  saveSettings: (data) => http.post(`/signature-settings`, data),
  updateSettings: (data) => http.post(`/signature-settings`, data),

  uploadEnglishSignature: (role, file) => {
    const formData = new FormData();
    formData.append('role', role);
    formData.append('file', file);
    return http.post(`/signature-settings/signature-en`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default signatureSettingsApi;

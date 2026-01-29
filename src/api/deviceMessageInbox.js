import service from './request';

const API_BASE_URL = '/api';

function getAuthHeader() {
  const raw =
    window?.localStorage?.getItem('token') ||
    window?.sessionStorage?.getItem('token') ||
    window?.localStorage?.getItem('jwt') ||
    window?.sessionStorage?.getItem('jwt') ||
    '';
  const token = String(raw || '').trim();
  if (!token) return {};
  return {
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };
}

const deviceMessageInboxApi = {
  search: (params) =>
    service.get(`/system/device-message-inbox/search`, {
      params,
      headers: getAuthHeader(),
    }),

  repair: (request) =>
    service.post(`/system/device-message-inbox/repair`, request, {
      headers: getAuthHeader(),
    }),

  save: (request) =>
    service.post(`/system/device-message-inbox/save`, request, {
      headers: getAuthHeader(),
    }),
};

export default deviceMessageInboxApi;

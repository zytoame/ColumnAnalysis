import http from '../lib/http';

const deviceMessageInboxApi = {
  search: (params) =>
    http.get(`/system/device-message-inbox/search`, {
      params,
    }),

  save: (request) =>
    http.post(`/system/device-message-inbox/save`, request, {
    }),

  checkColumnSn: (request) =>
    http.post(`/system/device-message-inbox/check-column-sn`, request, {
    }),
};

export default deviceMessageInboxApi;

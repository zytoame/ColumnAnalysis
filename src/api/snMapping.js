import http from '../lib/http';

const snMappingApi = {
  importXlsx: (file) => {
    const form = new FormData();
    form.append('file', file);

    return http
      .post(`/sn-mapping/import`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => response.data);
  },

  getUnmatchedMappings: ({ pageNum = 1, pageSize = 10, batchId, all, keyword } = {}) =>
    http
      .get(`/sn-mapping/unmatched`, {
        params: { pageNum, pageSize, batchId, all, keyword },
      })
      .then((response) => response.data),
};

export default snMappingApi;

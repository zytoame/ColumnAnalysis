import axios from 'axios';

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

const snMappingApi = {
  importXlsx: (file) => {
    const form = new FormData();
    form.append('file', file);

    return axios
      .post(`${API_BASE_URL}/sn-mapping/import`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeader(),
        },
      })
      .then((response) => response.data);
  },
};

export default snMappingApi;

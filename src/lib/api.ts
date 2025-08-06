import axios from "axios";

let isRefreshing = false;
let failedQueue: (() => void)[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((cb) => cb());
  failedQueue = [];
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  withCredentials: true,
  headers: {
    "x-client-type": "web",
  },
});

// Helper function to determine auth type based on current route
const getAuthType = () => {
  const currentPath = window.location.pathname;
  return currentPath.startsWith('/org') ? 'org' : 'candidate';
};

// Helper function to get refresh endpoint based on auth type
const getRefreshEndpoint = (authType: 'org' | 'candidate') => {
  return authType === 'org' 
    ? `${api.defaults.baseURL}/org/refresh-token`
    : `${api.defaults.baseURL}/candidates/refresh-token`;
};

// Helper function to get redirect path based on auth type
const getLoginPath = (authType: 'org' | 'candidate') => {
  return authType === 'org' ? '/org/login' : '/login';
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push(() => {
            api(originalRequest).then(resolve).catch(reject);
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authType = getAuthType();
        const refreshEndpoint = getRefreshEndpoint(authType);
        
        await axios.get(refreshEndpoint, {
          withCredentials: true,
          headers: {
            "x-client-type": "web",
          },
        });

        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err);
        const authType = getAuthType();
        window.location.href = getLoginPath(authType);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

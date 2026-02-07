import axios from 'axios';

export const applyInterceptors = (
  axiosInstance: ReturnType<typeof axios.create>,
): void => {
  axiosInstance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error),
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error),
  );
};

import axios, {
  type AxiosResponse,
  type AxiosStatic,
  type InternalAxiosRequestConfig,
} from 'axios';

export interface createRequestOption {
  axiosRequest?: AxiosStatic;
  baseURL: string;
  timeout: number;
  requestInterceptor?: (config: InternalAxiosRequestConfig<any>) => void;
  requestErrorInterceptor?: (error: any) => void;
  responseInterceptor?: (response: AxiosResponse) => any;
  responseErrorInterceptor?: (error: any) => void;
}

export const createRequest = (option: createRequestOption) => {
  const instance = (option?.axiosRequest || axios).create({
    baseURL: option?.baseURL,
    timeout: option?.timeout,
  });

  instance.interceptors.request.use(
    (config) => {
      option?.requestInterceptor?.(config);
      return config;
    },
    (error) => {
      if (option?.requestErrorInterceptor) {
        option?.requestErrorInterceptor?.(error);
      }
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => {
      if (option?.responseInterceptor) {
        const result = option?.responseInterceptor?.(response);
        return result;
      }
      return response;
    },
    (error) => {
      if (option?.responseErrorInterceptor) {
        option?.responseErrorInterceptor?.(error);
      }
      return Promise.reject(error);
    },
  );
  return instance;
};

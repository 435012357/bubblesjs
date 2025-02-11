import { createRequest } from './axios';

interface statusMap {
  success: number;
  unAuthorized: number;
}

interface codeMap {
  success: number[];
  unAuthorized: number[];
}

interface getRequestOption {
  baseUrl?: string;
  timeout?: number;
  commonHeaders?: Record<string, string | (() => string)>;
  requestErrorInterceptor?: (error: any) => void;
  responseErrorInterceptor?: (error: any) => void;
  successMessageFunc?: (message: string) => void;
  errorMessageFunc?: (message: string) => void;
  unAuthorizedResponseFunc?: (message: string) => void;
  statusMap: statusMap;
  codeMap: codeMap;
  responseDataKey?: string;
  responseMessageKey?: string;
  isTransformResponse?: boolean;
  isShowSuccessMessage?: boolean;
}

const getRequest = (option: getRequestOption) => {
  const responseDataKey = option?.responseDataKey ?? 'data';
  const responseMessageKey = option?.responseMessageKey ?? 'message';
  const isTransformResponse = option?.isTransformResponse ?? true;
  const isShowSuccessMessage = option?.isShowSuccessMessage ?? true;
  const request = createRequest({
    baseURL: option?.baseUrl ?? '/',
    timeout: option?.timeout ?? 0,
    requestInterceptor: (config) => {
      for (const [key, value] of Object.entries(option?.commonHeaders ?? {})) {
        config.headers.set(key, typeof value === 'function' ? value() : value);
      }
    },
    requestErrorInterceptor: (error) => {
      option?.errorMessageFunc?.('请求错误');
    },
    responseInterceptor: (response) => {
      if (!isTransformResponse) return response;
      const { status, data } = response;
      if (status === option.statusMap.success) {
        const { code, [responseDataKey]: responseData } = data;
        if (option.codeMap.success.includes(code)) {
          if (isShowSuccessMessage)
            option?.successMessageFunc?.(data?.[responseMessageKey] || '操作成功');
          return responseData;
        }
        if (option.codeMap.unAuthorized.includes(code)) {
          option?.unAuthorizedResponseFunc?.(data[responseMessageKey]);
          return Promise.reject(response);
        }
        return Promise.reject(data);
      }
      return Promise.reject(response);
    },
    responseErrorInterceptor: (error) => {
      if (error?.response?.status === option?.statusMap?.unAuthorized) {
        option?.unAuthorizedResponseFunc?.(error?.response?.data?.[responseMessageKey]);
      }
      option?.errorMessageFunc?.(`服务器错误：${error?.response?.data?.[responseMessageKey]}`);
    },
  });
  return request;
};

export default getRequest;

import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { RootState } from '../index';
import apiClient from '../../services/api/apiClient';
import { recordApiCall } from '../slices/performanceSlice';

// Action types
export const API_REQUEST = 'api/request';
export const API_SUCCESS = 'api/success';
export const API_ERROR = 'api/error';

// Interface for API request action
export interface ApiRequestAction {
  type: typeof API_REQUEST;
  payload: {
    url: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    data?: any;
    params?: any;
    onSuccess?: string;
    onError?: string;
    meta?: any;
  };
}

// Action creators
export const apiRequest = (
  url: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  data?: any,
  params?: any,
  onSuccess?: string,
  onError?: string,
  meta?: any
): ApiRequestAction => ({
  type: API_REQUEST,
  payload: {
    url,
    method,
    data,
    params,
    onSuccess,
    onError,
    meta,
  },
});

export const apiSuccess = (response: any, meta: any, originalAction: ApiRequestAction) => ({
  type: API_SUCCESS,
  payload: {
    response,
    meta,
  },
  meta: {
    originalAction,
  },
});

export const apiError = (error: any, meta: any, originalAction: ApiRequestAction) => ({
  type: API_ERROR,
  payload: {
    error,
    meta,
  },
  meta: {
    originalAction,
  },
});

/**
 * API Middleware
 * 
 * This middleware intercepts API_REQUEST actions and makes API calls using the apiClient.
 * It dispatches success or error actions based on the result of the API call.
 * It also records API performance metrics.
 */
export const apiMiddleware: Middleware = (api: MiddlewareAPI<Dispatch, RootState>) => (next: Dispatch) => async (action: AnyAction) => {
  // Pass non-API actions to the next middleware
  if (action.type !== API_REQUEST) {
    return next(action);
  }
  
  // Extract API request details
  const { url, method, data, params, onSuccess, onError, meta } = action.payload;
  
  // Pass the action to the next middleware
  next(action);
  
  try {
    // Record start time for performance tracking
    const startTime = performance.now();
    
    // Make the API call
    let response;
    switch (method) {
      case 'get':
        response = await apiClient.get(url, { params });
        break;
      case 'post':
        response = await apiClient.post(url, data, { params });
        break;
      case 'put':
        response = await apiClient.put(url, data, { params });
        break;
      case 'patch':
        response = await apiClient.patch(url, data, { params });
        break;
      case 'delete':
        response = await apiClient.delete(url, { params });
        break;
      default:
        throw new Error(`Unsupported API method: ${method}`);
    }
    
    // Calculate response time
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Record API call performance
    api.dispatch(recordApiCall({
      endpoint: url,
      method,
      responseTime,
      success: true,
    }) as any);
    
    // Dispatch success action
    api.dispatch(apiSuccess(response, meta, action as ApiRequestAction));
    
    // Dispatch additional success action if specified
    if (onSuccess) {
      api.dispatch({
        type: onSuccess,
        payload: response,
        meta,
      });
    }
    
    return response;
  } catch (error: any) {
    // Calculate response time for failed request
    const endTime = performance.now();
    const responseTime = performance.now() - endTime;
    
    // Record API call performance
    api.dispatch(recordApiCall({
      endpoint: url,
      method,
      responseTime,
      success: false,
    }) as any);
    
    // Dispatch error action
    api.dispatch(apiError(error, meta, action as ApiRequestAction));
    
    // Dispatch additional error action if specified
    if (onError) {
      api.dispatch({
        type: onError,
        payload: error,
        meta,
      });
    }
    
    throw error;
  }
};

export default apiMiddleware;
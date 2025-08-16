import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { store } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { addNotification, setLoading } from '../../store/slices/uiSlice';

// Define base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ninjatech-trading.com/v1';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Get auth token from store or localStorage
    const token = localStorage.getItem('auth_token');
    
    // Set loading state for the specific request
    const requestId = `${config.method}-${config.url}`;
    store.dispatch(setLoading({ key: requestId, isLoading: true }));
    
    // Add auth token to headers if available
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Clear loading state
    const requestId = `${response.config.method}-${response.config.url}`;
    store.dispatch(setLoading({ key: requestId, isLoading: false }));
    
    return response;
  },
  (error: AxiosError) => {
    // Clear loading state
    if (error.config) {
      const requestId = `${error.config.method}-${error.config.url}`;
      store.dispatch(setLoading({ key: requestId, isLoading: false }));
    }
    
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        // Logout user on auth error
        store.dispatch(logout());
        
        // Show notification
        store.dispatch(addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Your session has expired. Please log in again.',
          autoHideDuration: 5000,
        }));
      }
      
      // Handle server errors
      else if (status >= 500) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          autoHideDuration: 5000,
        }));
      }
      
      // Handle validation errors
      else if (status === 422 && data) {
        const errorMessage = data.message || 'Validation failed. Please check your input.';
        
        store.dispatch(addNotification({
          type: 'error',
          title: 'Validation Error',
          message: errorMessage,
          autoHideDuration: 5000,
        }));
      }
    }
    // Handle network errors
    else if (error.request) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        autoHideDuration: 5000,
      }));
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Client for making HTTP requests
 */
class ApiClient {
  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  }
  
  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  }
  
  /**
   * Upload a file
   */
  async uploadFile<T = any>(url: string, file: File, fieldName: string = 'file', config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const uploadConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    };
    
    const response = await axiosInstance.post<T>(url, formData, uploadConfig);
    return response.data;
  }
  
  /**
   * Download a file
   */
  async downloadFile(url: string, filename?: string, config?: AxiosRequestConfig): Promise<Blob> {
    const downloadConfig: AxiosRequestConfig = {
      responseType: 'blob',
      ...config,
    };
    
    const response = await axiosInstance.get(url, downloadConfig);
    
    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || this.getFilenameFromResponse(response) || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return response.data;
  }
  
  /**
   * Extract filename from response headers
   */
  private getFilenameFromResponse(response: AxiosResponse): string | null {
    const contentDisposition = response.headers['content-disposition'];
    
    if (!contentDisposition) {
      return null;
    }
    
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    return filenameMatch ? filenameMatch[1] : null;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
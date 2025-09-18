// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
};

// Helper function to make API calls with proper URL
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // In development, use localhost
  if (import.meta.env.DEV) {
    return `http://localhost:5000/${cleanEndpoint}`;
  }
  
  // In production, use environment variable or relative URL
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return baseUrl ? `${baseUrl}/${cleanEndpoint}` : `/${cleanEndpoint}`;
}

export default apiConfig;
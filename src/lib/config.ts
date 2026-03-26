/**
 * Get the API URL for backend calls
 */
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

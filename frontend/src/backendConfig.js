// Application APIs have their own origin; weather is an independent service.
export const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || '').replace(/\/$/, '');

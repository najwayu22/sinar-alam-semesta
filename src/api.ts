// API Base URL — otomatis detect environment:
// - Development (localhost): kosong → relative URL
// - Production (Netlify): diisi via env var VITE_API_URL → URL backend Render.com
export const API_BASE = import.meta.env.VITE_API_URL || '';

// In local dev (vite dev server on :5173), the backend runs separately on :4000.
// In production on Vercel, both services share one domain and /api is routed to
// the backend service via vercel.json rewrites — so a relative path just works
// and there's no CORS to think about.
export const API = import.meta.env.DEV ? "http://localhost:4000/api" : "/api";

import 'zone.js';

// SockJS/CommonJS browser compatibility shims.
(globalThis as any).global = globalThis;
(globalThis as any).process = (globalThis as any).process ?? { env: {} };

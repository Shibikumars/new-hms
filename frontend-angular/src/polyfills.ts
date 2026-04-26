import 'zone.js';

// SockJS/CommonJS browser compatibility shims.
(globalThis as any).global = globalThis;
(globalThis as any).process = (globalThis as any).process ?? { env: {} };

// Additional polyfill for karma testing environment
if (typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

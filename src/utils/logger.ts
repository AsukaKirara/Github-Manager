export const DEBUG_LOGGING = typeof import.meta !== 'undefined' &&
  ((import.meta as any).env?.VITE_DEBUG_LOG === 'true' ||
   (import.meta as any).env?.MODE !== 'production');

export function debugLog(...args: any[]) {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
}

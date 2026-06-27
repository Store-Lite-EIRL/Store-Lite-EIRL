/**
 * culqiScript.ts
 *
 * Shared Culqi Checkout v4 script loader.
 * Single promise-cached load function used by all callers.
 */

const CULQI_SCRIPT_ID = 'culqi-checkout-v4-js';
const CULQI_SCRIPT_URL = 'https://checkout.culqi.com/js/v4';

/** Module-level promise cache — ensures the script is loaded exactly once. */
let loadingPromise: Promise<void> | null = null;

/**
 * Loads the Culqi Checkout v4 script into the document.
 * - If `window.Culqi` already exists, resolves immediately (just updates publicKey).
 * - If the script is already loading (concurrent calls), returns the same promise.
 * - If the script fails to load, rejects with an error.
 *
 * @param publicKey - The Culqi public key to set on window.Culqi.
 */
export function loadCulqiScript(publicKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadCulqiScript must be called in a browser context'));
  }

  // Already loaded — just update the public key and resolve
  if (window.Culqi) {
    window.Culqi.publicKey = publicKey;
    return Promise.resolve();
  }

  // Already loading — chain publicKey setter on the cached promise
  if (loadingPromise) {
    return loadingPromise
      .then(() => {
        if (window.Culqi) {
          window.Culqi.publicKey = publicKey;
        }
      })
      .catch(() => {
        // Script already failed to load earlier — nothing to do
      });
  }

  loadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = CULQI_SCRIPT_ID;
    script.src = CULQI_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      if (window.Culqi) {
        window.Culqi.publicKey = publicKey;
      }
      loadingPromise = null;
      resolve();
    };

    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Failed to load Culqi script'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

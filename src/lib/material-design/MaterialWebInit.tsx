'use client';

import { useEffect } from 'react';

/**
 * MaterialWebInit handles the global registration of Material Design 3 Web Components.
 * 
 * We use a conditional dynamic import strategy to prevent 'CustomElementRegistry' 
 * duplication warnings during development (HMR).
 */
export function MaterialWebInit() {
  useEffect(() => {
    // Check if a core MD3 element is already registered to avoid redundant registration
    if (typeof window !== 'undefined' && !customElements.get('md-focus-ring')) {
      const initMaterial = async () => {
        try {
          // Dynamic imports avoid top-level static registration which triggers 
          // warnings when the module re-executes during Hot Module Replacement.
          await Promise.all([
            import('@material/web/all.js'),
            import('@material/web/labs/segmentedbutton/outlined-segmented-button.js'),
            import('@material/web/labs/segmentedbuttonset/outlined-segmented-button-set.js'),
          ]);
        } catch (error) {
          console.error('Failed to initialize Material Web Components:', error);
        }
      };

      initMaterial();
    }
  }, []);

  return null;
}

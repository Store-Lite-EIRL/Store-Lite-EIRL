// src/types/reactJsx.d.ts
import type { JSX as ReactJSX } from 'react';

declare module 'react' {
  namespace JSX {
     
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {
       
      [elemName: string]: unknown;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
     
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {
       
      [elemName: string]: unknown;
    }
  }
}

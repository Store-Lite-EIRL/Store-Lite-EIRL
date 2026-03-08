// src/types/jsx.d.ts
export { };

declare global {
  namespace JSX {
    type IntrinsicElements = Record<string, unknown>;
  }
}

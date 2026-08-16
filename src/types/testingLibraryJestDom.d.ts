// Augment vitest's Assertion interface with jest-dom matchers
// (toBeInTheDocument, toHaveAttribute, toHaveClass, etc.).
// The base '@testing-library/jest-dom' entry augments jest globals only;
// vitest requires the '/vitest' entry for correct matcher typing.
import '@testing-library/jest-dom/vitest';

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Ant Design / responsiveObserver needs matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Some UI libs call getComputedStyle with pseudo-elements
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  // jsdom throws for pseudo-elements; ignore them
  if (pseudoElt) {
    return originalGetComputedStyle(elt);
  }
  return originalGetComputedStyle(elt);
};

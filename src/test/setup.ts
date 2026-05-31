import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn();
}

const originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element: Element, pseudo?: string | null) => {
  const style = originalGetComputedStyle(element, pseudo);
  if (!style.transform) {
    Object.defineProperty(style, 'transform', {
      configurable: true,
      value: 'matrix(1, 0, 0, 1, 0, 0)',
    });
  }
  return style;
};

afterEach(() => {
  cleanup();
});

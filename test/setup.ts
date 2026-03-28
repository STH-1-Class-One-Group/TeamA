import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0),
  });

  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: (handle: number) => window.clearTimeout(handle),
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:preview'),
  });

  Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });

  class IntersectionObserverMock {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0];
  }

  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
});

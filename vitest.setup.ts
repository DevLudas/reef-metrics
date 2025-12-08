import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Extend vitest matchers
expect.extend({});

// Mock environment variables if needed
vi.stubGlobal("import", {
  meta: {
    env: {
      PUBLIC_SUPABASE_URL: "http://localhost:54321",
      PUBLIC_SUPABASE_ANON_KEY: "test-key",
    },
  },
} as Record<string, unknown>);

// Mock window.matchMedia for Tailwind/responsive tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  disconnect(): void {
    // Mock implementation
  }

  observe(): void {
    // Mock implementation
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(): void {
    // Mock implementation
  }
} as unknown as typeof IntersectionObserver;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

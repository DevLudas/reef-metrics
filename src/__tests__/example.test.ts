import { describe, it, expect } from "vitest";

describe("Example Unit Tests", () => {
  describe("Basic Math", () => {
    it("should add two numbers", () => {
      expect(1 + 2).toBe(3);
    });

    it("should subtract two numbers", () => {
      expect(5 - 3).toBe(2);
    });
  });

  describe("String operations", () => {
    it("should uppercase a string", () => {
      const str = "hello";
      expect(str.toUpperCase()).toBe("HELLO");
    });

    it("should trim whitespace", () => {
      const str = "  hello  ";
      expect(str.trim()).toBe("hello");
    });
  });
});

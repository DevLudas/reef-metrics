import { describe, it, expect } from "vitest";
import { calculateStatus, calculateDeviation } from "@/lib/utils/parameter-status";

describe("Parameter Status Utils", () => {
  describe("calculateStatus", () => {
    it("should return no_data when current value is null", () => {
      const result = calculateStatus(null, 1.02, 1.03);
      expect(result.status).toBe("no_data");
      expect(result.deviationPercentage).toBeNull();
    });

    it("should return normal status when value is within optimal range", () => {
      const result = calculateStatus(1.025, 1.02, 1.03);
      expect(result.status).toBe("normal");
      expect(result.deviationPercentage).toBe(0);
    });

    it("should return normal status when deviation is less than 10%", () => {
      const result = calculateStatus(1.03, 1.02, 1.04);
      expect(result.status).toBe("normal");
      expect(result.deviationPercentage).toBeLessThan(10);
    });

    it("should return warning status when deviation is 10% or more but less than 20%", () => {
      const result = calculateStatus(0.85, 1.0, 1.1);
      expect(result.status).toBe("warning");
      expect(result.deviationPercentage).toBeGreaterThanOrEqual(10);
      expect(result.deviationPercentage).toBeLessThan(20);
    });

    it("should return critical status when deviation is 20% or more", () => {
      const result = calculateStatus(0.75, 1.0, 1.1);
      expect(result.status).toBe("critical");
      expect(result.deviationPercentage).toBeGreaterThanOrEqual(20);
    });

    it("should handle edge case at 10% deviation boundary", () => {
      // Exactly at the boundary between normal and warning
      const optimalMin = 1.0;
      const optimalMax = 1.1;
      // A value that's slightly more than 10% below min: x = 0.8999
      // (1.0 - 0.8999) / 1.0 * 100 = 10.01%
      const currentValue = 0.8999;
      const result = calculateStatus(currentValue, optimalMin, optimalMax);

      expect(result.status).toBe("warning");
      expect(result.deviationPercentage).toBeGreaterThanOrEqual(10);
    });

    it("should handle edge case at 20% deviation boundary", () => {
      const optimalMin = 1.0;
      const optimalMax = 1.1;
      // A value that's slightly more than 20% below min: x = 0.7999
      // (1.0 - 0.7999) / 1.0 * 100 = 20.01%
      const currentValue = 0.7999;
      const result = calculateStatus(currentValue, optimalMin, optimalMax);

      expect(result.status).toBe("critical");
      expect(result.deviationPercentage).toBeGreaterThanOrEqual(20);
    });

    it("should handle very high deviations", () => {
      const result = calculateStatus(0.1, 1.0, 1.1);
      expect(result.status).toBe("critical");
      expect(result.deviationPercentage).toBeGreaterThan(80);
    });

    it("should handle value above optimal range", () => {
      const result = calculateStatus(1.5, 1.0, 1.1);
      expect(result.status).toBe("critical");
      expect(result.deviationPercentage).toBeGreaterThan(20);
    });

    it("should handle zero values", () => {
      const result = calculateStatus(0, 1.0, 2.0);
      expect(result.status).toBe("critical");
      expect(result.deviationPercentage).toBeGreaterThan(0);
    });

    it("should handle negative values", () => {
      const result = calculateStatus(-1.0, 0, 10);
      expect(result.status).toBe("critical");
      expect(result.deviationPercentage).toBeGreaterThan(0);
    });
  });

  describe("calculateDeviation", () => {
    it("should return 0 when value is within range", () => {
      const deviation = calculateDeviation(5, 3, 7);
      expect(deviation).toBe(0);
    });

    it("should return 0 when value equals min", () => {
      const deviation = calculateDeviation(3, 3, 7);
      expect(deviation).toBe(0);
    });

    it("should return 0 when value equals max", () => {
      const deviation = calculateDeviation(7, 3, 7);
      expect(deviation).toBe(0);
    });

    it("should calculate deviation for value below min", () => {
      const deviation = calculateDeviation(2, 3, 7);
      // ((3 - 2) / 3) * 100 = 33.33%
      expect(deviation).toBeCloseTo(33.33, 1);
    });

    it("should calculate deviation for value above max", () => {
      const deviation = calculateDeviation(10, 3, 7);
      // ((10 - 7) / 7) * 100 = 42.86%
      expect(deviation).toBeCloseTo(42.86, 1);
    });

    it("should handle very small ranges", () => {
      const deviation = calculateDeviation(1.026, 1.02, 1.025);
      expect(deviation).toBeGreaterThan(0);
      expect(deviation).toBeLessThan(10);
    });

    it("should handle large values", () => {
      const deviation = calculateDeviation(5000, 1000, 9000);
      expect(deviation).toBe(0);
    });

    it("should handle decimal precision", () => {
      const deviation = calculateDeviation(1.0305, 1.02, 1.03);
      expect(deviation).toBeCloseTo(0.049, 2);
    });
  });
});

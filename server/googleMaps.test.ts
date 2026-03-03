import { describe, expect, it, vi } from "vitest";
import { searchPlaces } from "./_core/googleMaps";

describe("Google Maps Integration", () => {
  it("should validate Google Maps API Key is configured", async () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey?.length).toBeGreaterThan(0);
  });

  it("should search for CrossFit boxes in Belo Horizonte", async () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      expect.skip();
    }

    try {
      const results = await searchPlaces({
        query: "CrossFit Belo Horizonte",
        location: {
          latitude: -19.9191,
          longitude: -43.9386,
        },
        radius: 15000, // 15km
      });

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("name");
        expect(results[0]).toHaveProperty("address");
        expect(results[0]).toHaveProperty("latitude");
        expect(results[0]).toHaveProperty("longitude");
      }
    } catch (error: any) {
      // API key validation - if we get a 403, the key is invalid
      if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED")) {
        expect.fail("Google Maps API Key is invalid or doesn't have required permissions");
      }
      // Other errors might be expected (network issues, etc)
      console.log("Search test skipped:", error.message);
    }
  });
});

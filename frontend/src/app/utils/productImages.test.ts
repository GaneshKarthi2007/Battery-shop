import { describe, it, expect } from "vitest";
import { getBrandProductImage } from "./productImages";

describe("getBrandProductImage", () => {
  it("returns brand-specific internet URLs for Exide, Amaron, Luminous, Livguard, Okaya, and SF Sonic", () => {
    const exideCar = getBrandProductImage("Exide", "Car");
    const exideInv = getBrandProductImage("Exide", "Inverter");
    const amaronCar = getBrandProductImage("Amaron", "Car");
    const luminousInv = getBrandProductImage("Luminous", "Inverter");
    const livguardInv = getBrandProductImage("Livguard", "Inverter");
    const okayaInv = getBrandProductImage("Okaya", "Inverter");
    const sfSonic = getBrandProductImage("SF Sonic", "Car");

    expect(exideCar).toMatch(/^https:\/\//);
    expect(exideInv).toMatch(/^https:\/\//);
    expect(exideCar).not.toBe(exideInv);
    expect(amaronCar).not.toBe(exideCar);
    expect(luminousInv).not.toBe(livguardInv);
    expect(okayaInv).toMatch(/^https:\/\//);
    expect(sfSonic).toMatch(/^https:\/\//);
  });

  it("falls back to generic Wikimedia battery images for unknown brands", () => {
    expect(getBrandProductImage("UnknownBrand", "Car")).toContain("Car_battery.jpg");
    expect(getBrandProductImage("UnknownBrand", "Inverter")).toContain("Inverter_battery");
  });
});

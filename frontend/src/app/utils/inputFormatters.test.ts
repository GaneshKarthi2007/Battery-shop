import { describe, it, expect } from "vitest";
import {
  normalizeMobile10,
  isValidMobile10,
  capitalizeEachWord,
  capitalizeFirstLetter,
} from "./inputFormatters";

describe("inputFormatters", () => {
  it("validates and normalizes 10-digit mobile numbers", () => {
    expect(normalizeMobile10("9876543210")).toBe("9876543210");
    expect(normalizeMobile10("+91 98765 43210")).toBe("9876543210");
    expect(normalizeMobile10("09876543210")).toBe("9876543210");

    expect(isValidMobile10("9876543210")).toBe(true);
    expect(isValidMobile10("+91 98765 43210")).toBe(true);
    expect(isValidMobile10("12345")).toBe(false);
    expect(isValidMobile10("9876543210123")).toBe(false);
  });

  it("capitalizes customer names and first letter of general inputs", () => {
    expect(capitalizeEachWord("ganesh kumar")).toBe("Ganesh Kumar");
    expect(capitalizeEachWord("SMR")).toBe("SMR");
    expect(capitalizeFirstLetter("near temple street")).toBe("Near temple street");
  });
});

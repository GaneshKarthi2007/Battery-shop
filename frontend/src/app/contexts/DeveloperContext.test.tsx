import "@testing-library/jest-dom";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import {
    DeveloperProvider,
    useDeveloper,
    useServiceLogIdPrefix,
    formatServiceLogId,
    sanitizeServiceLogIdPrefix,
} from "./DeveloperContext";

describe("Service Log ID prefix helpers", () => {
    it("formatServiceLogId joins prefix and id", () => {
        expect(formatServiceLogId("SRV-", 12)).toBe("SRV-12");
        expect(formatServiceLogId("", "12")).toBe("12");
        expect(formatServiceLogId(undefined, 5)).toBe("5");
        expect(formatServiceLogId("X", null)).toBe("X");
    });

    it("sanitizeServiceLogIdPrefix strips unsupported characters and caps length", () => {
        expect(sanitizeServiceLogIdPrefix(" srv - ")).toBe("srv-");
        expect(sanitizeServiceLogIdPrefix("A/B_#1")).toBe("A/B_#1");
        expect(sanitizeServiceLogIdPrefix("ABCDEFGHIJKLMNOP")).toHaveLength(10);
        expect(sanitizeServiceLogIdPrefix("a b!@$%^&*()")).toBe("ab");
    });
});

describe("DeveloperProvider serviceLogIdPrefix", () => {
    beforeEach(() => localStorage.clear());

    it("defaults to an empty prefix and persists updates to localStorage", () => {
        const { result } = renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("");

        act(() => result.current.updateShopConfig({ serviceLogIdPrefix: "srv-!" }));
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("srv-");

        const saved = JSON.parse(localStorage.getItem("developer_shop_config") || "{}");
        expect(saved.serviceLogIdPrefix).toBe("srv-");
    });

    it("fills in a default prefix for older saved configs that lack the key", () => {
        localStorage.setItem("developer_shop_config", JSON.stringify({ name: "Old Shop" }));
        const { result } = renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });
        expect(result.current.shopConfig.name).toBe("Old Shop");
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("");
    });

    it("useServiceLogIdPrefix returns the configured prefix, or empty string without a provider", () => {
        const noProvider = renderHook(() => useServiceLogIdPrefix());
        expect(noProvider.result.current).toBe("");

        localStorage.setItem("developer_shop_config", JSON.stringify({ serviceLogIdPrefix: "SRV-" }));
        const withProvider = renderHook(() => useServiceLogIdPrefix(), { wrapper: DeveloperProvider });
        expect(withProvider.result.current).toBe("SRV-");
    });
});

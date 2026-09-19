import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useNetworkSpeed, reportApiLatency } from "./useNetworkSpeed";

describe("useNetworkSpeed hook", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns default fast network speed metrics when online", () => {
        const { result } = renderHook(() => useNetworkSpeed());

        expect(result.current.isOnline).toBe(true);
        expect(result.current.connectionTier).toBe("fast");
        expect(result.current.spinDuration).toBe(0.6);
        expect(result.current.speedMbps).toBeGreaterThan(0);
    });

    it("updates latency and speed tier when reportApiLatency is invoked", () => {
        const { result } = renderHook(() => useNetworkSpeed());

        act(() => {
            reportApiLatency(450); // Slow latency (450ms)
        });

        expect(result.current.pingMs).toBeGreaterThan(100);
    });

    it("switches to slow tier and slow spinDuration when offline", () => {
        const { result } = renderHook(() => useNetworkSpeed());

        act(() => {
            window.dispatchEvent(new Event("offline"));
        });

        expect(result.current.isOnline).toBe(false);
        expect(result.current.connectionTier).toBe("slow");
        expect(result.current.spinDuration).toBe(2.0);
    });
});

import "@testing-library/jest-dom";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeveloperProvider, useDeveloper, settingsToShopConfig, shopConfigToSettings } from "./DeveloperContext";
import { settingsApi } from "../api/settingsApi";

vi.mock("../api/settingsApi", () => ({
    settingsApi: {
        getSettings: vi.fn(),
        updateSettings: vi.fn(),
    },
}));

const base = { name: "Shop", phone: "1", address: "A", gst: "G", email: "e", serviceLogIdPrefix: "" };

describe("shop config <-> settings mapping", () => {
    it("maps snake_case settings onto camelCase config and keeps local values for unset keys", () => {
        const result = settingsToShopConfig(
            { service_log_id_prefix: "srv-!", shop_name: "Server Shop", shop_phone: null },
            base
        );
        expect(result.serviceLogIdPrefix).toBe("srv-");
        expect(result.name).toBe("Server Shop");
        expect(result.phone).toBe("1");
    });

    it("maps only the changed camelCase keys to the API shape", () => {
        expect(shopConfigToSettings({ serviceLogIdPrefix: "SRV-", gst: "33X" })).toEqual({
            service_log_id_prefix: "SRV-",
            shop_gst: "33X",
        });
    });
});

describe("DeveloperProvider server sync", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("does not call the server when there is no auth token", () => {
        renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });
        expect(settingsApi.getSettings).not.toHaveBeenCalled();
    });

    it("loads the shared prefix from the server on mount when logged in", async () => {
        localStorage.setItem("auth_token", "t");
        (settingsApi.getSettings as any).mockResolvedValue({ service_log_id_prefix: "SRV-", shop_name: null });

        const { result } = renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });

        await act(async () => { await Promise.resolve(); });
        expect(settingsApi.getSettings).toHaveBeenCalledTimes(1);
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("SRV-");
        expect(result.current.shopConfig.name).toBe("SMR Battery Shop");
    });

    it("debounces edits and saves them to the server, then reports saved", async () => {
        localStorage.setItem("auth_token", "t");
        (settingsApi.getSettings as any).mockResolvedValue({ service_log_id_prefix: "" });
        (settingsApi.updateSettings as any).mockResolvedValue({ service_log_id_prefix: "JOB" });

        const { result } = renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });
        await act(async () => { await Promise.resolve(); });

        act(() => result.current.updateShopConfig({ serviceLogIdPrefix: "J" }));
        act(() => result.current.updateShopConfig({ serviceLogIdPrefix: "JO" }));
        act(() => result.current.updateShopConfig({ serviceLogIdPrefix: "JOB" }));
        expect(settingsApi.updateSettings).not.toHaveBeenCalled();

        await act(async () => { vi.advanceTimersByTime(700); await Promise.resolve(); });

        expect(settingsApi.updateSettings).toHaveBeenCalledTimes(1);
        expect(settingsApi.updateSettings).toHaveBeenCalledWith({ service_log_id_prefix: "JOB" });
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("JOB");
        expect(result.current.settingsSyncStatus).toBe("saved");
    });

    it("keeps the local value and reports an error when the server rejects the save", async () => {
        localStorage.setItem("auth_token", "t");
        (settingsApi.getSettings as any).mockResolvedValue({});
        (settingsApi.updateSettings as any).mockRejectedValue(new Error("Unauthorized. Only admins and developers can change settings."));

        const { result } = renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });
        await act(async () => { await Promise.resolve(); });

        act(() => result.current.updateShopConfig({ serviceLogIdPrefix: "X" }));
        await act(async () => { vi.advanceTimersByTime(700); await Promise.resolve(); });

        expect(result.current.settingsSyncStatus).toBe("error");
        expect(result.current.settingsSyncError).toMatch(/Only admins and developers/);
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("X");
    });

    it("re-fetches settings when the auth:changed event fires (after login)", async () => {
        (settingsApi.getSettings as any).mockResolvedValue({ service_log_id_prefix: "SRV-" });
        const { result } = renderHook(() => useDeveloper(), { wrapper: DeveloperProvider });
        // let the deferred mount fetch run (no token yet -> no call)
        await act(async () => { await Promise.resolve(); });
        expect(settingsApi.getSettings).not.toHaveBeenCalled();

        localStorage.setItem("auth_token", "t");
        await act(async () => {
            window.dispatchEvent(new Event("auth:changed"));
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(settingsApi.getSettings).toHaveBeenCalledTimes(1);
        expect(result.current.shopConfig.serviceLogIdPrefix).toBe("SRV-");
    });
});

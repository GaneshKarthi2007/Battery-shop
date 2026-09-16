import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTouchAccuracy } from "./useTouchAccuracy";

describe("useTouchAccuracy hook", () => {
    it("attaches touch and click event listeners on mount and cleans up on unmount", () => {
        const addEventListenerSpy = vi.spyOn(window, "addEventListener");
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

        const { unmount } = renderHook(() => useTouchAccuracy());

        expect(addEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function), { passive: true });
        expect(addEventListenerSpy).toHaveBeenCalledWith("click", expect.any(Function), { capture: true });

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith("click", expect.any(Function), { capture: true });
    });
});

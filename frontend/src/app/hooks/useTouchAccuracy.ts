import { useEffect } from "react";

/**
 * Custom hook to increase touch gesture response accuracy and prevent accidental clicks
 * or unintended page navigations during fast touch scrolling.
 */
export function useTouchAccuracy() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let dragResetTimer: NodeJS.Timeout | null = null;

        const DRAG_THRESHOLD_PX = 8;

        const handleTouchStart = (e: TouchEvent | PointerEvent) => {
            const point = "touches" in e ? e.touches[0] : e;
            if (point) {
                startX = point.clientX;
                startY = point.clientY;
                isDragging = false;
            }
        };

        const handleTouchMove = (e: TouchEvent | PointerEvent) => {
            const point = "touches" in e ? e.touches[0] : e;
            if (point && !isDragging) {
                const deltaX = Math.abs(point.clientX - startX);
                const deltaY = Math.abs(point.clientY - startY);

                if (deltaX > DRAG_THRESHOLD_PX || deltaY > DRAG_THRESHOLD_PX) {
                    isDragging = true;
                }
            }
        };

        const handleTouchEnd = () => {
            if (isDragging) {
                if (dragResetTimer) clearTimeout(dragResetTimer);
                dragResetTimer = setTimeout(() => {
                    isDragging = false;
                }, 150);
            }
        };

        const handleClickCapture = (e: MouseEvent) => {
            // If user was actively touch dragging/scrolling, suppress accidental misclick
            if (isDragging) {
                e.stopPropagation();
                e.preventDefault();
                isDragging = false;
            }
        };

        // Attach touch and pointer listeners with passive option for max scroll performance
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("pointerdown", handleTouchStart, { passive: true });
        window.addEventListener("pointermove", handleTouchMove, { passive: true });
        window.addEventListener("pointerup", handleTouchEnd, { passive: true });

        // Capture click event phase to block misclicks during scroll
        window.addEventListener("click", handleClickCapture, { capture: true });

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("pointerdown", handleTouchStart);
            window.removeEventListener("pointermove", handleTouchMove);
            window.removeEventListener("pointerup", handleTouchEnd);
            window.removeEventListener("click", handleClickCapture, { capture: true });
            if (dragResetTimer) clearTimeout(dragResetTimer);
        };
    }, []);
}

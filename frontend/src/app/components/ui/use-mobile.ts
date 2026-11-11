import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    // matchMedia is missing in some test environments (jsdom); fall back to resize events.
    const mql = typeof window.matchMedia === "function"
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      : null;
    if (mql && typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
  }, []);

  return !!isMobile;
}

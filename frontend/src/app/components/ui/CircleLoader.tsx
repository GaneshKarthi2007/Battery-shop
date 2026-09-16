import { Zap } from "lucide-react";
import { useNetworkSpeed, ConnectionTier } from "../../hooks/useNetworkSpeed";

export interface CircleLoaderProps {
    size?: "sm" | "md" | "lg" | "fullscreen";
    className?: string;
    text?: string;
}

export function CircleLoader({
    size = "md",
    className = "",
    text = "Loading...",
}: CircleLoaderProps) {
    const { connectionTier, spinDuration, isOnline } = useNetworkSpeed();

    // Size dimensions mapping
    const dimensions = {
        sm: { container: "w-5 h-5", svg: 24, stroke: 3, icon: "w-2.5 h-2.5" },
        md: { container: "w-10 h-10", svg: 44, stroke: 3.5, icon: "w-4 h-4" },
        lg: { container: "w-20 h-20", svg: 80, stroke: 4.5, icon: "w-8 h-8" },
        fullscreen: { container: "w-28 h-28", svg: 110, stroke: 5, icon: "w-10 h-10" },
    }[size];

    // Color theme mapping by speed tier
    const themeColors: Record<
        ConnectionTier,
        { stroke: string; glow: string; text: string }
    > = {
        fast: {
            stroke: "url(#blue-cyan-gradient)",
            glow: "drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]",
            text: "from-blue-500 to-cyan-400",
        },
        moderate: {
            stroke: "url(#amber-blue-gradient)",
            glow: "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
            text: "from-blue-600 to-amber-500",
        },
        slow: {
            stroke: "url(#rose-amber-gradient)",
            glow: "drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]",
            text: "from-rose-500 to-amber-500",
        },
    };

    const currentTheme = isOnline ? themeColors[connectionTier] : themeColors.slow;

    // Small inline spinner rendering
    if (size === "sm") {
        return (
            <div className={`relative inline-flex items-center justify-center ${dimensions.container} ${className}`}>
                <svg
                    className="w-full h-full animate-spin"
                    style={{ animationDuration: `${spinDuration}s` }}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            </div>
        );
    }

    const loaderContent = (
        <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
            {/* Concentric SVG Circular Loader */}
            <div className={`relative flex items-center justify-center ${dimensions.container}`}>
                {/* SVG Definitions for dynamic linear gradients */}
                <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
                    <defs>
                        <linearGradient id="blue-cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                        <linearGradient id="amber-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="rose-amber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Outer Orbit Ring (Static Track) */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="text-gray-200 dark:text-slate-800"
                        stroke="currentColor"
                        strokeWidth={dimensions.stroke}
                        fill="none"
                    />
                </svg>

                {/* Dynamic Rotating SVG Sweep Ring (Speed Synced via spinDuration) */}
                <svg
                    className={`absolute inset-0 w-full h-full transform -rotate-90 animate-spin ${currentTheme.glow}`}
                    style={{ animationDuration: `${spinDuration}s` }}
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={currentTheme.stroke}
                        strokeWidth={dimensions.stroke}
                        strokeDasharray="264"
                        strokeDashoffset="75"
                        strokeLinecap="round"
                        fill="none"
                    />
                </svg>

                {/* Secondary Counter-Rotating Dash Pattern Circle */}
                <svg
                    className="absolute inset-0 w-full h-full transform rotate-45 animate-spin opacity-40"
                    style={{ animationDuration: `${spinDuration * 1.8}s`, animationDirection: "reverse" }}
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="8 8"
                        className="text-blue-500 dark:text-blue-400"
                        fill="none"
                    />
                </svg>

                {/* Center Core Bolt/Pulse Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap
                        className={`${dimensions.icon} text-blue-600 dark:text-cyan-400 animate-pulse`}
                        fill="currentColor"
                    />
                </div>
            </div>

            {/* Loading Title Text */}
            {text && (
                <div className="flex flex-col items-center">
                    <p
                        className={`text-sm font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.text} animate-pulse`}
                    >
                        {text}
                    </p>
                </div>
            )}
        </div>
    );

    if (size === "fullscreen") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 dark:bg-slate-950/80 backdrop-blur-lg transition-all duration-300">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}

export function PageLoader({ text = "Loading Page..." }: { text?: string }) {
    return (
        <div className="min-h-[300px] w-full flex items-center justify-center p-6">
            <CircleLoader size="lg" text={text} />
        </div>
    );
}

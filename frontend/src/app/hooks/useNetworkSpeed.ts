import { useState, useEffect } from "react";

export type ConnectionTier = "fast" | "moderate" | "slow";

export interface NetworkSpeedState {
    speedMbps: number;
    pingMs: number;
    connectionTier: ConnectionTier;
    spinDuration: number; // in seconds
    effectiveType: string;
    isOnline: boolean;
}

interface NetworkInformation extends EventTarget {
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
    connection?: NetworkInformation;
}

// Global metric store updated by API timing or connection API
let latestLatencyMs: number | null = null;
const listeners = new Set<(latency: number) => void>();

export function reportApiLatency(latencyMs: number) {
    latestLatencyMs = latencyMs;
    listeners.forEach((listener) => listener(latencyMs));
}

export function useNetworkSpeed(): NetworkSpeedState {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );

    const [pingMs, setPingMs] = useState<number>(() => {
        return latestLatencyMs ?? 45; // Default healthy 45ms latency
    });

    const [networkInfo, setNetworkInfo] = useState<{
        downlink?: number;
        effectiveType?: string;
        rtt?: number;
    }>(() => {
        if (typeof navigator !== "undefined" && "connection" in navigator) {
            const conn = (navigator as NavigatorWithConnection).connection;
            return {
                downlink: conn?.downlink,
                effectiveType: conn?.effectiveType,
                rtt: conn?.rtt,
            };
        }
        return {};
    });

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        const onLatencyUpdate = (latency: number) => {
            setPingMs((prev) => Math.round(prev * 0.7 + latency * 0.3)); // Exponential moving average
        };
        listeners.add(onLatencyUpdate);

        // Listen for browser Network Information API changes if available
        let connectionObj: NetworkInformation | undefined = undefined;
        const handleConnectionChange = () => {
            if (connectionObj) {
                setNetworkInfo({
                    downlink: connectionObj.downlink,
                    effectiveType: connectionObj.effectiveType,
                    rtt: connectionObj.rtt,
                });
            }
        };

        if (typeof navigator !== "undefined" && "connection" in navigator) {
            connectionObj = (navigator as NavigatorWithConnection).connection;
            if (connectionObj && connectionObj.addEventListener) {
                connectionObj.addEventListener("change", handleConnectionChange);
            }
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            listeners.delete(onLatencyUpdate);
            if (connectionObj && connectionObj.removeEventListener) {
                connectionObj.removeEventListener("change", handleConnectionChange);
            }
        };
    }, []);

    // Calculate effective speed Mbps
    let speedMbps = 15; // default fallback speed
    if (networkInfo.downlink && networkInfo.downlink > 0) {
        speedMbps = networkInfo.downlink;
    } else if (pingMs > 0) {
        // Derive approximate speed tier from latency ping if connection.downlink is missing
        if (pingMs < 80) speedMbps = 35;
        else if (pingMs < 180) speedMbps = 12;
        else if (pingMs < 350) speedMbps = 3.5;
        else speedMbps = 0.8;
    }

    // Determine connection tier and dynamic spin duration
    let connectionTier: ConnectionTier = "fast";
    let spinDuration = 0.7; // fast rotation (0.7s)

    if (!isOnline || speedMbps < 1.5 || pingMs > 300) {
        connectionTier = "slow";
        spinDuration = 2.0; // slow pulse spin (2.0s)
    } else if (speedMbps < 8 || pingMs > 120) {
        connectionTier = "moderate";
        spinDuration = 1.2; // moderate spin (1.2s)
    } else {
        connectionTier = "fast";
        spinDuration = 0.6; // high-speed spin (0.6s)
    }

    const effectiveType =
        networkInfo.effectiveType?.toUpperCase() || (isOnline ? "ONLINE" : "OFFLINE");

    return {
        speedMbps: Number(speedMbps.toFixed(1)),
        pingMs: Math.round(networkInfo.rtt || pingMs),
        connectionTier,
        spinDuration,
        effectiveType,
        isOnline,
    };
}

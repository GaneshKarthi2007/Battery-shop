import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export function BatteryLoader() {
    const [charge, setCharge] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCharge((prev) => (prev >= 100 ? 0 : prev + 5));
        }, 50); // Faster updates for smooth fill 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
            <div className="relative w-24 h-32 flex items-center justify-center">
                {/* Background/Empty Bolt */}
                <Zap
                    className="absolute inset-0 w-full h-full text-blue-100"
                    strokeWidth={1}
                />

                {/* Filled Bolt (Clipped) */}
                <div
                    className="absolute inset-0 overflow-hidden transition-all duration-75 ease-linear"
                    style={{
                        clipPath: `inset(${100 - charge}% 0 0 0)` // Clips from top based on charge %
                    }}
                >
                    <Zap
                        className="w-full h-full text-blue-600 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        fill="currentColor"
                        strokeWidth={0}
                    />
                </div>

                {/* Pulse effect at 100% */}
                {charge >= 95 && (
                    <div className="absolute inset-0 animate-ping opacity-20">
                        <Zap className="w-full h-full text-blue-400" fill="currentColor" />
                    </div>
                )}
            </div>

            {/* Loading Text */}
            <h3 className="mt-8 text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-700 animate-pulse uppercase">
                Loading
            </h3>
        </div>
    );
}

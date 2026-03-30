interface CircleLoaderProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function CircleLoader({ size = "md", className = "" }: CircleLoaderProps) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-6 h-6 border-2",
        lg: "w-10 h-10 border-[3px]",
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
            <div
                className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
            />
            {size === "lg" && (
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">
                    Loading
                </p>
            )}
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-[200px] w-full flex items-center justify-center">
            <CircleLoader size="lg" />
        </div>
    );
}

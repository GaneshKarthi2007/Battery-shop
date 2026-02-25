import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router";
import { AlertTriangle, Home, RefreshCcw, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";

export function ErrorPage() {
    const error = useRouteError();
    const navigate = useNavigate();

    let errorMessage = "An unexpected error occurred.";
    let errorStatus = "Error";

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status.toString();
        errorMessage = error.statusText || error.data?.message || errorMessage;
        if (error.status === 404) {
            errorMessage = "Oops! The page you're looking for doesn't exist.";
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-50 animate-pulse" />
                    <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto border border-red-50">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-black text-gray-900 tracking-tighter">
                        {errorStatus}
                    </h1>
                    <h2 className="text-xl font-bold text-gray-800">
                        System Mismatch Detected
                    </h2>
                    <p className="text-gray-500 font-medium">
                        {errorMessage}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="flex items-center justify-center gap-2 py-4 border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => navigate("/")}
                        className="flex items-center justify-center gap-2 py-4 bg-gray-900 text-white hover:bg-black"
                    >
                        <Home className="w-4 h-4" />
                        Control Panel
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="ghost"
                        className="col-span-full flex items-center justify-center gap-2 py-3 text-blue-600 font-bold"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reboot Application
                    </Button>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                        PowerCell Pro OS v2.4.0
                    </p>
                </div>
            </div>
        </div>
    );
}

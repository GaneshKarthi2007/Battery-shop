import { RouterProvider } from "react-router";
import { router } from "./routes";
import { DeveloperProvider } from "./contexts/DeveloperContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useTouchAccuracy } from "./hooks/useTouchAccuracy";

function AppContent() {
    useTouchAccuracy();
    return <RouterProvider router={router} />;
}

export default function App() {
    return (
        <DeveloperProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </DeveloperProvider>
    );
}

import { RouterProvider } from "react-router";
import { router } from "./routes";
import { DeveloperProvider } from "./contexts/DeveloperContext";
import { ThemeProvider } from "./contexts/ThemeContext";

export default function App() {
  return (
    <DeveloperProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </DeveloperProvider>
  );
}

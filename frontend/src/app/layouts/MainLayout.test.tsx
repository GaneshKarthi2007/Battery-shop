import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { MainLayout } from "./MainLayout";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/" }),
  };
});

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" },
    logout: vi.fn(),
  }),
}));

vi.mock("../contexts/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: 0,
    notifications: [],
  }),
}));

describe("MainLayout Sidebar Accordion Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders navigation items including Management, Account, Configuration, and Report Home", () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Management")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Report Home")).toBeInTheDocument();
  });

  it("closes previously open dropdown when another dropdown is opened (single open accordion)", () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    // Initial state has Management open
    expect(screen.getByText("Battery Sales")).toBeInTheDocument();
    expect(screen.queryByText("MISC Transaction")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();

    // Click "Account" dropdown
    const accountBtn = screen.getByText("Account");
    fireEvent.click(accountBtn);

    // "Account" submenu should be open, and "Management" submenu should be closed!
    expect(screen.getByText("MISC Transaction")).toBeInTheDocument();
    expect(screen.queryByText("Battery Sales")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();

    // Now click "Configuration" dropdown
    const configBtn = screen.getByText("Configuration");
    fireEvent.click(configBtn);

    // "Configuration" submenu should be open, and "Account" submenu should now be closed!
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.queryByText("MISC Transaction")).not.toBeInTheDocument();
    expect(screen.queryByText("Battery Sales")).not.toBeInTheDocument();
  });

  it("closes the currently open dropdown when clicked again", () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    // Initial state: Management open
    expect(screen.getByText("Battery Sales")).toBeInTheDocument();

    // Click "Management" again to close it
    const managementBtn = screen.getByText("Management");
    fireEvent.click(managementBtn);

    // Should now be closed
    expect(screen.queryByText("Battery Sales")).not.toBeInTheDocument();
    expect(screen.queryByText("MISC Transaction")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManagerDashboard } from './ManagerDashboard';
import { apiClient } from '../api/client';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 2, name: 'Morgan Manager', email: 'morgan@example.com', role: 'manager' },
  }),
}));

vi.mock('../contexts/DeveloperContext', () => ({
  useDeveloper: () => ({
    shopConfig: { name: 'SMR Battery Shop', phone: '1234567890', address: 'Main St', gst: 'GST123' },
  }),
}));

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('ManagerDashboard Component', () => {
  const mockManagerData = {
    todaySales: 24500,
    todayProfit: 5500,
    pendingPayments: 1200,
    todayExchangesCount: 4,
    todayExchangesValue: 3200,
    todayServicesCount: 6,
    lowStockCount: 2,
    outstandingCustomerBalance: 4500,
    timeframeSales: 24500,
    totalStock: 180,
    pendingServices: 3,
    serviceStats: {
      unassigned: 1,
      pendingPayments: 2,
      escalated: 0,
    },
    lowStockItems: [
      { id: 10, name: 'PowerCell 35Ah', brand: 'Exide', model: 'SF35', stock: 1, min_stock: 5 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue(mockManagerData);
  });

  it('renders manager control center header and operational stats', async () => {
    render(<ManagerDashboard />);

    expect(await screen.findByText(/Manager Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Morgan/i)).toBeInTheDocument();

    // Key metrics
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    expect(screen.getByText("Active Services")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Alerts")).toBeInTheDocument();
    expect(screen.getByText("Outstanding Balance")).toBeInTheDocument();

    expect(screen.getByText("₹24,500")).toBeInTheDocument();
    expect(screen.getByText("₹4,500")).toBeInTheDocument();
  });

  it('navigates to customer management when Customer Management button is clicked', async () => {
    render(<ManagerDashboard />);

    const custBtn = await screen.findByRole('button', { name: /Customer Management/i });
    await userEvent.click(custBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/customers');
  });

  it('navigates to service management console when button is clicked', async () => {
    render(<ManagerDashboard />);

    const serviceBtn = await screen.findByRole('button', { name: /Open Service Management Console/i });
    await userEvent.click(serviceBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/service');
  });
});

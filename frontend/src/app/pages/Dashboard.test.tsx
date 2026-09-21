import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from './Dashboard';
import { apiClient } from '../api/client';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'admin' },
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

describe('Dashboard Component', () => {
  const mockDashboardData = {
    todaySales: 15400,
    todayProfit: 3200,
    pendingPayments: 0,
    todayExchangesCount: 0,
    todayExchangesValue: 0,
    todayServicesCount: 8,
    lowStockCount: 3,
    outstandingCustomerBalance: 0,
    timeframe: '7days',
    timeframeSales: 15400,
    paymentMethodBreakdown: {},
    gstBreakdown: {
      gstSalesCount: 5,
      gstTotalAmount: 10000,
      gstTaxAmount: 1800,
      nonGstSalesCount: 2,
      nonGstTotalAmount: 5400,
    },
    topSellingBatteries: [
      { brand: 'Exide', model: 'Matrix', ah: '35Ah', total_qty: 12, total_revenue: 48000 },
      { brand: 'Amaron', model: 'Hilife', ah: '45Ah', total_qty: 8, total_revenue: 36000 },
    ],
    trendData: [
      { date: 'Sep 19', sales: 5000, profit: 1200, count: 2 },
      { date: 'Sep 20', sales: 10400, profit: 2000, count: 4 },
    ],
    totalStock: 150,
    pendingServices: 2,
    myActiveJobs: 1,
    completedToday: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue(mockDashboardData);
  });

  it('renders welcome message and updated executive cards (Sales, Profit, Service Orders, Low Stock Alerts)', async () => {
    render(<Dashboard />);

    // Check header
    expect(await screen.findByText(/Welcome back, Alex/i)).toBeInTheDocument();

    // Check Executive Cards
    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
    expect(screen.getByText("Today's Profit")).toBeInTheDocument();
    expect(screen.getByText("Service Orders")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Alerts")).toBeInTheDocument();

    // Check values
    expect(screen.getByText("₹15,400")).toBeInTheDocument();
    expect(screen.getByText("₹3,200")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument(); // Service orders count
    expect(screen.getByText("3")).toBeInTheDocument(); // Low stock count
  });

  it('does NOT render removed cards/sections (Pending Payments, Battery Exchanges, Outstanding Balance, Payment Methods)', async () => {
    render(<Dashboard />);

    await screen.findByText(/Welcome back, Alex/i);

    // Verify removed headers/cards are not present
    expect(screen.queryByText("Pending Payments")).not.toBeInTheDocument();
    expect(screen.queryByText("Battery Exchanges")).not.toBeInTheDocument();
    expect(screen.queryByText("Outstanding Balance")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Methods")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax Structure Distribution")).not.toBeInTheDocument();
  });

  it('navigates to /service when Service Orders card is clicked', async () => {
    render(<Dashboard />);

    await screen.findByText(/Welcome back, Alex/i);

    const serviceOrdersCard = screen.getByText("Service Orders").closest('div.cursor-pointer');
    expect(serviceOrdersCard).not.toBeNull();
    await userEvent.click(serviceOrdersCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/service');
  });

  it('navigates to /inventory when Low Stock Alerts card is clicked', async () => {
    render(<Dashboard />);

    await screen.findByText(/Welcome back, Alex/i);

    const lowStockCard = screen.getByText("Low Stock Alerts").closest('div.cursor-pointer');
    expect(lowStockCard).not.toBeNull();
    await userEvent.click(lowStockCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/inventory');
  });
});

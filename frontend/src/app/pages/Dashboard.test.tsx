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

describe('Dashboard Component - Wireframe Layout', () => {
  const mockDashboardData = {
    todaySales: 15400,
    todayProfit: 3200,
    pendingPayments: 0,
    todayExchangesCount: 0,
    todayExchangesValue: 0,
    todayServicesCount: 8,
    lowStockCount: 3,
    outstandingCustomerBalance: 0,
    totalCustomers: 42,
    filterSales: 15400,
    recentActivity: [
      {
        id: 101,
        type: 'Sale',
        customer_name: 'Rajesh Kumar',
        amount: 5400,
        status: 'paid',
        date: 'Today, 10:30 AM',
        created_at: '2026-11-01T10:30:00Z',
      },
      {
        id: 102,
        type: 'Service',
        customer_name: 'Anita Sharma',
        amount: 800,
        status: 'pending',
        date: 'Today, 09:15 AM',
        created_at: '2026-11-01T09:15:00Z',
      },
      {
        id: 103,
        type: 'Exchange',
        customer_name: 'Vikram Singh',
        amount: 1200,
        status: 'Completed',
        date: 'Yesterday, 04:30 PM',
        created_at: '2026-10-31T16:30:00Z',
      },
    ],
    timeframe: 'today',
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
      { date: 'Nov 01', day: 1, sales: 5000, services: 1200, profit: 1200, count: 2 },
      { date: 'Nov 05', day: 5, sales: 10400, services: 2000, profit: 2000, count: 4 },
    ],
    totalStock: 150,
    pendingServices: 7,
    myActiveJobs: 1,
    completedToday: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue(mockDashboardData);
  });

  it('renders welcome back card with user name, date, and filter dropdown', async () => {
    render(<Dashboard />);

    expect(await screen.findByText(/Welcome Back,/i)).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter timeframe/i)).toBeInTheDocument();
  });

  it('renders 3 metric cards: Today sales, Pending Services, and Total Customers with correct values', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Today sales')).toBeInTheDocument();
    expect(screen.getByText('Pending Services')).toBeInTheDocument();
    expect(screen.getByText('Total Customers')).toBeInTheDocument();

    // Verify filter dependency tags
    const filterDependentTags = screen.getAllByText('(depend on filter)');
    expect(filterDependentTags.length).toBe(2);

    // Verify card values
    expect(screen.getByText('₹15,400')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // pendingServices
    expect(screen.getByText('42')).toBeInTheDocument(); // totalCustomers
  });

  it('renders Collection graph like reference image with axes and ticks', async () => {
    render(<Dashboard />);

    expect(await screen.findByText(/Collection - /i)).toBeInTheDocument();
    expect(screen.getByText('Settled collections only')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('0.5')).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('-0.5')).toBeInTheDocument();
    expect(screen.getByText('-1.0')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders Recent Activity timeline with recent 5 activities formatted as Type (Customer Name)', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('(For recent 5)')).toBeInTheDocument();

    // Check timeline items and customer names
    expect(screen.getByText('(Rajesh Kumar)')).toBeInTheDocument();
    expect(screen.getByText('(Anita Sharma)')).toBeInTheDocument();
    expect(screen.getByText('(Vikram Singh)')).toBeInTheDocument();
  });

  it('navigates to relevant routes when metric cards are clicked', async () => {
    render(<Dashboard />);

    await screen.findByText(/Welcome Back,/i);

    // Pending services card click
    const pendingServicesCard = screen.getByText('Pending Services').closest('div.cursor-pointer');
    expect(pendingServicesCard).not.toBeNull();
    await userEvent.click(pendingServicesCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/service');

    // Total customers card click
    const totalCustomersCard = screen.getByText('Total Customers').closest('div.cursor-pointer');
    expect(totalCustomersCard).not.toBeNull();
    await userEvent.click(totalCustomersCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/customers');

    // Sales card click
    const todaySalesCard = screen.getByText('Today sales').closest('div.cursor-pointer');
    expect(todaySalesCard).not.toBeNull();
    await userEvent.click(todaySalesCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/sales');
  });

  it('refetches dashboard data when timeframe filter is changed', async () => {
    render(<Dashboard />);

    await screen.findByText(/Welcome Back,/i);

    const select = screen.getByLabelText(/Filter timeframe/i);
    await userEvent.selectOptions(select, 'month');

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard?timeframe=month');
  });
});

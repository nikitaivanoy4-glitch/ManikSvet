import { Service, Booking, AvailableDate, TimeSlot, PortfolioItem, User, ClientStats, DashboardData } from '../types';

const API_BASE = '/api/v1';

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const tgInitData = window.Telegram?.WebApp?.initData || '';
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': tgInitData,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Произошла ошибка при выполнении запроса';
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (e) {}
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  getMe: () => fetchApi<User>('/auth/me'),

  // Services
  getServices: () => fetchApi<Service[]>('/services'),
  getAllServicesAdmin: () => fetchApi<Service[]>('/services/all'),
  createService: (service: Partial<Service>) => fetchApi<Service>('/services', { method: 'POST', body: JSON.stringify(service) }),
  updateService: (id: number, service: Partial<Service>) => fetchApi<Service>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(service) }),
  deleteService: (id: number) => fetchApi<void>(`/services/${id}`, { method: 'DELETE' }),

  // Schedule
  getAvailableDates: (serviceId: number) => fetchApi<AvailableDate[]>(`/schedule/dates?service_id=${serviceId}`),
  getAvailableSlots: (serviceId: number, date: string) => fetchApi<TimeSlot[]>(`/schedule/slots?service_id=${serviceId}&booking_date=${date}`),
  updateScheduleDay: (dayData: any) => fetchApi<any>('/schedule/day', { method: 'POST', body: JSON.stringify(dayData) }),

  // Bookings
  createBooking: (data: { service_id: number; booking_date: string; start_time: string; client_name: string; client_phone: string; notes?: string }) =>
    fetchApi<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => fetchApi<Booking[]>('/bookings/my'),
  cancelBooking: (id: number) => fetchApi<Booking>(`/bookings/${id}/cancel`, { method: 'POST' }),
  rescheduleBooking: (id: number, data: { booking_date: string; start_time: string }) =>
    fetchApi<Booking>(`/bookings/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
  getAllBookingsAdmin: (statusFilter?: string, targetDate?: string) => {
    let q = '';
    if (statusFilter) q += `status_filter=${statusFilter}&`;
    if (targetDate) q += `target_date=${targetDate}&`;
    return fetchApi<Booking[]>(`/bookings?${q}`);
  },
  updateBookingStatus: (id: number, status: string) => fetchApi<Booking>(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Portfolio
  getPortfolio: () => fetchApi<PortfolioItem[]>('/portfolio'),
  getAllPortfolioAdmin: () => fetchApi<PortfolioItem[]>('/portfolio/all'),
  createPortfolioItem: (item: Partial<PortfolioItem>) => fetchApi<PortfolioItem>('/portfolio', { method: 'POST', body: JSON.stringify(item) }),
  updatePortfolioItem: (id: number, item: Partial<PortfolioItem>) => fetchApi<PortfolioItem>(`/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deletePortfolioItem: (id: number) => fetchApi<void>(`/portfolio/${id}`, { method: 'DELETE' }),

  // Settings
  getPublicSettings: () => fetchApi<Record<string, string>>('/settings'),
  updateSettings: (settings: Record<string, string>) => fetchApi<Record<string, string>>('/settings', { method: 'POST', body: JSON.stringify({ settings }) }),

  // Admin Dashboard & Clients
  getDashboardStats: () => fetchApi<DashboardData>('/admin/dashboard'),
  getClientsList: () => fetchApi<ClientStats[]>('/admin/clients'),
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        HapticFeedback?: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

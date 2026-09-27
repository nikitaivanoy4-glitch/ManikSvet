export interface User {
  id: number;
  telegram_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  is_admin: bool;
  created_at: string;
}

export interface Service {
  id: number;
  title: string;
  description?: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: number;
  user_id: number;
  service_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: BookingStatus;
  client_name: string;
  client_phone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  service?: Service;
  user?: User;
}

export interface AvailableDate {
  date: string;
  is_working: boolean;
  available_slots_count: number;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  category?: string;
  image_url: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

export interface ClientStats extends User {
  total_bookings: number;
  completed_bookings: number;
  total_spent: number;
  last_booking_date?: string;
}

export interface DashboardData {
  today: {
    date: string;
    bookings_count: number;
    revenue: number;
    free_slots_count: number;
    bookings: Booking[];
  };
  tomorrow: {
    date: string;
    bookings_count: number;
    bookings: Booking[];
  };
  month: {
    revenue: number;
    bookings_count: number;
  };
  total_clients: number;
}

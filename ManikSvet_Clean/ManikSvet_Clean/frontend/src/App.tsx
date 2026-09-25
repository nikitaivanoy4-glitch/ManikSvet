import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { ServicesView } from './components/client/ServicesView';
import { BookingWizard } from './components/client/BookingWizard';
import { PortfolioView } from './components/client/PortfolioView';
import { MyBookingsView } from './components/client/MyBookingsView';
import { InfoView } from './components/client/InfoView';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { ScheduleManager } from './components/admin/ScheduleManager';
import { BookingsManager } from './components/admin/BookingsManager';
import { ClientsManager } from './components/admin/ClientsManager';
import { ServicesManager } from './components/admin/ServicesManager';
import { PortfolioManager } from './components/admin/PortfolioManager';
import { SettingsManager } from './components/admin/SettingsManager';

import { User, Service, PortfolioItem, Booking } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('services');

  // Booking wizard preselected service
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Notify Telegram WebApp ready
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      try {
        window.Telegram.WebApp.setHeaderColor('#FFFFFF');
        window.Telegram.WebApp.setBackgroundColor('#FAF8F5');
      } catch (e) {}
    }

    // Check hash URL location for direct tab deep-linking
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      if (['services', 'book', 'portfolio', 'my-bookings', 'info', 'admin'].includes(hash)) {
        setActiveTab(hash === 'admin' ? 'admin-dashboard' : hash);
      }
    }

    Promise.all([
      api.getMe().catch(() => null),
      api.getPublicSettings().catch(() => ({})),
      api.getServices().catch(() => []),
      api.getPortfolio().catch(() => []),
    ]).then(([uData, sData, servData, portData]) => {
      if (uData) setUser(uData);
      setSettings(sData);
      setServices(servData);
      setPortfolio(portData);
    }).finally(() => setLoading(false));
  }, []);

  const handleSelectServiceForBooking = (service: Service) => {
    setBookingService(service);
    setActiveTab('book');
  };

  const handleBookingSuccess = (booking: Booking) => {
    setActiveTab('my-bookings');
  };

  const isAdminMode = activeTab.startsWith('admin');

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1817] flex flex-col">
      <Header
        user={user}
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 pb-16">
        {/* CLIENT VIEWS */}
        {activeTab === 'services' && (
          <ServicesView
            services={services}
            loading={loading}
            onSelectService={handleSelectServiceForBooking}
          />
        )}

        {activeTab === 'book' && (
          <BookingWizard
            services={services}
            selectedService={bookingService}
            user={user}
            onBookingSuccess={handleBookingSuccess}
            onCancel={() => setActiveTab('services')}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            portfolio={portfolio}
            loading={loading}
          />
        )}

        {activeTab === 'my-bookings' && (
          <MyBookingsView
            settings={settings}
            onNewBookingClick={() => setActiveTab('book')}
          />
        )}

        {activeTab === 'info' && (
          <InfoView
            settings={settings}
            onBookClick={() => setActiveTab('book')}
          />
        )}

        {/* ADMIN VIEWS */}
        {activeTab === 'admin-dashboard' && <AdminDashboard />}
        {activeTab === 'admin-schedule' && <ScheduleManager />}
        {activeTab === 'admin-bookings' && <BookingsManager />}
        {activeTab === 'admin-clients' && <ClientsManager />}
        {activeTab === 'admin-services' && <ServicesManager />}
        {activeTab === 'admin-portfolio' && <PortfolioManager />}
        {activeTab === 'admin-settings' && <SettingsManager />}
      </main>

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminMode={isAdminMode}
      />
    </div>
  );
};

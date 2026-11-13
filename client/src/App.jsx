import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import VehiclesCustomers from './pages/VehiclesCustomers';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {/* Responsive Navigation Sidebar (Desktop + Mobile off-canvas drawer) */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area (with bottom safe margin on mobile for BottomNav) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-16 md:pb-0">
          <Routes>
            <Route
              path="/"
              element={<Dashboard onOpenMobileMenu={() => setMobileOpen(true)} />}
            />
            <Route
              path="/jobs"
              element={<Jobs onOpenMobileMenu={() => setMobileOpen(true)} />}
            />
            <Route
              path="/vehicles"
              element={<VehiclesCustomers onOpenMobileMenu={() => setMobileOpen(true)} />}
            />
            <Route
              path="/inventory"
              element={<Inventory onOpenMobileMenu={() => setMobileOpen(true)} />}
            />
            <Route
              path="/invoices"
              element={<Invoices onOpenMobileMenu={() => setMobileOpen(true)} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Mobile iOS-style Bottom Tab Bar */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

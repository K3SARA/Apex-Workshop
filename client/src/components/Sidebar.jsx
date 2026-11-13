import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  Car,
  Package,
  Receipt,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Job Cards', path: '/jobs', icon: Wrench },
    { name: 'Vehicles & Clients', path: '/vehicles', icon: Car },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Invoices & Billing', path: '/invoices', icon: Receipt },
  ];

  const handleNavClick = () => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="no-print md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* Sidebar Content (Desktop Sticky + Mobile Off-Canvas Drawer) */}
      <aside
        className={`no-print flex flex-col bg-white border-r border-slate-200 transition-all duration-300 select-none z-40 shrink-0 ${
          // Desktop sizing
          collapsed ? 'md:w-20' : 'md:w-64'
        } ${
          // Mobile positioning
          mobileOpen
            ? 'fixed inset-y-0 left-0 w-72 shadow-2xl translate-x-0'
            : 'fixed inset-y-0 left-0 -translate-x-full md:relative md:translate-x-0 md:h-screen md:sticky md:top-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold tracking-tight text-slate-900">Apex Garage</span>
                <span className="text-xs text-slate-400 font-medium">Workshop OS</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-2">
            {!collapsed || mobileOpen ? 'Main Menu' : '•••'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={collapsed && !mobileOpen ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Workshop System Status Footer */}
        <div className="p-3 border-t border-slate-100 pb-safe">
          <div
            className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${
              collapsed && !mobileOpen ? 'justify-center' : ''
            }`}
          >
            <div className="relative shrink-0">
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="text-xs truncate">
                <p className="font-medium text-slate-800">Workshop Live</p>
                <p className="text-[11px] text-slate-400">SQLite Local Synced</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

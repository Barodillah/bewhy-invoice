import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  KeyRound,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Quotations', href: '/quotations', icon: FileText },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Clients', href: '/clients', icon: Users },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: KeyRound },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-brand-navy text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-full",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-slate-900">
          <div className="flex items-center gap-2">
            <img src="/logowhite.png" alt="Bewhy Logo" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold tracking-tight text-white">QUO & INV</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col mt-6 px-4 overflow-hidden">
          <ul role="list" className="flex-1 flex-col gap-y-2 overflow-y-auto no-scrollbar pb-4">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      isActive
                        ? 'bg-brand-blue text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                    )
                  }
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              </li>
            ))}
            {/* Admin-only links */}
            {user?.role === 'admin' && adminNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      isActive
                        ? 'bg-brand-blue text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                    )
                  }
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User info & Logout */}
          <div className="mt-auto mb-4 pt-4 border-t border-slate-700">
            {user && (
              <div className="px-2 mb-3">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-red-600/20 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Logout
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ setSidebarOpen }) {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />

          {/* Profile dropdown Placeholder */}
          <div className="flex items-center gap-x-4">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
              <User size={18} />
            </div>
            <span className="hidden lg:flex lg:flex-col lg:justify-center">
              <span className="text-sm font-semibold leading-5 text-slate-900" aria-hidden="true">
                {user?.name || 'User'}
              </span>
              <span className="text-xs font-medium leading-4 text-slate-500 capitalize" aria-hidden="true">
                {user?.role || 'Guest'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

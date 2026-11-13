import React from 'react';
import { Plus, RefreshCw, Menu } from 'lucide-react';

export default function Header({ title, subtitle, onRefresh, onNewJob, loading, onOpenMobileMenu }) {
  return (
    <header className="no-print h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="truncate">
          <h1 className="text-sm md:text-lg font-semibold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}

        {onNewJob && (
          <button
            onClick={onNewJob}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all active:scale-[0.98] min-h-[36px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">New Job</span>
            <span className="xs:hidden">New</span>
          </button>
        )}
      </div>
    </header>
  );
}

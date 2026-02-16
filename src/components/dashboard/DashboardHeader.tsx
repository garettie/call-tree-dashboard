import type { FC } from 'react';
import { Phone, RefreshCw, Archive, Radio } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
  loading: boolean;
  view: 'live' | 'history';
  onViewChange: (view: 'live' | 'history') => void;
}

export const DashboardHeader: FC<HeaderProps> = ({ lastUpdated, onRefresh, loading, view, onViewChange }) => {
  return (
    <header className="sticky top-4 z-50 mb-8 mx-auto max-w-[1600px] transition-all duration-300">
      <div className="glass-panel mx-0 sm:mx-0 lg:mx-0 rounded-2xl px-6 py-4 flex justify-between items-center shadow-premium ring-1 ring-white/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-green-600 flex items-center justify-center shadow-glow ring-2 ring-white">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Call Tree Dashboard</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">Real-time Emergency Response</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <button
            onClick={() => onViewChange(view === 'live' ? 'history' : 'live')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
              view === 'live'
                ? "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
                : "bg-accent-primary text-white border-accent-primary shadow-sm hover:opacity-90"
            )}
          >
            {view === 'live' ? (
              <>
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">Live</span>
              </>
            )}
          </button>

          {view === 'live' && (
            <>
              <div className="hidden md:flex flex-col items-end mr-0">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Last Updated</span>
                <span className="text-sm font-mono font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              
              <button 
                onClick={onRefresh}
                disabled={loading}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300 active:scale-95",
                  loading 
                    ? "bg-gray-100 text-gray-400" 
                    : "bg-white text-gray-600 hover:text-accent-primary hover:bg-accent-light border border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                )}
                title="Refresh Data"
              >
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};


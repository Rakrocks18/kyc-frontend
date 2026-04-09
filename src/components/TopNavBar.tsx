import { useLocation } from 'wouter';
import { logout } from '../lib/api';

interface TopNavBarProps {
  onDashboardClick?: () => void;
  onApplicationsClick?: () => void;
  activeView?: 'KYC' | 'APPLICATIONS';
}

export const TopNavBar = ({ onDashboardClick, onApplicationsClick, activeView }: TopNavBarProps) => {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <nav className="bg-white/70 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-sm shadow-slate-200/50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-slate-900">
            Verifine
          </span>
          <div className="hidden md:flex gap-6">
            <button
              className={`${activeView === 'KYC' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-emerald-600'} pb-1 transition-all font-manrope text-sm font-medium tracking-tight cursor-pointer`}
              onClick={onDashboardClick}
            >
              Dashboard
            </button>
            <button
              className={`${activeView === 'APPLICATIONS' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-emerald-600'} pb-1 transition-all font-manrope text-sm font-medium tracking-tight cursor-pointer`}
              onClick={onApplicationsClick}
            >
              My Applications
            </button>
            <button
              className="text-slate-500 hover:text-emerald-600 transition-colors font-manrope text-sm font-medium tracking-tight cursor-pointer"
              onClick={() => {
                alert("Verifine Support Center\n\nDirect Email: support@verifine.ai\nPhone: +1 (555) KYC-HELP\nAverage Response Time: < 2 hours");
              }}
            >
              Support
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-50 transition-all rounded-xl">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              notifications
            </span>
          </button>
          <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-50 transition-all rounded-xl">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              help_outline
            </span>
          </button>
          <div className="h-10 w-10 rounded-full bg-surface-container overflow-hidden border border-slate-200">
            <img
              alt="Customer profile avatar"
              className="w-full h-full object-cover"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 px-4 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

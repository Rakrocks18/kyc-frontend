import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { logout } from '../lib/api';
import { AdminDashboard } from './AdminDashboard';
import { AdminReviewDetail } from './AdminReviewDetail';

export function AdminPortal() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState('ALL');

  const handleSidebarClick = (tabId: string, filter: string) => {
    setActiveTab(tabId);
    setDashboardFilter(filter);
    setSelectedId(null);
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="text-on-surface antialiased bg-surface min-h-screen font-manrope selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(25,28,30,0.06)] flex justify-between items-center px-8 py-4 font-manrope">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-emerald-900">VerifAI Premium</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
            <input 
              className="bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary w-64" 
              placeholder="Search applicants..." 
              type="text" 
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-emerald-50/50 transition-colors text-slate-500 active:scale-95 duration-200">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-[0.5px] bg-slate-200/50"></div>
            <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-emerald-50/50 transition-colors active:scale-95 duration-200">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                A
              </div>
              <span className="material-symbols-outlined text-slate-500">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-20">
        {/* SideNavBar */}
        <aside className="h-[calc(100vh-5rem)] w-64 fixed left-0 flex flex-col p-6 gap-2 bg-slate-50 border-r border-slate-200/50 font-manrope font-medium text-sm">
          <div className="mb-8 px-2">
            <h2 className="text-lg font-black text-emerald-800 tracking-tight">Admin Panel</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">KYC Specialist</p>
          </div>
          <nav className="flex-1 flex flex-col gap-1">
            <button 
              onClick={() => handleSidebarClick('dashboard', 'ALL')}
              className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-xl ${activeTab === 'dashboard' ? 'text-emerald-700 bg-white shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-600 hover:translate-x-1 duration-300'}`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => handleSidebarClick('queue', 'VERIFICATION_IN_PROGRESS')}
              className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-xl ${activeTab === 'queue' ? 'text-emerald-700 bg-white shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-600 hover:translate-x-1 duration-300'}`}
            >
              <span className="material-symbols-outlined">fact_check</span>
              <span>Pending Reviews</span>
            </button>
            <button 
              onClick={() => handleSidebarClick('verified', 'APPROVED')}
              className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-xl ${activeTab === 'verified' ? 'text-emerald-700 bg-white shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-600 hover:translate-x-1 duration-300'}`}
            >
              <span className="material-symbols-outlined">verified_user</span>
              <span>Verified Users</span>
            </button>
            <button 
              onClick={() => handleSidebarClick('risk', 'MANUAL_REVIEW')}
              className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-xl ${activeTab === 'risk' ? 'text-emerald-700 bg-white shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-600 hover:translate-x-1 duration-300'}`}
            >
              <span className="material-symbols-outlined">analytics</span>
              <span>Risk Analytics</span>
            </button>
            <button 
              onClick={() => handleSidebarClick('settings', 'ALL')}
              className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-xl ${activeTab === 'settings' ? 'text-emerald-700 bg-white shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-600 hover:translate-x-1 duration-300'}`}
            >
              <span className="material-symbols-outlined">settings</span>
              <span>System Settings</span>
            </button>
          </nav>
          
          <div className="mt-auto pt-6 border-t border-slate-200/50 flex flex-col gap-1">
            <button 
              onClick={() => {
                // Pick first pending application if any
                alert("Searching for nearest pending application...");
                handleSidebarClick('risk', 'MANUAL_REVIEW');
              }}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-white rounded-xl py-3 font-bold shadow-lg shadow-emerald-900/10 mb-6 active:scale-95 transition-transform"
            >
              Start Batch Review
            </button>
            <button 
              onClick={() => alert("Verification Support: support@verifai.premium\n\nDirect Line: +1-800-KYC-SAFE")}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <span className="material-symbols-outlined">help</span>
              <span>Support</span>
            </button>
            <button onClick={handleLogout} className="flex items-center justify-start gap-3 px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-10 bg-surface">
          {selectedId ? (
            <AdminReviewDetail applicationId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <AdminDashboard onReview={setSelectedId} initialStatusFilter={dashboardFilter} />
          )}
        </main>
      </div>
    </div>
  );
}

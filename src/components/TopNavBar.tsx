export const TopNavBar = () => {
  return (
    <nav className="bg-white/70 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-sm shadow-slate-200/50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-slate-900">
            Verifine
          </span>
          <div className="hidden md:flex gap-6">
            <a
              className="text-emerald-700 border-b-2 border-emerald-600 pb-1 font-manrope text-sm font-medium tracking-tight"
              href="#"
            >
              Dashboard
            </a>
            <a
              className="text-slate-500 hover:text-emerald-600 transition-colors font-manrope text-sm font-medium tracking-tight"
              href="#"
            >
              My Applications
            </a>
            <a
              className="text-slate-500 hover:text-emerald-600 transition-colors font-manrope text-sm font-medium tracking-tight"
              href="#"
            >
              Support
            </a>
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
          <div className="h-10 w-10 rounded-full bg-surface-container overflow-hidden">
            <img
              alt="Customer profile avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUtr-SR-7rqZemgxGrO1_lRfD09KyVO8pMsD0bXnZJ34ZyMJHaBV-Q2tw99PA0YomI-0fvt1BJRg2Vn4zdvtrSCu-g5TroEqrwL4ylvrstz_tHcM-xX0zJZfdO-cSsiys9r3P4luHIWJyXwHD4qhhxbvrL78xrsO3j50jp_xzhlFCXTrWpgw8uZntX7nVajCATT8Qk_U8G0wkiPaO7ORnNcpQbpkeZurh4j90XtMsehGzFuAH6tYeq3pOI3W0hzOcP-owXWOZgqcdR"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

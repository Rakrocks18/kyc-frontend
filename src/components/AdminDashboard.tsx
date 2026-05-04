import { useQuery } from '@tanstack/react-query';
import { getAllKycApplications } from '../lib/api';
import { useState, useEffect } from 'react';

export function AdminDashboard({ 
  onReview, 
  initialStatusFilter = 'ALL' 
}: { 
  onReview: (id: string) => void,
  initialStatusFilter?: string
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  // Sync internal state if prop changes
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const { data: response, isLoading, error } = useQuery<{data: any[]}>({
    queryKey: ['admin-applications'],
    queryFn: getAllKycApplications as any,
    refetchInterval: 30000,
  });

  const applications: any[] = response?.data || [];

  const filteredApplications = applications.filter((app: any) => {
    const fullName = `${app.formData?.firstName || ''} ${app.formData?.lastName || ''}`.toLowerCase();
    const email = (app.user?.email || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase()) || app.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Applicant', 'Email', 'Status', 'Risk Score', 'Date'];
    const rows = filteredApplications.map(app => [
      app.id,
      `${app.formData?.firstName || ''} ${app.formData?.lastName || ''}`,
      app.user?.email || 'N/A',
      app.status,
      `${(app.riskScore || 0).toFixed(1)}%`,
      new Date(app.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc_applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-100">
        <h3 className="text-red-800 font-bold">Error loading applications</h3>
        <p className="text-red-600 text-sm mt-1">{(error as any).message}</p>
      </div>
    );
  }

  const pendingCount = applications.filter((a: any) =>
    ['DOCUMENTS_PENDING', 'VERIFICATION_IN_PROGRESS', 'MANUAL_REVIEW'].includes(a.status)
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'MANUAL_REVIEW': return 'bg-orange-100 text-orange-700';
      case 'VERIFICATION_IN_PROGRESS': return 'bg-blue-100 text-blue-700 animate-pulse';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Hero Header Section */}
      <div className="flex justify-between items-end mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Review Queue</h1>
          <p className="text-on-surface-variant leading-relaxed">
            Assess and verify pending applications. Your current performance tier allows for <span className="text-primary font-bold">priority batch processing</span>.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-fixed/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">timer</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Avg. Decision Time</p>
              <p className="text-xl font-bold text-on-surface">4m 12s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-8 bg-white shadow-sm border border-slate-100 rounded-2xl p-8 flex justify-between items-center overflow-hidden relative">
          <div className="relative z-10 w-full">
            <h3 className="text-lg font-bold text-on-surface mb-1">Queue Health</h3>
            <p className="text-on-surface-variant text-sm mb-6">Real-time status of human verification load</p>
            <div className="flex gap-12">
              <div className="cursor-pointer group" onClick={() => setStatusFilter('ALL')}>
                <span className={`block text-4xl font-black transition-colors ${statusFilter === 'ALL' ? 'text-primary' : 'text-slate-300'}`}>{pendingCount}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
              </div>
              <div className="cursor-pointer group" onClick={() => setStatusFilter('MANUAL_REVIEW')}>
                <span className={`block text-4xl font-black transition-colors ${statusFilter === 'MANUAL_REVIEW' ? 'text-amber-500' : 'text-slate-300'}`}>
                  {applications.filter((a: any) => a.status === 'MANUAL_REVIEW').length}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Escalated</span>
              </div>
              <div className="cursor-pointer group" onClick={() => setStatusFilter('APPROVED')}>
                <span className={`block text-4xl font-black transition-colors ${statusFilter === 'APPROVED' ? 'text-emerald-700' : 'text-slate-300'}`}>
                  {applications.filter((a: any) => a.status === 'APPROVED').length}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">analytics</span>
          </div>
        </div>
        <div className="col-span-4 bg-emerald-700 text-white rounded-2xl p-8 relative overflow-hidden shadow-lg shadow-emerald-900/10">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Verification Tip</h3>
            <p className="text-sm text-emerald-100/90 mb-6 leading-relaxed">
              Cross-reference biometric data with national ID registry for Tier 3 applicants missing PAN numbers.
            </p>
            <button 
              onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
              className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
            >
              View Handbook
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100/80 bg-slate-50/50">
          <div className="flex items-center gap-4 flex-1 w-full">
            <h2 className="text-lg font-bold text-on-surface whitespace-nowrap">Requests</h2>
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                type="text"
                placeholder="Search name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="VERIFICATION_IN_PROGRESS">Verifying</option>
            </select>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Applicant</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Date Submitted</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Risk Score</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                    No applications matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app: any) => {
                  const firstName = app.formData?.firstName || 'Draft';
                  const lastName = app.formData?.lastName || 'User';
                  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                  const riskScore = app.riskScore || 0;
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{firstName} {lastName}</p>
                            <p className="text-xs text-on-surface-variant font-mono">{app.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-on-surface">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        {app.status === 'FORM_DRAFT' ? (
                          <span className="text-xs text-slate-400">Not analyzed</span>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                              <div 
                                className={`h-full rounded-full ${riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.max(10, riskScore)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-bold ${riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {riskScore.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(app.status)}`}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => onReview(app.id)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

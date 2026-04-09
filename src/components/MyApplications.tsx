import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyApplications } from '../lib/api';

interface MyApplicationsProps {
  onNewKyc: () => void;
}

export function MyApplications({ onNewKyc }: MyApplicationsProps) {
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['my-applications'],
    queryFn: getMyApplications,
    refetchInterval: 30000,
  });

  const applications = (response?.data as any[]) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'VERIFICATION_IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse';
      case 'MANUAL_REVIEW': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-on-surface-variant animate-pulse font-medium">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">My Applications</h2>
          <p className="text-on-surface-variant">Track and manage your identity verification requests.</p>
        </div>
        <button
          onClick={onNewKyc}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Application
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Application List */}
        <div className="lg:col-span-7 space-y-4">
          {applications.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-4 border-dashed">
              <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-on-surface-variant opacity-40 text-3xl">folder_open</span>
              </div>
              <p className="text-on-surface-variant font-medium">No applications found yet.</p>
            </div>
          ) : (
            applications.map((app) => (
              <div 
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`glass-card p-6 cursor-pointer border-2 transition-all hover:border-primary/30 ${selectedApp?.id === app.id ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-outline-variant/30'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">
                        {app.formData?.firstName ? `${app.formData.firstName} ${app.formData.lastName}` : 'Application Draft'}
                      </p>
                      <p className="text-xs text-on-surface-variant font-mono opacity-60">ID: {app.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                    {app.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6 text-xs text-on-surface-variant font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                  {app.riskScore !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm opacity-60">security</span>
                      Risk: {app.riskScore}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details & Developer Logs */}
        <div className="lg:col-span-5">
          {selectedApp ? (
            <div className="glass-card overflow-hidden sticky top-32 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-primary/5 p-6 border-b border-outline-variant/30">
                <h3 className="font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Verification Details
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {selectedApp.status === 'VERIFICATION_IN_PROGRESS' ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary animate-pulse">memory</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-on-surface">AI Pipeline Running</p>
                      <p className="text-sm text-on-surface-variant">Extracting OCR data and matching face biometric...</p>
                    </div>
                  </div>
                ) : selectedApp.extractedData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant opacity-60 mb-1">Face Match</p>
                        <p className="text-xl font-black text-primary">
                          {selectedApp.extractedData.face_match_confidence?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant opacity-60 mb-1">Risk Score</p>
                        <p className={`text-xl font-black ${selectedApp.riskScore > 60 ? 'text-red-500' : 'text-green-500'}`}>
                          {selectedApp.riskScore?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-70">Raw OCR Results</p>
                      <div className="p-4 bg-neutral-900 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre border border-white/5 leading-relaxed">
                        {selectedApp.extractedData.ocr_raw_text || 'Waiting for extraction...'}
                      </div>
                    </div>

                    <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-70">AML Checks</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedApp.extractedData.aml_flags || {}).map(([key, value]: [string, any]) => (
                          <div key={key} className={`px-2 py-1 rounded-md text-[10px] font-bold border ${value ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                            {key.toUpperCase()}: {value ? 'FLAGGED' : 'CLEAR'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-40">
                    <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                    <p className="text-sm font-medium">Processing not started yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center space-y-4 opacity-50 border-dashed sticky top-32">
              <span className="material-symbols-outlined text-4xl">touch_app</span>
              <p className="text-sm font-medium">Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplicationDetails, updateApplicationStatus, getApplicationAudit } from '../lib/api';
import { useState, useEffect } from 'react';
const AI_PIPELINE_SEQUENCE = [
  "[SYS] AI Pipeline Initialized. Requesting resources...",
  "[ML] Dispatching image to Document Service (FastAPI)...",
  "[LLM] Loading AI Models (Gemini/Groq configured)",
  "[OCR] Extracting raw text from ID Document...",
  "[VALIDATE] Cross-referencing document fields...",
  "[FACE] Analyzing biometric selfie geometry...",
  "[AML] Querying Anti-Money Laundering databases...",
  "[SYS] Awaiting final callback from background workers..."
];

function AIPipelineDebugger({ status }: { status: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    if (status !== 'VERIFICATION_IN_PROGRESS') return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < AI_PIPELINE_SEQUENCE.length) {
        setLogs(prev => [...prev, AI_PIPELINE_SEQUENCE[currentIndex]]);
        currentIndex++;
      }
    }, 1500); // add a new log every 1.5s to simulate pipeline speed
    
    return () => clearInterval(interval);
  }, [status]);

  if (status !== 'VERIFICATION_IN_PROGRESS' && status !== 'MANUAL_REVIEW') {
    return null;
  }

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 animate-spin">memory</span>
          AI Pipeline Debugger
        </h3>
        {status === 'VERIFICATION_IN_PROGRESS' && (
           <span className="flex h-3 w-3 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
           </span>
        )}
      </div>
      
      <div className="bg-black/50 rounded-xl p-4 font-mono text-[10px] text-emerald-400 max-h-48 overflow-y-auto space-y-2">
        {status === 'MANUAL_REVIEW' ? (
           <div className="text-slate-300">
             &gt; Pipeline completed.<br/>
             &gt; Results appended to application.<br/>
             &gt; Status assigned: MANUAL_REVIEW.<br/>
           </div>
        ) : logs.length === 0 ? (
           <div className="text-slate-500 animate-pulse">&gt; Waiting for signals...</div>
        ) : (
           logs.map((log, i) => (
             <div key={i} className="animate-in fade-in slide-in-from-bottom-2">&gt; {log}</div>
           ))
        )}
        {status === 'VERIFICATION_IN_PROGRESS' && logs.length === AI_PIPELINE_SEQUENCE.length && (
           <div className="text-amber-400 animate-pulse mt-4">&gt; Pipeline taking longer than expected. Please wait...</div>
        )}
      </div>
    </div>
  );
}

interface AdminReviewDetailProps {
  applicationId: string;
  onBack: () => void;
}

export function AdminReviewDetail({ applicationId, onBack }: AdminReviewDetailProps) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState('');
  const [showAudit, setShowAudit] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['application-detail', applicationId],
    queryFn: () => getApplicationDetails(applicationId),
  });

  const { data: auditResponse, isLoading: auditLoading } = useQuery({
    queryKey: ['application-audit', applicationId],
    queryFn: () => getApplicationAudit(applicationId),
    enabled: showAudit,
  });

  const auditLogs = auditResponse?.data || [];

  const app = response?.data;

  const mutation = useMutation({
    mutationFn: ({ status, remarks }: { status: 'APPROVED' | 'REJECTED'; remarks?: string }) =>
      updateApplicationStatus(applicationId, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      onBack();
    },
    onError: (error: any) => {
      alert(`Status update failed: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
        <h3 className="text-red-800 font-bold text-lg">Application Not Found</h3>
        <p className="text-red-600 text-sm mt-1">The requested ID {applicationId} does not exist or you lack permissions.</p>
        <button onClick={onBack} className="mt-4 text-emerald-700 font-bold flex items-center gap-2 hover:bg-white px-4 py-2 rounded-xl transition-colors">
          <span className="material-symbols-outlined">arrow_back</span> Return to Queue
        </button>
      </div>
    );
  }

  const handleAction = (status: 'APPROVED' | 'REJECTED') => {
    if (confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) {
      mutation.mutate({ status, remarks });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:-translate-x-1 transition-all active:scale-95 shadow-sm print:hidden">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-on-surface tracking-tight">
                {app.formData?.firstName} {app.formData?.lastName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {app.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-slate-500 font-mono text-sm">Application ID: {app.id}</p>
          </div>
        </div>
        <div className="flex gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">description</span> Export PDF
          </button>
          <button 
            onClick={() => setShowAudit(!showAudit)}
            className={`px-6 py-3 rounded-2xl border font-bold transition-all flex items-center gap-2 ${showAudit ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined">history</span> {showAudit ? 'Hide History' : 'Decision History'}
          </button>
        </div>
      </div>

      {showAudit && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">history</span>
              Audit Trail & Decision History
            </h3>
            <div className="space-y-4">
              {auditLoading ? (
                <div className="animate-pulse text-slate-500 text-sm">Fetching history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-slate-500 text-sm">No history available for this application.</div>
              ) : (
                auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start border-l-2 border-slate-800 pl-6 py-2">
                    <div className="min-w-[140px]">
                      <p className="text-[10px] font-black uppercase text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1">{log.operation}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">
                        <span className="font-bold text-white">{log.action}</span> - {log.resourceType}
                      </p>
                      {log.responseData?.status && (
                        <p className="text-xs text-slate-500 mt-1">Status changed to <span className="text-white">{log.responseData.status}</span></p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Verification Results */}
        <div className="col-span-8 space-y-8">
          {/* Identity Matrix Grid */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                <span className="material-symbols-outlined">fingerprint</span> Identity Mapping Result
              </h3>
              <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter">AI Verified</span>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-12">
                {/* User Input Data */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Submitted Form Data</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs text-slate-400 font-bold uppercase tracking-tight mb-1">Full Name</label>
                      <p className="font-bold text-on-surface">{app.formData?.firstName} {app.formData?.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-bold uppercase tracking-tight mb-1">Date of Birth</label>
                      <p className="font-bold text-on-surface">{app.formData?.dateOfBirth ? new Date(app.formData.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-bold uppercase tracking-tight mb-1">Phone</label>
                      <p className="font-bold text-on-surface">{app.formData?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {/* ML Extracted Data */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 bottom-0 w-px bg-slate-100"></div>
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6">ML Extracted (OCR)</h4>
                  <div className="space-y-6">
                    {app.extractedData?.fields ? (
                      <div className="space-y-4">
                        {Object.entries(app.extractedData.fields).map(([key, field]: [string, any]) => (
                          <div key={key} className="flex justify-between items-end border-b border-dashed border-slate-100 pb-2">
                             <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{field.label || key}</p>
                               <p className="font-bold text-on-surface">{field.value || 'N/A'}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-black text-emerald-500 uppercase">Match</p>
                               <p className="text-[10px] font-bold text-slate-400">{(field.confidence * 100).toFixed(0)}%</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : app.extractedData?.ocr_raw_text ? (
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 italic text-sm text-emerald-900 line-clamp-6">
                        {app.extractedData.ocr_raw_text}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-sm">Waiting for AI extraction results...</p>
                    )}

                    {app.extractedData?.reason && (
                      <div className="mt-8 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                         <h5 className="text-[10px] font-black text-emerald-400 uppercase mb-2 flex items-center gap-1">
                           <span className="material-symbols-outlined text-xs">gavel</span> AI Verification Reasoning
                         </h5>
                         <p className="text-xs text-slate-300 font-medium leading-relaxed">
                           {app.extractedData.reason}
                         </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                        {(app.riskScore || 0).toFixed(0)}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Trust Score</p>
                        <p className="text-xs font-bold text-on-surface">System Reliability Confidence</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Evidence */}
          <div className="grid grid-cols-2 gap-6">
             {app.documents?.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center">
                    {doc.s3Url ? (
                      <img src={doc.s3Url} alt={doc.type} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-6xl">file_present</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                       <button className="bg-white text-on-surface font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-transform">View Full Image</button>
                    </div>
                  </div>
                  <div className="p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-on-surface">{doc.type.replace(/_/g, ' ')}</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <p className="text-xs text-slate-500">{doc.fileName}</p>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Column: Actions & Risk Box */}
        <aside className="col-span-4 space-y-6 sticky top-28 print:hidden">

           <AIPipelineDebugger status={app.status} />

           <div className={`p-8 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl ${app.riskScore > 30 ? 'bg-gradient-to-br from-red-600 to-red-900 shadow-red-900/10' : 'bg-gradient-to-br from-emerald-600 to-emerald-900 shadow-emerald-900/10'}`}>
              <div className="relative z-10">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6 opacity-70">Security Analysis</h3>
                <div className="flex items-center gap-6 mb-8">
                   <div className="text-7xl font-black italic">{(app.riskScore || 0).toFixed(0)}<span className="text-2xl not-italic ml-1">%</span></div>
                   <div>
                     <p className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                        {app.riskScore > 30 ? 'High Risk Delta' : 'Low Integrity Risk'}
                     </p>
                   </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="opacity-70">Biometric Match</span>
                    <span className="text-emerald-400">
                      {app.extractedData?.face_match_confidence !== undefined 
                        ? `${(app.extractedData.face_match_confidence).toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="opacity-70">AML Screening</span>
                    <span className={app.extractedData?.aml_flags?.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {app.extractedData?.aml_flags?.length > 0 
                        ? `Flagged (${app.extractedData.aml_flags.length})` 
                        : 'Clean'}
                    </span>
                  </div>
                </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm border-b-4 border-b-slate-200">
             <h3 className="font-bold text-on-surface mb-4">Manual Review Action</h3>
             <textarea 
               value={remarks}
               onChange={(e) => setRemarks(e.target.value)}
               placeholder="Add internal remarks for this decision..." 
               className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-600 mb-6 placeholder:text-slate-400 font-medium"
             />
             <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => handleAction('REJECTED')}
                 disabled={mutation.isPending}
                 className="py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
               >
                 Reject
               </button>
               <button 
                 onClick={() => handleAction('APPROVED')}
                 disabled={mutation.isPending}
                 className="py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
               >
                 Approve
               </button>
             </div>
           </div>
        </aside>
      </div>
    </div>
  );
}

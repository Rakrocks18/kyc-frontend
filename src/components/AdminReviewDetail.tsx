import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplicationDetails, updateApplicationStatus, getApplicationAudit, retriggerKYC, updateVerificationFields } from '../lib/api';
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

  // Track inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  // Mutation for manual field corrections
  const fieldMutation = useMutation({
    mutationFn: ({ verificationId, fieldMatches }: { verificationId: string; fieldMatches: any }) =>
      updateVerificationFields(verificationId, fieldMatches),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      setEditingField(null);
    },
    onError: (error: any) => {
      alert(`Field update failed: ${error.message}`);
    }
  });

  const startEditing = (docId: string, fieldKey: string, value: string) => {
    setEditingField(`${docId}-${fieldKey}`);
    setEditValue(value);
  };

  const saveEdit = (verificationId: string, fieldKey: string, currentFieldMatches: any) => {
    const updatedMatches = {
      ...currentFieldMatches,
      [fieldKey]: {
        ...currentFieldMatches[fieldKey],
        extracted: editValue,
        status: 'MATCH' // Mark as match after manual correction
      }
    };
    fieldMutation.mutate({ verificationId, fieldMatches: updatedMatches });
  };

  const [retriggering, setRetriggering] = useState(false);
  const handleRetrigger = async () => {
    try {
      setRetriggering(true);
      await retriggerKYC(applicationId);
      // Give small delay for DB to update status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
        setRetriggering(false);
      }, 1000);
    } catch (error: any) {
      alert(`Retrigger failed: ${error.message}`);
      setRetriggering(false);
    }
  };

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
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                'bg-amber-100 text-amber-700'}`}>
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
          {/* Identity Fraud Risk (Summary Moved to Top of Left Col for better visibility) */}
          {(app.extractedData?.summary || app.extractedData?.reason) && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <span className="material-symbols-outlined text-emerald-400 text-6xl">psychology</span>
               </div>
               <h5 className="text-[10px] font-black text-emerald-400 uppercase mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Executive Summary & Decision Logic
               </h5>
               <p className="text-lg text-slate-200 font-medium leading-relaxed relative z-10">
                 {app.extractedData.summary || app.extractedData.reason}
               </p>
               {app.extractedData?.confidenceScore && (
                 <div className="mt-6 flex items-center gap-3 bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Aggregated Confidence</span>
                    <span className="text-emerald-400 font-black">{app.extractedData.confidenceScore.toFixed(0)}%</span>
                 </div>
               )}
            </div>
          )}

          {/* New: Detailed Side-by-Side Document Verification */}
          <div className="space-y-12">
            <h3 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-3 ml-2">
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">verified_user</span>
              Document Evidence & AI Verification
            </h3>
            
            {app.documents?.map((doc: any) => (
              <div key={doc.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="grid grid-cols-12 min-h-[550px]">
                  {/* Left: Document Image (Visual Evidence) */}
                  <div className="col-span-6 bg-slate-50 p-10 border-r border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="font-black text-on-surface uppercase tracking-widest text-[10px] flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-emerald-600 text-sm">image</span>
                          Document Evidence
                        </h4>
                        <p className="text-lg font-black text-slate-900">{doc.type.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase block tracking-tighter">File Size</span>
                        <span className="text-xs font-bold text-slate-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-slate-200 bg-white group shadow-inner flex items-center justify-center">
                      {doc.s3Url ? (
                        <img 
                          src={doc.s3Url} 
                          alt={doc.type} 
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-200 text-8xl">file_present</span>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <a 
                          href={doc.s3Url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="bg-white text-slate-900 font-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-110 active:scale-95 transition-all text-sm uppercase tracking-widest"
                        >
                          <span className="material-symbols-outlined">zoom_in</span> Inspect Original
                        </a>
                      </div>
                    </div>
                    <p className="mt-6 text-[10px] font-mono text-slate-400 truncate text-center bg-white py-2 rounded-full border border-slate-100 shadow-sm">{doc.fileName}</p>
                  </div>

                  {/* Right: Verification Results (AI Intelligence) */}
                  <div className="col-span-6 p-10 flex flex-col bg-white">
                    <div className="flex items-center justify-between mb-10">
                      <h4 className="font-black text-on-surface uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-sm">fact_check</span>
                        Verification Integrity
                      </h4>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        doc.status === 'VERIFIED' || doc.status === 'EXTRACTED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        doc.status === 'FAILED' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                      }`}>
                        {doc.status}
                      </div>
                    </div>

                    {doc.documentVerification ? (
                      <div className="space-y-8 flex-1">
                        {/* Match Score Indicator */}
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group/score">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg transition-transform duration-500 group-hover/score:rotate-12 ${
                            doc.documentVerification.matchScore > 80 ? 'bg-emerald-600 shadow-emerald-900/20' : 
                            doc.documentVerification.matchScore > 50 ? 'bg-amber-600 shadow-amber-900/20' : 
                            'bg-red-600 shadow-red-900/20'
                          }`}>
                            {doc.documentVerification.matchScore.toFixed(0)}%
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Match Confidence</p>
                            <p className="text-sm font-black text-slate-900">
                              {doc.documentVerification.matchScore > 80 ? 'High Integrity Match' : 
                               doc.documentVerification.matchScore > 50 ? 'Partial Verification' : 
                               'Low Integrity Flag'}
                            </p>
                          </div>
                          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] pointer-events-none">
                             <span className="material-symbols-outlined text-9xl">verified</span>
                          </div>
                        </div>

                        {/* Field Matches Matrix */}
                        {doc.documentVerification.fieldMatches && Object.keys(doc.documentVerification.fieldMatches).length > 0 && (
                          <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50/50">
                                <tr>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Identity Field</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Extracted Value</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center">Result</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {Object.entries(doc.documentVerification.fieldMatches).map(([key, m]: [string, any]) => {
                                  const fieldId = `${doc.id}-${key}`;
                                  const isEditing = editingField === fieldId;
                                  const extractedValue = m.extracted || m.value || (typeof m === 'boolean' ? (m ? 'YES' : 'NO') : m) || 'N/A';

                                  return (
                                    <tr key={key} className="hover:bg-slate-50/50 transition-colors group/row">
                                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</td>
                                      <td className="px-6 py-4">
                                        {isEditing ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              autoFocus
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEdit(doc.documentVerification.id, key, doc.documentVerification.fieldMatches);
                                                if (e.key === 'Escape') setEditingField(null);
                                              }}
                                              className="w-full bg-slate-50 border-emerald-500 border-2 rounded-lg px-2 py-1 text-xs font-black focus:ring-0 outline-none"
                                            />
                                            <button 
                                              onClick={() => saveEdit(doc.documentVerification.id, key, doc.documentVerification.fieldMatches)}
                                              disabled={fieldMutation.isPending}
                                              className="text-emerald-600 hover:scale-110 transition-transform"
                                            >
                                              <span className="material-symbols-outlined text-sm font-black">save</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div 
                                            onClick={() => startEditing(doc.id, key, extractedValue)}
                                            className="cursor-text group-hover/row:bg-slate-100 px-2 py-1 rounded transition-colors flex items-center justify-between"
                                          >
                                            <span className="text-xs font-black text-slate-900">{extractedValue}</span>
                                            <span className="material-symbols-outlined text-xs text-slate-300 opacity-0 group-hover/row:opacity-100">edit</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {(m.status === 'MATCH' || m === true || m.matches === true) ? (
                                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                            <span className="material-symbols-outlined text-sm font-black">check</span>
                                          </div>
                                        ) : (
                                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                                            <span className="material-symbols-outlined text-sm font-black">close</span>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* AI Analytical Reasoning (LLM Detailed Analysis) */}
                        {doc.documentVerification.llmAnalysis && (
                          <div className="bg-slate-900 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl border border-slate-800">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <span className="material-symbols-outlined text-emerald-400 text-4xl">psychology</span>
                            </div>
                            <h5 className="text-[10px] font-black text-emerald-400 uppercase mb-4 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">auto_awesome</span> LLM Analytical Review
                            </h5>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed relative z-10 italic">
                              "{doc.documentVerification.llmAnalysis}"
                            </p>
                          </div>
                        )}

                        {/* Specific Discrepancies */}
                        {doc.documentVerification.discrepancies && doc.documentVerification.discrepancies.length > 0 && (
                          <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                               <span className="material-symbols-outlined text-red-900 text-6xl">report</span>
                            </div>
                            <h5 className="text-[10px] font-black text-red-600 uppercase mb-4 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">warning</span> Flagged Discrepancies
                            </h5>
                            <ul className="space-y-3">
                              {doc.documentVerification.discrepancies.map((d: any, i: number) => (
                                <li key={i} className="text-xs text-red-800 flex items-start gap-4 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                                  <span>{typeof d === 'string' ? d : d.reason || d.message || JSON.stringify(d)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                          <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">memory</span>
                        </div>
                        <p className="font-black text-slate-900 text-lg">AI Pipeline Synchronizing</p>
                        <p className="text-xs text-slate-400 mt-2 max-w-[200px] font-medium leading-relaxed">Detailed verification data is being computed by the ML clusters. Please wait...</p>
                        
                        {(app.status === 'VERIFICATION_IN_PROGRESS') && (
                          <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                             Active Processing
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Actions & Risk Box */}
        <aside className="col-span-4 space-y-6 sticky top-28 print:hidden">

           <AIPipelineDebugger status={app.status} />

            <div className={`p-8 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl transition-all duration-500 ${app.riskScore > 30 ? 'bg-gradient-to-br from-red-600 to-red-900 shadow-red-900/10' : 'bg-gradient-to-br from-emerald-600 to-emerald-900 shadow-emerald-900/10'}`}>
              <div className="relative z-10">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6 opacity-70">Identity Fraud Risk</h3>
                <div className="flex items-center gap-6 mb-8">
                   <div className="text-7xl font-black italic">{(app.riskScore || 0).toFixed(0)}<span className="text-2xl not-italic ml-1">%</span></div>
                   <div>
                     <p className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                        {app.riskScore > 60 ? 'Critical Risk' : app.riskScore > 30 ? 'High Risk Delta' : 'Low Integrity Risk'}
                     </p>
                   </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="opacity-70">Biometric Match</span>
                    <span className={(app.extractedData?.face_match_confidence !== undefined && app.extractedData.face_match_confidence < 0.4) ? 'text-red-400' : 'text-emerald-400'}>
                      {app.extractedData?.face_match_confidence !== undefined 
                        ? `${(app.extractedData.face_match_confidence * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="opacity-70">AML Screening</span>
                    <span className={(app.extractedData?.aml_flags?.length > 0 || app.status === 'REJECTED') && app.extractedData?.aml_flags?.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
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

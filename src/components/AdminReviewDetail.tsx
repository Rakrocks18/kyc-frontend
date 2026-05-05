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
    }, 1500);
    
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
        status: 'MATCH'
      }
    };
    fieldMutation.mutate({ verificationId, fieldMatches: updatedMatches });
  };

  const [retriggering, setRetriggering] = useState(false);
  const handleRetrigger = async () => {
    try {
      setRetriggering(true);
      await retriggerKYC(applicationId);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
        setRetriggering(false);
      }, 1000);
    } catch (error: any) {
      alert(`Retrigger failed: ${error.message}`);
      setRetriggering(false);
    }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div></div>;

  if (!app) return <div>Application Not Found</div>;

  const handleAction = (status: 'APPROVED' | 'REJECTED') => {
    if (confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) {
      mutation.mutate({ status, remarks });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 shadow-sm print:hidden">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">{app.formData?.firstName} {app.formData?.lastName}</h1>
            <p className="text-slate-500 font-mono text-sm">Application ID: {app.id}</p>
          </div>
        </div>
        <button onClick={() => setShowAudit(!showAudit)} className="px-6 py-3 rounded-2xl border bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-2">
          <span className="material-symbols-outlined">history</span> Decision History
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-8 space-y-8">
          <div className="space-y-12">
            <h3 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">verified_user</span>
              Document Evidence & AI Verification
            </h3>
            {app.documents?.map((doc: any) => (
              <div key={doc.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="grid grid-cols-12">
                  <div className="col-span-6 bg-slate-50 p-10 border-r border-slate-100">
                    <img src={doc.s3Url} alt={doc.type} className="w-full h-auto object-contain rounded-2xl" />
                    <p className="mt-4 text-xs font-mono text-slate-400 text-center">{doc.fileName}</p>
                  </div>
                  <div className="col-span-6 p-10">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-on-surface uppercase tracking-widest text-[10px]">Verification Integrity</h4>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{doc.status}</span>
                    </div>

                    {doc.documentVerification ? (
                      <div className="space-y-6">
                         {/* Annotated Rule Results Checklist */}
                        {doc.documentVerification.ruleResults && doc.documentVerification.ruleResults.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validation Protocols</h4>
                            <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                              {doc.documentVerification.ruleResults.map((rule: any, i: number) => (
                                <div key={i} className="px-6 py-4 flex items-start gap-4 border-b border-slate-100 last:border-b-0">
                                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${rule.status === 'PASSED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    <span className="material-symbols-outlined text-sm font-black">{rule.status === 'PASSED' ? 'check' : 'close'}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900">{rule.rule}</p>
                                    <p className="text-xs text-slate-500 font-medium">{rule.details}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Analytical Reasoning */}
                        {doc.documentVerification.llmAnalysis && (
                          <div className="bg-slate-900 rounded-[2rem] p-6 text-slate-300 text-sm italic">
                            "{doc.documentVerification.llmAnalysis}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 p-8 text-center text-sm italic">Syncing with AI pipeline...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="col-span-4 space-y-6 sticky top-28">
           <AIPipelineDebugger status={app.status} />
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h3 className="font-bold text-on-surface mb-4">Manual Review Action</h3>
             <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full h-32 p-4 bg-slate-50 border rounded-2xl mb-6" placeholder="Remarks..." />
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => handleAction('REJECTED')} className="py-4 bg-red-50 text-red-600 font-black rounded-2xl">Reject</button>
               <button onClick={() => handleAction('APPROVED')} className="py-4 bg-emerald-600 text-white font-black rounded-2xl">Approve</button>
             </div>
           </div>
        </aside>
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyTenantConfig, updateMyTenantConfig } from '../lib/api';
import { useState, useEffect } from 'react';

const DOCUMENT_TYPES = [
  { id: 'AADHAR', name: 'Aadhaar Card', icon: 'badge' },
  { id: 'PAN', name: 'PAN Card', icon: 'subtitles' },
  { id: 'PASSPORT', name: 'Passport', icon: 'id_card' },
  { id: 'DRIVING_LICENSE', name: 'Driving License', icon: 'directions_car' },
  { id: 'VOTER_ID', name: 'Voter ID', icon: 'how_to_reg' },
];

const RULE_TEMPLATES = [
  { id: 'FIELD_MATCH', name: 'Identity Field Match', description: 'Extracted value must match user form data.' },
  { id: 'EXPIRY_CHECK', name: 'Validity Check', description: 'Document must not be expired.' },
  { id: 'FORMAT_VALIDATION', name: 'ID Format Check', description: 'Identity number must follow standard pattern.' },
  { id: 'MIN_CONFIDENCE', name: 'AI Confidence Threshold', description: 'Require minimum AI extraction score.' },
];

export function AdminRulesConfig() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('AADHAR');
  
  // Local state for the entire config object
  const [config, setConfig] = useState<any>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: getMyTenantConfig,
  });

  useEffect(() => {
    if (response?.data) {
      setConfig(response.data);
    }
  }, [response]);

  const mutation = useMutation({
    mutationFn: (newConfig: any) => updateMyTenantConfig(newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-config'] });
      alert('Configuration saved successfully!');
    },
    onError: (error: any) => {
      alert(`Save failed: ${error.message}`);
    }
  });

  const handleToggleDoc = (docType: string) => {
    const current = config.requiredDocuments || [];
    const updated = current.includes(docType)
      ? current.filter((t: string) => t !== docType)
      : [...current, docType];
    
    setConfig({ ...config, requiredDocuments: updated });
  };

  const handleAddRule = (docType: string, template: any) => {
    const currentRules = config.validationRules || {};
    const docRules = currentRules[docType] || { required: true, rules: [] };
    
    // Check if rule already exists
    if (docRules.rules.some((r: any) => r.id === template.id)) return;

    const newRule = {
      id: template.id,
      name: template.name,
      description: template.description,
      status: 'ACTIVE',
      severity: 'HIGH'
    };

    setConfig({
      ...config,
      validationRules: {
        ...currentRules,
        [docType]: {
          ...docRules,
          rules: [...docRules.rules, newRule]
        }
      }
    });
  };

  const handleRemoveRule = (docType: string, ruleId: string) => {
    const currentRules = config.validationRules || {};
    const docRules = currentRules[docType];
    if (!docRules) return;

    setConfig({
      ...config,
      validationRules: {
        ...currentRules,
        [docType]: {
          ...docRules,
          rules: docRules.rules.filter((r: any) => r.id !== ruleId)
        }
      }
    });
  };

  if (isLoading || !config) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeDocRules = config.validationRules?.[selectedType] || { required: false, rules: [] };
  const isDocRequired = config.requiredDocuments?.includes(selectedType);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end mb-12">
        <div>
           <h1 className="text-4xl font-black text-on-surface tracking-tight mb-2">Verification Protocols</h1>
           <p className="text-slate-500 font-medium">Configure LLM validation logic and document requirements per tenant.</p>
        </div>
        <button 
          onClick={() => mutation.mutate(config)}
          disabled={mutation.isPending}
          className="bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          {mutation.isPending ? 'Syncing...' : (
            <>
              <span className="material-symbols-outlined">cloud_sync</span>
              Save Global Config
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Sidebar: Doc Types */}
        <aside className="col-span-3 space-y-2">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all group ${
                selectedType === type.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10' 
                  : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`material-symbols-outlined ${selectedType === type.id ? 'text-white' : 'text-emerald-600'}`}>
                {type.icon}
              </span>
              <span className="font-black text-xs uppercase tracking-widest">{type.name}</span>
              {config.requiredDocuments?.includes(type.id) && (
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400"></div>
              )}
            </button>
          ))}
        </aside>

        {/* Main: Rules Editor */}
        <main className="col-span-9 space-y-8">
          {/* Doc Status Card */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDocRequired ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div>
                <h3 className="font-black text-on-surface uppercase tracking-widest text-xs">Mandatory Requirement</h3>
                <p className="text-slate-500 text-sm">Should this document be required for all KYC applications?</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggleDoc(selectedType)}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                isDocRequired 
                  ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200' 
                  : 'bg-slate-50 text-slate-400 border-2 border-slate-100 hover:border-slate-200'
              }`}
            >
              {isDocRequired ? 'Enabled' : 'Disabled'}
            </button>
          </section>

          {/* Active Rules */}
          <section className="space-y-6">
             <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-black text-on-surface flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">rule</span>
                  Active Validation Protocols
                </h2>
                <span className="bg-slate-100 text-slate-500 font-black text-[10px] px-3 py-1 rounded-full uppercase">
                  {activeDocRules.rules.length} Rules Defined
                </span>
             </div>

             <div className="grid gap-4">
               {activeDocRules.rules.length === 0 ? (
                 <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">analytics</span>
                    <p className="font-bold text-slate-400 italic">No custom rules active for {selectedType}. Standard identity checks will apply.</p>
                 </div>
               ) : (
                 activeDocRules.rules.map((rule: any) => (
                   <div key={rule.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-colors">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                         {rule.id.slice(0, 1)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-sm text-on-surface">{rule.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Severity</p>
                           <p className="text-[10px] font-bold text-red-500 uppercase">{rule.severity}</p>
                         </div>
                         <button 
                           onClick={() => handleRemoveRule(selectedType, rule.id)}
                           className="w-10 h-10 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                         >
                           <span className="material-symbols-outlined text-lg">delete</span>
                         </button>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </section>

          {/* Add Rules */}
          <section className="space-y-6 pt-6">
             <div className="px-4">
                <h2 className="text-xl font-black text-on-surface flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 bg-slate-50 p-2 rounded-xl">add_circle</span>
                  Available Protocol Templates
                </h2>
             </div>

             <div className="grid grid-cols-2 gap-4">
                {RULE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleAddRule(selectedType, tmpl)}
                    disabled={activeDocRules.rules.some((r: any) => r.id === tmpl.id)}
                    className={`text-left p-6 rounded-[2rem] border transition-all flex flex-col gap-4 group ${
                      activeDocRules.rules.some((r: any) => r.id === tmpl.id)
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-900/5'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                       <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">model_training</span>
                       {!activeDocRules.rules.some((r: any) => r.id === tmpl.id) && (
                         <span className="material-symbols-outlined text-slate-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity">add</span>
                       )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-on-surface">{tmpl.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold leading-tight mt-1">{tmpl.description}</p>
                    </div>
                  </button>
                ))}
             </div>
          </section>
        </main>
      </div>
    </div>
  );
}

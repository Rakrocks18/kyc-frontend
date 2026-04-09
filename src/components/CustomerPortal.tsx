import { useState, useEffect } from 'react';
import { QueryClientProvider, QueryClient, useQuery } from '@tanstack/react-query';
import { TopNavBar } from './TopNavBar';
import { ProgressIndicator } from './ProgressIndicator';
import { TrustBadges } from './TrustBadges';
import { BasicInfoForm } from './forms/BasicInfoForm';
import { DocumentUploadForm } from './forms/DocumentUploadForm';
import { BiometricVerificationForm } from './forms/BiometricVerificationForm';
import { SuccessModal } from './SuccessModal';
import { getActiveKyc, submitKyc, STORAGE_FORM_ID, STORAGE_APP_ID } from '../lib/api';
import { MyApplications } from './MyApplications';

export function CustomerPortal() {
  const [view, setView] = useState<'KYC' | 'APPLICATIONS'>('KYC');
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentIds, setDocumentIds] = useState<string[]>([]);

  const { data: activeAppRes, isLoading: activeAppLoading } = useQuery({
    queryKey: ['active-application'],
    queryFn: getActiveKyc,
    refetchInterval: (data) => {
      const status = (data?.data as any)?.status;
      return status === 'VERIFICATION_IN_PROGRESS' || status === 'FORM_DRAFT' ? 5000 : 30000;
    },
  });

  const appData = activeAppRes?.data as any;

  // Sync step logic whenever appData changes
  useEffect(() => {
    if (appData) {
      const status = appData.status;
      localStorage.setItem('kyc_form_id', appData.formData?.id || '');
      
      if (status === 'FORM_DRAFT') {
        setStep(1);
      } else if (status === 'DOCUMENTS_PENDING') {
        setStep(2);
      } else if (status === 'VERIFICATION_IN_PROGRESS') {
        setStep(3.5); // Intermediate step for processing
      } else {
        // APPROVED, REJECTED, MANUAL_REVIEW
        setStep(4);
      }
    }
  }, [appData]);

  useEffect(() => {
    setIsLoading(activeAppLoading);
  }, [activeAppLoading]);

  const handleStep1Success = () => {
    setShowSuccessModal(true);
  };

  const handleModalComplete = () => {
    setShowSuccessModal(false);
    setStep(2);
  };

  const handleStep2Success = (documentId: string) => {
    if (documentId) {
      setDocumentIds((prev) => [...prev, documentId]);
    }
  };

  const handleStep2Complete = () => {
    setStep(3);
  };

  const handleBiometricSuccess = async (biometricId: string) => {
    try {
      setIsSubmitting(true);
      const allIds = [...documentIds];
      if (biometricId) allIds.push(biometricId);

      const appId = localStorage.getItem(STORAGE_APP_ID);
      if (!appId) throw new Error("Application ID not found");

      await submitKyc(appId, allIds);
      
      localStorage.removeItem(STORAGE_FORM_ID);
      localStorage.removeItem(STORAGE_APP_ID);
      
      setStep(4);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewApplication = () => {
    localStorage.removeItem(STORAGE_FORM_ID);
    localStorage.removeItem(STORAGE_APP_ID);
    setDocumentIds([]);
    setStep(1);
    setView('KYC');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container font-manrope">
        <TopNavBar 
          activeView={view}
          onDashboardClick={() => setView('KYC')}
          onApplicationsClick={() => setView('APPLICATIONS')}
        />
        
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-28 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10"></div>

          {view === 'KYC' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-12 xl:col-span-12 flex flex-col xl:flex-row gap-16">
                <div className="flex-1 space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-[0.2em] shadow-sm">
                        Step 0{step}
                      </span>
                      <div className="h-px flex-1 bg-outline-variant/20 max-w-[100px]"></div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.1] animate-in slide-in-from-left-8 duration-700">
                      {step === 1 ? (
                        <>Let's start with the <span className="text-primary italic font-serif">basics</span>.</>
                      ) : (
                        <>Verify your <span className="text-primary italic font-serif">identity</span>.</>
                      )}
                    </h1>
                    <p className="text-on-surface-variant text-lg leading-relaxed max-w-md animate-in slide-in-from-left-12 duration-700 delay-100">
                      {step === 1 
                        ? "We need a few details to begin your identity verification journey. Your data is encrypted and handled with bank-grade security."
                        : "Upload a valid government-issued ID. Our AI will automatically extract and verify your information in real-time."
                      }
                    </p>
                  </div>
                  
                  <ProgressIndicator currentStep={step} />
                  <TrustBadges />
                </div>

                <div className="flex-1">
                  {step === 1 && <BasicInfoForm onSuccess={handleStep1Success} />}
                  {step === 2 && (
                    <DocumentUploadForm 
                      onSuccess={handleStep2Success} 
                      onComplete={handleStep2Complete}
                      uploadedCount={documentIds.length}
                    />
                  )}
                  {step === 3 && <BiometricVerificationForm onSuccess={handleBiometricSuccess} />}
                  {(step === 3.5 || step === 4 || isSubmitting) && (
                    <div className="glass-card p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
                      {isSubmitting || step === 3.5 ? (
                        <div className="space-y-6">
                           <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                           <h2 className="text-2xl font-bold">
                             {step === 3.5 ? "AI Verification in Progress..." : "Submitting KYC..."}
                           </h2>
                           <p className="text-on-surface-variant">
                             {step === 3.5 
                               ? "Our AI is analyzing your documents and biometric data. This usually takes less than 2 minutes." 
                               : "We are finalizing your application and starting the AI verification process."
                             }
                           </p>
                        </div>
                      ) : (
                        <>
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce ${
                            appData?.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 
                            appData?.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            <span className="material-symbols-outlined text-5xl">
                              {appData?.status === 'APPROVED' ? 'task_alt' : 
                               appData?.status === 'REJECTED' ? 'error' : 'pending_actions'}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <h2 className="text-3xl font-extrabold text-on-surface">
                              {appData?.status === 'APPROVED' ? 'Verification Successful!' : 
                               appData?.status === 'REJECTED' ? 'Verification Rejected' : 'Under Review'}
                            </h2>
                            <p className="text-on-surface-variant max-w-sm mx-auto">
                              {appData?.status === 'APPROVED' ? 'Your identity has been successfully verified. You now have full access to all features.' : 
                               appData?.status === 'REJECTED' ? 'Unfortunately, your verification was rejected. Please check your email for details or contact support.' : 
                               'Your application is currently being manually reviewed by our specialist team. This may take up to 24 hours.'}
                            </p>
                          </div>
                        </>
                      )}
                      
                      {step === 4 && appData?.status === 'APPROVED' && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 text-left">
                           <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-md">
                             <span className="material-symbols-outlined">security</span>
                           </div>
                           <div>
                             <p className="text-[10px] font-black uppercase text-green-700 opacity-70">Trust Profile Active</p>
                             <p className="text-sm font-bold text-green-900">Level 2 Verification Achieved</p>
                           </div>
                        </div>
                      )}

                      <button 
                        onClick={() => setView('APPLICATIONS')}
                        className="w-full bg-primary text-on-primary font-black py-4 rounded-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                      >
                        View My Applications
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <MyApplications onNewKyc={handleNewApplication} />
          )}
        </main>
        
      <SuccessModal 
        isVisible={showSuccessModal} 
        onComplete={handleModalComplete}
      />
    </div>
  );
}

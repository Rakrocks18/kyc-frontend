import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopNavBar } from './components/TopNavBar';
import { ProgressIndicator } from './components/ProgressIndicator';
import { TrustBadges } from './components/TrustBadges';
import { BasicInfoForm } from './components/forms/BasicInfoForm';
import { SuccessModal } from './components/SuccessModal';
import "./index.css";

const queryClient = new QueryClient();

export function App() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-surface text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container font-manrope">
        <TopNavBar />
        
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            <div className="lg:col-span-5 space-y-12">
              <div className="space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-widest">
                  Step 01
                </span>
                <h1 className="text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
                  Let's start with the <span className="text-primary">basics</span>.
                </h1>
                <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
                  We need a few details to begin your identity verification journey. Your data is encrypted and handled with bank-grade security.
                </p>
              </div>
              
              <ProgressIndicator />
              <TrustBadges />
            </div>

            <div className="lg:col-span-7">
              <BasicInfoForm onSuccess={() => setShowSuccessModal(true)} />
            </div>

          </div>
        </main>
        
        <SuccessModal isVisible={showSuccessModal} />
      </div>
    </QueryClientProvider>
  );
}

export default App;

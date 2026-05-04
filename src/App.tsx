import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopNavBar } from './components/TopNavBar';
import { ProgressIndicator } from './components/ProgressIndicator';
import { TrustBadges } from './components/TrustBadges';
import { BasicInfoForm } from './components/forms/BasicInfoForm';
import { DocumentUploadForm } from './components/forms/DocumentUploadForm';
import { BiometricVerificationForm } from './components/forms/BiometricVerificationForm';
import { SuccessModal } from './components/SuccessModal';
import { getActiveKyc, submitKyc, STORAGE_FORM_ID, STORAGE_APP_ID } from './lib/api';
import { MyApplications } from './components/MyApplications';
import "./index.css";

import { Router, Switch, Route, Redirect } from 'wouter';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPortal } from './components/AdminPortal';
import { LoginScreen } from './components/LoginScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Only retry if it's potentially transient
        if (error.message.includes('Failed to fetch')) return failureCount < 3;
        return false;
      },
    },
  },
});

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBackendUp, setIsBackendUp] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor global query errors for "Failed to fetch"
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.state.error) {
        const error = event.query.state.error as any;
        if (error.message.includes('Failed to fetch')) {
          setIsBackendUp(false);
          // Auto-resolve after 5 seconds to re-attempt check
          setTimeout(() => setIsBackendUp(true), 5000);
        }
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  if (isOnline && isBackendUp) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-500">
      <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border-2 border-white/20 backdrop-blur-md">
        <span className="material-symbols-outlined animate-pulse">{isOnline ? 'dns' : 'cloud_off'}</span>
        <span>{!isOnline ? 'No Internet Connection' : 'Server Connection Lost'}</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionStatus />
      <Router>
        <Switch>
          <Route path="/login" component={LoginScreen} />
          <Route path="/admin" component={AdminPortal} />
          <Route path="/customer">
            <CustomerPortal />
          </Route>
          <Route>
            {/* Default redirect based on token presence */}
            {() => {
              const token = localStorage.getItem('auth_token');
              const role = localStorage.getItem('user_role');
              if (!token) return <Redirect to="/login" />;
              if (role === 'ADMIN' || role === 'KYC_ANALYST') return <Redirect to="/admin" />;
              return <Redirect to="/customer" />;
            }}
          </Route>
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;


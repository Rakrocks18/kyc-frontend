import { useEffect } from 'react';

export const SuccessModal = ({ 
  isVisible, 
  onComplete 
}: { 
  isVisible: boolean;
  onComplete: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/5 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
      <div className="glass-card p-12 rounded-3xl max-w-sm text-center space-y-6 ambient-shadow animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
          <span
            className="material-symbols-outlined text-4xl text-on-primary-fixed"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
          >
            check_circle
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold tracking-tight">
            Step Complete
          </h3>
          <p className="text-on-surface-variant text-sm">
            Your basic information has been saved successfully. Redirecting to documents...
          </p>
        </div>
      </div>
    </div>
  );
};

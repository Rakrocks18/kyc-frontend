import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadKYCDocument } from '../../lib/api';

interface DocumentUploadFormProps {
  onSuccess: (documentId: string) => void;
  onComplete: () => void;
  uploadedCount: number;
}

export const DocumentUploadForm = ({ onSuccess, onComplete, uploadedCount }: DocumentUploadFormProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formId = localStorage.getItem('kyc_form_id');
      if (!formId || !file || !selectedType) {
        throw new Error('Missing form data or file');
      }
      
      const typeMap: Record<string, string> = {
        aadhar: 'AADHAR',
        pan: 'PAN',
        passport: 'PASSPORT'
      };

      return uploadKYCDocument(formId, file, typeMap[selectedType]!);
    },
    onSuccess: (response: any) => {
      if (response?.data?.id) {
        onSuccess(response.data.id);
        // Clear state to allow another upload
        setFile(null);
        setSelectedType(null);
      } else {
        onSuccess('');
      }
    }
  });

  const documents = [
    { id: 'aadhar', name: 'Aadhar Card', icon: 'badge' },
    { id: 'pan', name: 'PAN Card', icon: 'credit_card' },
    { id: 'passport', name: 'Passport', icon: 'menu_book' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-card ambient-shadow rounded-2xl p-8 md:p-12 relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Select Document Type</h2>
            <p className="text-on-surface-variant text-sm">Choose the document you'd like to use for verification.</p>
          </div>
          {uploadedCount > 0 && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2 animate-in zoom-in-90 duration-300">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span className="text-xs font-bold uppercase tracking-wider">{uploadedCount} Document(s) Added</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ... (keep existing map) */}
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedType(doc.id)}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${
                selectedType === doc.id 
                ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                selectedType === doc.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-2xl">{doc.icon}</span>
              </div>
              <span className={`font-bold text-sm ${selectedType === doc.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                {doc.name}
              </span>
            </button>
          ))}
        </div>

        {selectedType && (
           /* ... existing file picker logic ... */
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            
            <div 
              onClick={handleAreaClick}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${
                file ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest/50 hover:bg-surface-container-lowest'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                file ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary'
              }`}>
                <span className="material-symbols-outlined text-3xl">{file ? 'check' : 'cloud_upload'}</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-on-surface">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, PNG, JPG (max. 10MB)'}
                </p>
              </div>
            </div>
            
            {mutation.isError && (
              <p className="mt-4 text-error text-sm text-center font-medium animate-in shake duration-300">
                {(mutation.error as any).message}
              </p>
            )}

            <button 
              onClick={() => mutation.mutate()}
              disabled={!file || mutation.isPending}
              className={`w-full mt-8 bg-primary text-on-primary font-bold py-5 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 ${
                (!file || mutation.isPending) ? 'opacity-50 cursor-not-allowed grayscale' : ''
              }`}
            >
              {mutation.isPending ? (
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
              ) : null}
              {mutation.isPending ? 'Uploading...' : 'Upload ID Document'}
            </button>
          </div>
        )}

        {!selectedType && uploadedCount > 0 && (
          <div className="pt-8 border-t border-outline-variant/10 animate-in fade-in duration-500">
            <button
              onClick={onComplete}
              className="w-full bg-surface-container-highest text-primary font-bold py-5 rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <span>Continue to Selfie Verification</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <p className="text-center mt-4 text-xs text-on-surface-variant italic">
              You can add more documents or proceed now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

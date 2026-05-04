import React, { useRef, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadBiometric } from '../../lib/api';

interface BiometricVerificationFormProps {
  onSuccess: (documentId: string) => void;
}

export function BiometricVerificationForm({ onSuccess }: BiometricVerificationFormProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formId = localStorage.getItem('kyc_form_id') || '';

  const mutation = useMutation({
    mutationFn: (blob: Blob) => uploadBiometric(formId, blob),
    onSuccess: (response: any) => {
      onSuccess(response?.data?.documentId || '');
    },
    onError: (err: any) => {
      setError(err.message || 'Verification failed');
    },
  });

  const startCamera = async () => {
    try {
      setError(null);
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(newStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Ensure stream is attached to video element after it's rendered
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;

    // Convert data URL to Blob
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    mutation.mutate(blob);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="glass-card p-8 md:p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-on-surface">Face Verification</h2>
        <p className="text-on-surface-variant max-w-sm mx-auto">
          Position your face in the center of the frame and ensure you are in a well-lit area.
        </p>
      </div>

      <div className="relative aspect-video rounded-3xl overflow-hidden bg-surface-container-highest border-2 border-outline-variant/30 shadow-inner group">
        {isCameraActive ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : capturedImage ? (
          <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">photo_camera</span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Camera preview will appear here</p>
          </div>
        )}

        {/* Overlay for Face Positioning */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[40px] border-black/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-dashed border-primary rounded-[120px] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-x-0 bottom-8 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-container px-3 py-1 rounded-full">Align Face Here</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {!isCameraActive && !capturedImage ? (
          <button 
            onClick={startCamera}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">videocam</span>
            Start Camera
          </button>
        ) : isCameraActive ? (
          <button 
            onClick={captureSnapshot}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">radio_button_checked</span>
            Capture Snapshot
          </button>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={handleRetake}
              disabled={mutation.isPending}
              className="flex-1 bg-surface-container-high text-on-surface font-bold py-4 rounded-2xl border border-outline-variant hover:bg-surface-container-highest transition-all disabled:opacity-50"
            >
              Retake
            </button>
            <button 
              onClick={handleSubmit}
              disabled={mutation.isPending || !capturedImage}
              className="flex-[2] bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl text-primary-container">verified</span>
                  <span>Verify & Continue</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

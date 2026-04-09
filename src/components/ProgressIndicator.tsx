export const ProgressIndicator = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        {/* Step 1 */}
        <div className={`flex items-center gap-4 transition-all duration-500 ${currentStep === 1 ? 'opacity-100 scale-105' : 'opacity-40 scale-100'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${currentStep >= 1 ? 'bg-primary shadow-primary/20' : 'bg-surface-container-high'}`}>
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              person
            </span>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${currentStep === 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              Basic Information
            </p>
            <p className="text-xs text-on-surface-variant">
              Identity & Contact Details
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`flex items-center gap-4 transition-all duration-500 ${currentStep === 2 ? 'opacity-100 scale-105' : 'opacity-40 scale-100'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${currentStep >= 2 ? 'bg-primary text-white shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              description
            </span>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${currentStep === 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              Document Upload
            </p>
            <p className="text-xs text-on-surface-variant">
              Passport or National ID
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className={`flex items-center gap-4 transition-all duration-500 ${currentStep === 3 ? 'opacity-100 scale-105' : 'opacity-40 scale-100'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${currentStep >= 3 ? 'bg-primary text-white shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              photo_camera
            </span>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${currentStep === 3 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              Biometric Check
            </p>
            <p className="text-xs text-on-surface-variant">
              Real-time facial verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

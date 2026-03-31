export const ProgressIndicator = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              person
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-on-surface">
              Basic Information
            </p>
            <p className="text-xs text-on-surface-variant">
              Identity & Contact Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 opacity-40">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              description
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">
              Document Upload
            </p>
            <p className="text-xs text-on-surface-variant">
              Passport or National ID
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 opacity-40">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              photo_camera
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">
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

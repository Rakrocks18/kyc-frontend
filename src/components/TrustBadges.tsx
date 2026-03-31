export const TrustBadges = () => {
  return (
    <div className="pt-8 border-t border-outline-variant/20 flex flex-wrap gap-6 items-center">
      <div className="flex items-center gap-2 grayscale opacity-60">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          encrypted
        </span>
        <span className="text-xs font-bold tracking-tight uppercase">
          AES-256 Encrypted
        </span>
      </div>
      <div className="flex items-center gap-2 grayscale opacity-60">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          gpp_good
        </span>
        <span className="text-xs font-bold tracking-tight uppercase">
          GDPR Compliant
        </span>
      </div>
      <div className="flex items-center gap-2 grayscale opacity-60">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          verified_user
        </span>
        <span className="text-xs font-bold tracking-tight uppercase">
          ISO 27001 Certified
        </span>
      </div>
    </div>
  );
};

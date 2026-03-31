import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitBasicInfo, BasicInformationRequest } from '../../lib/api';

interface BasicInfoFormProps {
  onSuccess: () => void;
}

export const BasicInfoForm = ({ onSuccess }: BasicInfoFormProps) => {
  const [formData, setFormData] = useState<BasicInformationRequest>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneExtension: '+1',
    phoneNumber: '',
  });

  const mutation = useMutation({
    mutationFn: submitBasicInfo,
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
        console.error('Submission error:', error);
    }
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="glass-card ambient-shadow rounded-2xl p-8 md:p-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
              First Name
            </label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/20 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="e.g. Alexander"
              type="text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
              Last Name
            </label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/20 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="e.g. Sterling"
              type="text"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
              Date of Birth
            </label>
            <div className="relative">
              <input
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/20 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface appearance-none"
                type="date"
              />
              <span
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                calendar_today
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
              Gender
            </label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/20 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface appearance-none"
              >
                <option disabled value="">
                  Select Gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              <span
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                unfold_more
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
            Phone Number
          </label>
          <div className="flex gap-3">
            <div className="w-24 relative">
              <select
                name="phoneExtension"
                value={formData.phoneExtension}
                onChange={handleChange}
                className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/20 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface appearance-none"
              >
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+49">+49</option>
                <option value="+33">+33</option>
                <option value="+91">+91</option>
              </select>
              <span
                className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                expand_more
              </span>
            </div>
            <input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="flex-1 bg-surface-container-lowest border-0 ring-1 ring-outline-variant/20 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="000 000 0000"
              type="tel"
            />
          </div>
        </div>
        
        {mutation.error && (
            <div className="text-error mt-4 text-sm font-semibold">
                {mutation.error.message}
            </div>
        )}

        <div className="pt-6">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-5 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
          >
            <span>{mutation.isPending ? 'Submitting...' : 'Continue to Documents'}</span>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              arrow_forward
            </span>
          </button>
          <p className="text-center mt-6 text-xs text-on-surface-variant font-medium">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </form>
    </div>
  );
};

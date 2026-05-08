// =====================================================
// KYB WIZARD (Main Container)
// =====================================================
// Description: 4-step wizard for business verification
// Uses Material Design 3 (MD3) web components
// =====================================================

'use client';

import { useState } from 'react';
// WizardData is defined below in this file
import { KybStep1Identity } from './KybStep1Identity';
import { KybStep2Representative } from './KybStep2Representative';
import { KybStep3Otp } from './KybStep3Otp';
import { KybStep4Business } from './KybStep4Business';

export interface WizardData {
  // Step 1
  personType?: 'natural' | 'juridica';
  taxId?: string;
  razonSocial?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  // Step 2
  legalRepName?: string;
  legalRepDni?: string;
  // Step 3
  legalRepPhone?: string;
  legalRepEmail?: string;
  phoneVerified?: boolean;
  // Step 4
  businessPhone?: string;
  businessEmail?: string;
  slug?: string;
}

export function KYBWizard() {
  const [step, setStep] = useState(1);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({});

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleStep1 = async (stepData: any) => {
    // We receive the data returned by the server action
    setData((prev) => ({ ...prev, ...stepData }));
    nextStep();
  };

  // Placeholder handlers for other steps
  const handleStep2 = async (_formData: FormData) => {
    nextStep();
  };
  const handleStep3 = async (_formData: FormData) => {
    nextStep();
  };
  const handleStep4 = async (_formData: FormData) => {
    /* Final submit handled inside component */
  };

  return (
    <md-card className="w-full max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
          <md-chip key={s} selected={step === s} className="capitalize">
            {s === 1
              ? 'Identidad'
              : s === 2
                ? 'Representante'
                : s === 3
                  ? 'Verificación'
                  : 'Negocio'}
          </md-chip>
        ))}
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 1 && (
        <KybStep1Identity onSubmit={handleStep1} loading={loading} initialData={data} />
      )}
      {step === 2 && (
        <KybStep2Representative onSubmit={handleStep2} loading={loading} initialData={data} />
      )}
      {step === 3 && <KybStep3Otp onSubmit={handleStep3} loading={loading} initialData={data} />}
      {step === 4 && (
        <KybStep4Business onSubmit={handleStep4} loading={loading} initialData={data} />
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <md-text-button onClick={prevStep} disabled={step === 1 || loading}>
          Atrás
        </md-text-button>
        {/* Next button is inside each step form */}
      </div>
    </md-card>
  );
}

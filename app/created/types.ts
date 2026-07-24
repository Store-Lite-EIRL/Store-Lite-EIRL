export interface BusinessData {
  personType: 'natural' | 'juridica';
  country: string;
  countryPrefix: string;
  taxId: string;
  commercialName: string;
  logo: File | null;
  sector: string;
  description: string;
  address: string; // Keep for backward compatibility
  departamento: string; // Department (from SUNAT)
  provincia: string; // Province (from SUNAT)
  distrito: string; // District (from SUNAT)
  city: string;
  phone: string;
  email: string;
  legalRepName: string;
  legalRepRole: string;
  legalRepPhone: string;
  legalRepEmail: string;
}

export type FormErrors = Record<string, string>;

export interface StepProps {
  formData: BusinessData;
  onChange: (field: keyof BusinessData, value: string) => void;
  errors: FormErrors;
  onVerificationChange?: (isVerified: boolean) => void;
  isRucVerified?: boolean;
  verifiedPhone?: string | null;
  onPhoneVerificationChange?: (phone: string | null) => void;
}

export interface BusinessData {
  personType: 'natural' | 'juridica';
  country: string;
  countryPrefix: string;
  taxId: string;
  commercialName: string;
  logo: File | null;
  sector: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  legalRepName: string;
  legalRepRole: string;
  legalRepPhone: string;
  legalRepEmail: string;
}

export type FormErrors = Record<string, string>;
